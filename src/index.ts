import { GitHubService } from './githubService';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log(`
GitHub API CLI Tool

Usage:
  yarn start user <username>                    - Get user information
  yarn start repo <owner> <repo>                - Get repository information  
  yarn start repos <username> [limit]           - Get user's repositories
  yarn start rate                               - Get API rate limit info

Examples:
  yarn start user octocat
  yarn start repo microsoft vscode
  yarn start repos octocat 10
  yarn start rate
    `);
    process.exit(1);
  }

  const service = new GitHubService();
  const command = args[0];

  try {
    switch (command) {
      case 'user': {
        if (!args[1]) {
          console.error('Error: Username is required');
          process.exit(1);
        }
        const user = await service.getUser(args[1]);
        console.log('\n=== GitHub User Information ===');
        console.log(`Name: ${user.name || 'N/A'}`);
        console.log(`Username: ${user.login}`);
        console.log(`Bio: ${user.bio || 'N/A'}`);
        console.log(`Company: ${user.company || 'N/A'}`);
        console.log(`Location: ${user.location || 'N/A'}`);
        console.log(`Public Repos: ${user.public_repos}`);
        console.log(`Followers: ${user.followers}`);
        console.log(`Following: ${user.following}`);
        console.log(`Created: ${new Date(user.created_at).toLocaleDateString()}`);
        console.log(`Profile: ${user.html_url}`);
        break;
      }

      case 'repo': {
        if (!args[1] || !args[2]) {
          console.error('Error: Owner and repository name are required');
          process.exit(1);
        }
        const repo = await service.getRepo(args[1], args[2]);
        console.log('\n=== Repository Information ===');
        console.log(`Name: ${repo.name}`);
        console.log(`Full Name: ${repo.full_name}`);
        console.log(`Description: ${repo.description || 'N/A'}`);
        console.log(`Language: ${repo.language || 'N/A'}`);
        console.log(`Stars: ${repo.stargazers_count}`);
        console.log(`Forks: ${repo.forks_count}`);
        console.log(`Open Issues: ${repo.open_issues_count}`);
        console.log(`License: ${repo.license?.name || 'N/A'}`);
        console.log(`Created: ${new Date(repo.created_at).toLocaleDateString()}`);
        console.log(`Updated: ${new Date(repo.updated_at).toLocaleDateString()}`);
        console.log(`URL: ${repo.html_url}`);
        break;
      }

      case 'repos': {
        if (!args[1]) {
          console.error('Error: Username is required');
          process.exit(1);
        }
        const limit = args[2] ? parseInt(args[2], 10) : 10;
        const repos = await service.getUserRepos(args[1], limit);
        console.log(`\n=== ${args[1]}'s Repositories (${repos.length}) ===`);
        repos.forEach((repo, index) => {
          console.log(`\n${index + 1}. ${repo.name}`);
          console.log(`   ${repo.description || 'No description'}`);
          console.log(`   ⭐ ${repo.stargazers_count} 🍴 ${repo.forks_count} 📝 ${repo.language || 'Unknown'}`);
          console.log(`   ${repo.html_url}`);
        });
        break;
      }

      case 'rate': {
        const rateLimit = await service.getRateLimit();
        console.log('\n=== API Rate Limit ===');
        console.log(`Limit: ${rateLimit.limit} requests/hour`);
        console.log(`Remaining: ${rateLimit.remaining}`);
        console.log(`Reset: ${new Date(rateLimit.reset * 1000).toLocaleString()}`);
        break;
      }

      default:
        console.error(`Error: Unknown command '${command}'`);
        console.log('Use: yarn start (without arguments) to see usage information');
        process.exit(1);
    }
  } catch (error) {
    console.error(`\nError: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

void main();
