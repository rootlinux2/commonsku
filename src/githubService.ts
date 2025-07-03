import { Octokit } from '@octokit/rest';
import type { components } from '@octokit/openapi-types';
import { GITHUB_TOKEN } from './config.js';

// Ensure GITHUB_TOKEN is a string at runtime
function getSafeGitHubToken(): string {
  if (typeof GITHUB_TOKEN !== 'string' || !GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN must be a non-empty string');
  }
  return GITHUB_TOKEN;
}

// GitHub API response interfaces
export type GitHubUser = components['schemas']['public-user'];

export type GitHubRepo = components['schemas']['repository']; 
class GitHubServiceError extends Error {
  constructor(context: string, originalError: Error) {
    super(`${context}: ${originalError.message}`);
    this.name = 'GitHubServiceError';
  }
}

// Use Octokit's own type definition for contributors
export type GitHubRepoContributor = components['schemas']['contributor'];

export class GitHubService {
  private octokit: Octokit;

  constructor() {
    try {
      this.octokit = new Octokit({
        auth: getSafeGitHubToken(),
        userAgent: 'GitHub-API-Client',
      });
    } catch (error: unknown) {
      throw new Error(
        `Failed to initialize Octokit: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private handleError(error: unknown, context: string): never {
    if (error instanceof Error) {
      throw new GitHubServiceError(context, error);
    }
    throw new GitHubServiceError(
      context,
      new Error('An unknown error occurred'),
    );
  }

  async getUser(username: string): Promise<GitHubUser> {
    try {
      const response = await this.octokit.users.getByUsername({ username });
      return response.data as GitHubUser;
    } catch (error: unknown) {
      this.handleError(error, `Failed to fetch user ${username}`);
    }
  }

  async getRepo(owner: string, repo: string): Promise<GitHubRepo> {
    try {
      const response = await this.octokit.repos.get({ owner, repo });
      return response.data as GitHubRepo;
    } catch (error: unknown) {
      this.handleError(error, `Failed to fetch repository ${owner}/${repo}`);
    }
  }

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

  async getUserRepos(
    username: string,
    per_page: number = 30,
  ): Promise<GitHubRepo[]> {
    try {
      const response = await this.octokit.repos.listForUser({
        username,
        per_page,
        sort: 'updated',
        direction: 'desc',
      });
      return response.data as GitHubRepo[];
    } catch (error: unknown) {
      this.handleError(
        error,
        `Failed to fetch repositories for user ${username}`,
      );
    }
  }

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
      