import { Octokit } from '@octokit/rest';
import type { components } from '@octokit/openapi-types';
import { GITHUB_TOKEN } from './config.js';

// API response types using Octokit's schema definitions
export type GitHubUser = components['schemas']['public-user'];
export type GitHubRepo = components['schemas']['repository']; 
export type GitHubRepoContributor = components['schemas']['contributor'];

/**
 * Custom error class for GitHub API errors with additional context
 */
class GitHubServiceError extends Error {
  public readonly status: number | undefined;
  public readonly context: string;
  public cause: Error;

  constructor(context: string, originalError: Error, status?: number) {
    super(`${context}: ${originalError.message}`);
    this.name = 'GitHubServiceError';
    this.context = context;
    this.status = status;
    this.cause = originalError; // Set error cause for better debugging (ES2022)
  }
}

/**
 * Configuration options for the GitHub service
 */
export interface GitHubServiceOptions {
  /** GitHub personal access token */
  token?: string;
  /** Custom user agent */
  userAgent?: string;
  /** Base URL for API requests */
  baseUrl?: string;
  /** Enable request caching */
  enableCache?: boolean;
  /** Cache TTL in seconds */
  cacheTtl?: number;
}

/**
 * Service for interacting with the GitHub API
 */
export class GitHubService {
  private octokit: Octokit;
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private readonly cacheTtl: number;
  private readonly enableCache: boolean;

  /**
   * Creates a new instance of the GitHub service
   * @param options - Configuration options
   */
  constructor(options: GitHubServiceOptions = {}) {
    const token = options.token || GITHUB_TOKEN;
    
    // Validate token
    if (typeof token !== 'string' || !token) {
      throw new Error('GitHub token must be a non-empty string');
    }

    this.enableCache = options.enableCache ?? false;
    this.cacheTtl = (options.cacheTtl ?? 300) * 1000; // Convert to milliseconds

    try {
      const octokitOptions: any = {
        auth: token,
        userAgent: options.userAgent || 'GitHub-API-Client',
        log: {
          debug: () => {},
          info: () => {},
          warn: console.warn,
          error: console.error
        }
      };
      if (options.baseUrl) {
        octokitOptions.baseUrl = options.baseUrl;
      }
      this.octokit = new Octokit(octokitOptions);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to initialize GitHub API client: ${message}`);
    }
  }

  /**
   * Handles API errors with appropriate context
   * @param error - The error that occurred
   * @param context - Context describing where the error occurred
   */
  private handleError(error: unknown, context: string): never {
    if (error instanceof Error) {
      // Extract status code if it's an Octokit error
      const status = (error as any)?.response?.status;
      throw new GitHubServiceError(context, error, status);
    }
    throw new GitHubServiceError(context, new Error('An unknown error occurred'));
  }

  /**
   * Gets or sets data in the cache
   * @param key - Cache key
   * @param fetchFn - Function to fetch data if not in cache
   * @returns The cached or fetched data
   */
  private async withCache<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    if (!this.enableCache) {
      return fetchFn();
    }

    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && cached.expiry > now) {
      return cached.data as T;
    }

    const data = await fetchFn();
    this.cache.set(key, { data, expiry: now + this.cacheTtl });
    return data;
  }

  /**
   * Gets information about a GitHub user
   * @param username - The username to fetch
   * @returns User information
   */
  async getUser(username: string): Promise<GitHubUser> {
    try {
      return await this.withCache(`user:${username}`, async () => {
        const response = await this.octokit.users.getByUsername({ username });
        return response.data as GitHubUser;
      });
    } catch (error: unknown) {
      this.handleError(error, `Failed to fetch user ${username}`);
    }
  }

  /**
   * Gets information about a repository
   * @param owner - The owner of the repository
   * @param repo - The repository name
   * @returns Repository information
   */
  async getRepo(owner: string, repo: string): Promise<GitHubRepo> {
    try {
      return await this.withCache(`repo:${owner}/${repo}`, async () => {
        const response = await this.octokit.repos.get({ owner, repo });
        return response.data as GitHubRepo;
      });
    } catch (error: unknown) {
      this.handleError(error, `Failed to fetch repository ${owner}/${repo}`);
    }
  }

  /**
   * Gets the contributors to a repository
   * @param owner - The owner of the repository
   * @param repo - The repository name
   * @param limit - Maximum number of contributors to return
   * @returns List of contributors
   */
  async getRepoContributors(
    owner: string,
    repo: string,
    limit: number,
  ): Promise<Array<GitHubRepoContributor>> {
    try {
      // Early return for invalid limit
      if (limit <= 0) {
        return [];
      }

      const resultContributors: GitHubRepoContributor[] = [];
      const perPage = Math.min(100, limit); // No need to fetch 100 if limit is smaller

      // Calculate how many pages we need to fetch
      const totalPages = Math.ceil(limit / perPage);

      // Fetch only the pages we need
      for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
        // For the last page, we might need fewer items
        const itemsNeeded =
          currentPage === totalPages
            ? limit - resultContributors.length
            : perPage;

        if (itemsNeeded <= 0) break;

        const response = await this.octokit.repos.listContributors({
          owner,
          repo,
          per_page: itemsNeeded,
          page: currentPage,
          anon: "false", // Whether to include anonymous contributors
        });

        const contributors = response.data as GitHubRepoContributor[];
        resultContributors.push(...contributors);

        // If we got fewer results than requested, there are no more contributors
        if (contributors.length < itemsNeeded) {
          break;
        }
      }

      // No need to sort as GitHub API returns them sorted by contributions
      // when using sort=contributions&direction=desc
      return resultContributors;
    } catch (error: unknown) {
      this.handleError(
        error,
        `Failed to fetch contributors for repository ${owner}/${repo}`,
      );
    }
  }

  /**
   * Gets the repositories for a user
   * @param username - The username to fetch repositories for
   * @param per_page - Number of repositories per page
   * @returns List of repositories
   */
  async getUserRepos(
    username: string,
    per_page: number = 30,
  ): Promise<GitHubRepo[]> {
    try {
      return await this.withCache(`userRepos:${username}`, async () => {
        const response = await this.octokit.repos.listForUser({
          username,
          per_page,
          sort: 'updated',
          direction: 'desc',
        });
        return response.data as GitHubRepo[];
      });
    } catch (error: unknown) {
      this.handleError(
        error,
        `Failed to fetch repositories for user ${username}`,
      );
    }
  }

  /**
   * Gets the rate limit status for the authenticated user
   * @returns Rate limit information
   */
  async getRateLimit(): Promise<{
    limit: number;
    remaining: number;
    reset: number;
  }> {
    try {
      const response = await this.octokit.rateLimit.get();
      const { limit, remaining, reset } = response.data.rate;
      return { limit, remaining, reset };
    } catch (error: unknown) {
      this.handleError(error, 'Failed to fetch rate limit');
    }
  }
}
