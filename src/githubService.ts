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

export interface GitHubRepoContributor {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string | null;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  contributions: number;
  email?: string;
  name?: string;
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
      const axiosError = error as import('axios').AxiosError;
      let message: string = axiosError.message;
      if (
        axiosError.response &&
        axiosError.response.data &&
        typeof axiosError.response.data === 'object' &&
        'message' in axiosError.response.data
      ) {
        message =
          (axiosError.response.data as { message?: string }).message ||
          axiosError.message;
      }
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

        const response = await this.client.get<Array<GitHubRepoContributor>>(
          `/repos/${owner}/${repo}/contributors`,
          {
            params: {
              per_page: itemsNeeded,
              page: currentPage,
              // Ensure we get the top contributors first (most contributions)
              sort: 'contributions',
              direction: 'desc',
            },
          },
        );

        resultContributors.push(...response.data);

        // If we got fewer results than requested, there are no more contributors
        if (response.data.length < itemsNeeded) {
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
      const response = await this.client.get<{
        rate: { limit: number; remaining: number; reset: number };
      }>('/rate_limit');
      const rateData = response.data.rate;
      const { limit, remaining, reset } = rateData;
      return { limit, remaining, reset };
    } catch (error: unknown) {
      this.handleError(error, 'Failed to fetch rate limit');
    }
  }
}
