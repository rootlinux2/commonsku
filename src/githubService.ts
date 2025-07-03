import { Octokit } from 'octokit';
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
  created_at: string;
  updated_at: string;
  pushed_at: string;
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
      const response = await this.octokit.rest.users.getByUsername({ username });
      return response.data;
    } catch (error: unknown) {
      this.handleError(error, `Failed to fetch user ${username}`);
    }
  }

  async getRepo(owner: string, repo: string): Promise<GitHubRepo> {
    try {
      const response = await this.octokit.rest.repos.get({ owner, repo });
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
      const response = await this.octokit.rest.repos.listForUser({
        username,
        per_page,
        sort: 'updated',
        direction: 'desc',
      });
      return response.data;
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
      const response = await this.octokit.rest.rateLimit.get();
      const { limit, remaining, reset } = response.data.rate;
      return { limit, remaining, reset };
    } catch (error: unknown) {
      this.handleError(error, 'Failed to fetch rate limit');
    }
  }
}
