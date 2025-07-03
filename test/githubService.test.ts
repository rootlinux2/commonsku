import { GitHubService } from '../src/githubService';
import { describe, it, expect, beforeAll, jest } from '@jest/globals';

describe('GitHubService', () => {
  jest.setTimeout(15000); // Set longer timeout for API calls

  let service: GitHubService;

  beforeAll(() => {
    service = new GitHubService();
  });

  it('should be instantiated', () => {
    expect(service).toBeInstanceOf(GitHubService);
  });

  it('should fetch GitHub user data', async () => {
    const user = await service.getUser('octocat');
    expect(user).toBeDefined();
    expect(user.login).toBe('octocat');
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('html_url');
  });

  it('should fetch repository information', async () => {
    const repo = await service.getRepo('octocat', 'Hello-World');
    expect(repo).toBeDefined();
    expect(repo.name).toBe('Hello-World');
    expect(repo.owner.login).toBe('octocat');
    expect(repo).toHaveProperty('html_url');
  });

  it('should fetch repository contributors', async () => {
    const contributors = await service.getRepoContributors('octocat', 'Hello-World', 5);
    expect(Array.isArray(contributors)).toBe(true);
    expect(contributors.length).toBeGreaterThan(0);
    expect(contributors.length).toBeLessThanOrEqual(5);

    const firstContributor = contributors[0];
    expect(firstContributor).toHaveProperty('login');
    expect(firstContributor).toHaveProperty('contributions');
    expect(typeof firstContributor.contributions).toBe('number');
  });

  it('should fetch user repositories', async () => {
    const repos = await service.getUserRepos('octocat', 10);
    expect(Array.isArray(repos)).toBe(true);
    expect(repos.length).toBeGreaterThan(0);
    expect(repos.length).toBeLessThanOrEqual(10);

    const firstRepo = repos[0];
    expect(firstRepo).toHaveProperty('name');
    expect(firstRepo).toHaveProperty('full_name');
    expect(firstRepo.owner.login).toBe('octocat');
  });

  it('should fetch rate limit information', async () => {
    const rateLimit = await service.getRateLimit();
    expect(rateLimit).toHaveProperty('limit');
    expect(rateLimit).toHaveProperty('remaining');
    expect(rateLimit).toHaveProperty('reset');
    expect(typeof rateLimit.limit).toBe('number');
    expect(typeof rateLimit.remaining).toBe('number');
    expect(typeof rateLimit.reset).toBe('number');
  });

  it('should handle non-existent resources gracefully', async () => {
    await expect(service.getRepo('octocat', 'non-existent-repo')).rejects.toThrow();
    await expect(service.getUser('non-existent-user')).rejects.toThrow();
  });
});
