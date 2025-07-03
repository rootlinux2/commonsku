import { GitHubService } from '../src/githubService';

// Simple test for now - can be enhanced later
import { describe, it, expect } from '@jest/globals';

describe('GitHubService', () => {
  const service = new GitHubService();

  it('should be instantiated', () => {
    expect(service).toBeInstanceOf(GitHubService);
  });

  // Note: Uncomment and add your GitHub token to .env to run live tests
  // it('should fetch GitHub user data', async () => {
  //   const user = await service.getUser('octocat');
  //   expect(user.login).toBe('octocat');
  // });
});
