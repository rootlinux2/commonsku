import axios, { AxiosInstance } from 'axios';
import { GITHUB_TOKEN } from './config.js';

const BASE_URL = 'https://api.github.com';

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
  default_branch: string;
}

export class GitHubService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-API-Client',
        ...(GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}),
      },
    });
  }

  private handleError(error: unknown, context: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as any;
      const message = axiosError.response?.data?.message || axiosError.message;
      throw new Error(`${context}: ${message}`);
    }
    throw error;
  }

  async getUser(username: string): Promise<GitHubUser> {
    try {
      const response = await this.client.get<GitHubUser>(`/users/${username}`);
      return response.data;
    } catch (error: unknown) {
      this.handleError(error, `Failed to fetch user ${username}`);
    }
  }

  async getRepo(owner: string, repo: string): Promise<GitHubRepo> {
    try {
      const response = await this.client.get<GitHubRepo>(
        `/repos/${owner}/${repo}`,
      );
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
      const response = await this.client.get<GitHubRepo[]>(
        `/users/${username}/repos`,
        {
          params: { per_page, sort: 'updated', direction: 'desc' },
        },
      );
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
      const response = await this.client.get('/rate_limit');
      const rateData = response.data.rate as {
        limit: number;
        remaining: number;
        reset: number;
      };
      const { limit, remaining, reset } = rateData;
      return { limit, remaining, reset };
    } catch (error: unknown) {
      this.handleError(error, 'Failed to fetch rate limit');
    }
  }
}
