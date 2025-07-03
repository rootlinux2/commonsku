import { GitHubService } from '../src/githubService';
import { describe, it, expect, beforeAll, jest } from '@jest/globals';

describe('GitHubService', () => {
  // Set longer timeout for API calls directly in the test file
  jest.setTimeout(15000);
  
  let service: GitHubService;
  
  beforeAll(() => {
    service = new GitHubService({
      enableCache: true // Enable caching for faster repeat calls
    });
  });

  it('should be instantiated', () => {
    expect(service).toBeInstanceOf(GitHubService);
  });

  // Note: Uncomment and add your GitHub token to .env to run live tests
  it('should fetch GitHub user data', async () => {
    const user = await service.getUser('octocat');
    expect(user.login).toBe('octocat');
  });
  
  it('should fetch and validate rate limit information', async () => {
    const rateLimit = await service.getRateLimit();
    
    // Check that response has the expected structure
    expect(rateLimit).toHaveProperty('limit');
    expect(rateLimit).toHaveProperty('remaining');
    expect(rateLimit).toHaveProperty('reset');
    
    // Validate types and reasonable values
    expect(typeof rateLimit.limit).toBe('number');
    expect(typeof rateLimit.remaining).toBe('number');
    expect(typeof rateLimit.reset).toBe('number');
    
    // GitHub's standard rate limit is at least 60 requests per hour
    expect(rateLimit.limit).toBeGreaterThanOrEqual(60);
    
    // Remaining should be within valid range
    expect(rateLimit.remaining).toBeGreaterThanOrEqual(0);
    expect(rateLimit.remaining).toBeLessThanOrEqual(rateLimit.limit);
    
    // Reset timestamp should be in the future (or very recent past)
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutesAgo = now - 300;
    expect(rateLimit.reset).toBeGreaterThanOrEqual(fiveMinutesAgo);
  });
  
  it('should fetch repository information', async () => {
    const repo = await service.getRepo('octocat', 'Hello-World');
    
    expect(repo).toBeDefined();
    expect(repo.name).toBe('Hello-World');
    expect(repo.owner.login).toBe('octocat');
    expect(repo.html_url).toContain('github.com/octocat/Hello-World');
  });
  
  it('should fetch repository contributors', async () => {
    const contributors = await service.getRepoContributors('octocat', 'Hello-World', 5);
    
    expect(Array.isArray(contributors)).toBe(true);
    expect(contributors.length).toBeGreaterThan(0);
    expect(contributors.length).toBeLessThanOrEqual(5);
    
    // Check first contributor structure
    const firstContributor = contributors[0];
    expect(firstContributor).toHaveProperty('login');
    expect(firstContributor).toHaveProperty('contributions');
    expect(firstContributor).toHaveProperty('avatar_url');
    expect(typeof firstContributor.contributions).toBe('number');
    
    // Verify contributions are in descending order
    if (contributors.length > 1) {
      expect(contributors[0].contributions).toBeGreaterThanOrEqual(contributors[1].contributions);
    }
  });
  
  it('should fetch user repositories', async () => {
    const repos = await service.getUserRepos('octocat', 10);
    
    expect(Array.isArray(repos)).toBe(true);
    expect(repos.length).toBeGreaterThan(0);
    expect(repos.length).toBeLessThanOrEqual(10);
    
    // Check repository structure
    const firstRepo = repos[0];
    expect(firstRepo).toHaveProperty('name');
    expect(firstRepo).toHaveProperty('full_name');
    expect(firstRepo).toHaveProperty('owner');
    expect(firstRepo.owner.login).toBe('octocat');
    
    // Verify repos are sorted by updated date in descending order
    if (repos.length > 1 && repos[0].updated_at && repos[1].updated_at) {
      const date1 = new Date(repos[0].updated_at);
      const date2 = new Date(repos[1].updated_at);
      expect(date1 >= date2).toBe(true);
    }
  });
  
  it('should respect limit parameter when fetching contributors', async () => {
    const limitedContributors = await service.getRepoContributors('facebook', 'react', 3);
    expect(limitedContributors.length).toBe(3);
    
    const moreContributors = await service.getRepoContributors('facebook', 'react', 5);
    expect(moreContributors.length).toBe(5);
  });
  
  it('should handle non-existent resources gracefully', async () => {
    // Try to fetch a non-existent repository
    await expect(service.getRepo('octocat', 'this-repo-does-not-exist-12345')).rejects.toThrow();
    
    // Try to fetch a non-existent user
    await expect(service.getUser('this-user-does-not-exist-12345')).rejects.toThrow();
  });
  
  it('should cache results when caching is enabled', async () => {
    // Create a service with caching enabled
    const cachedService = new GitHubService({
      enableCache: true,
      cacheTtl: 60 // 1 minute cache
    });
    
    // Spy on the Octokit instance
    const spyGet = jest.spyOn(cachedService['octokit'].users, 'getByUsername');
    
    // First call should use the API
    await cachedService.getUser('octocat');
    expect(spyGet).toHaveBeenCalledTimes(1);
    
    // Second call should use the cache
    await cachedService.getUser('octocat');
    expect(spyGet).toHaveBeenCalledTimes(1); // Still only called once
    
    // Clean up
    spyGet.mockRestore();
  });
});
