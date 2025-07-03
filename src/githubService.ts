import { Octokit } from '@octokit/rest';
import { GITHUB_TOKEN } from './config.js';

// Ensure GITHUB_TOKEN is a string at runtime
function getSafeGitHubToken(): string {
  if (typeof GITHUB_TOKEN !== 'string' || !GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN must be a non-empty string');
  }
  return GITHUB_TOKEN;
}

// GitHub API response interfaces
export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    id: number;
    avatar_url: string;
  };
  private: boolean;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  created_at: string | null; // Updated to allow null
  updated_at: string | null; // Updated to allow null
  pushed_at: string | null;  // Updated to allow null
  clone_url: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  license: {
    key: string;
    name: string;
  } | null;
}
class GitHubServiceError extends Error {
  constructor(context: string, originalError: Error) {
    super(`${context}: ${originalError.message}`);
    this.name = 'GitHubServiceError';
  }
}
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
      const user = response.data;
      return {
        login: user.login,
        id: user.id,
        avatar_url: user.avatar_url,
        url: user.url,
        html_url: user.html_url,
        name: user.name ?? null,
        company: user.company ?? null,
        blog: user.blog ?? null,
        location: user.location ?? null,
        email: user.email ?? null,
        bio: user.bio ?? null,
        public_repos: user.public_repos,
        public_gists: user.public_gists,
        followers: user.followers,
        following: user.following,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
    } catch (error: unknown) {
      this.handleError(error, `Failed to fetch user ${username}`);
    }
  }

  async getRepo(owner: string, repo: string): Promise<GitHubRepo> {
    try {
      const response = await this.octokit.repos.get({ owner, repo });
      return response.data;
    } catch (error: unknown) {
      this.handleError(error, `Failed to fetch repository ${owner}/${repo}`);
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
