# GitHub API Client

A TypeScript-based CLI tool for interacting with the GitHub REST API. This project provides a clean interface to fetch user information, repository details, and manage GitHub data through a command-line interface.

## Features

- 🔍 **User Information**: Fetch detailed GitHub user profiles
- 📁 **Repository Data**: Get repository information and statistics
- 📋 **User Repositories**: List all repositories for a given user
- ⚡ **Rate Limit Checking**: Monitor API usage and limits
- 🔐 **Token Support**: Optional GitHub token for increased rate limits
- 🧪 **Full Test Suite**: Comprehensive Jest testing
- 📘 **TypeScript**: Fully typed with proper interfaces

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd commonsku

# Install dependencies
yarn install

# Build the project
yarn build
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# GitHub API Token (optional)
# Get your token from: https://github.com/settings/tokens
# This increases rate limits from 60 to 5,000 requests per hour
GITHUB_TOKEN=your_github_token_here
```

**Note**: The token is optional but highly recommended to avoid rate limiting.

## Usage

```bash
yarn start <command> [arguments]
```

### Commands

- **user**: Get information about a GitHub user
  ```bash
  yarn start user <username>
  ```

- **repo**: Get information about a GitHub repository
  ```bash
  yarn start repo <owner> <repo>
  ```

- **repos**: Get a list of repositories for a user
  ```bash
  yarn start repos <username> [limit]
  ```

- **contributors**: Get a list of contributors for a repository
  ```bash
  yarn start contributors <owner> <repo> [limit]
  ```

- **rate**: Get information about your current GitHub API rate limit
  ```bash
  yarn start rate
  ```

### Examples

```bash
# Get information about a GitHub user
yarn start user octocat

# Get information about a repository
yarn start repo microsoft vscode

# Get the 10 most recently updated repositories for a user
yarn start repos octocat 10

# Get the top 2 contributors for a repository
yarn start contributors octocat Hello-World 2

# Check your API rate limit
yarn start rate
```

### Development Mode

For development with auto-reload:

```bash
yarn dev user octocat
```

## Project Structure

```
commonsku/
├── src/
│   ├── config.ts           # Environment configuration
│   ├── githubService.ts    # GitHub API service class
│   └── index.ts           # CLI entry point
├── test/
│   └── githubService.test.ts # Jest tests
├── build/                  # Compiled JavaScript output (after yarn build)
├── .env                   # Environment variables
├── .yarnrc.yml            # Yarn configuration
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## API Reference

### GitHubService Class

#### Methods

- `getUser(username: string): Promise<GitHubUser>`
  - Fetch user information by username

- `getRepo(owner: string, repo: string): Promise<GitHubRepo>`
  - Fetch repository information

- `getUserRepos(username: string, per_page?: number): Promise<GitHubRepo[]>`
  - Fetch user's repositories with optional pagination

- `getRateLimit(): Promise<{ limit: number; remaining: number; reset: number }>`
  - Check current API rate limit status

#### Interfaces

- `GitHubUser` - Complete user profile data
- `GitHubRepo` - Repository information and statistics

## Scripts

- `yarn build` - Compile TypeScript to JavaScript (outputs to `build/` directory)
- `yarn start` - Build and run the CLI
- `yarn dev` - Run in development mode with ts-node
- `yarn test` - Run the test suite
- `yarn test:watch` - Run tests in watch mode
- `yarn clean` - Remove build artifacts
- `yarn lint` - Type check without compilation

## Testing

Run the test suite:

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch
```

Tests cover:
- Service instantiation
- API method signatures
- Error handling scenarios

## Error Handling

The application includes comprehensive error handling:

- **Network Errors**: Axios request failures
- **API Errors**: GitHub API error responses (404, rate limiting, etc.)
- **Invalid Arguments**: Missing required parameters
- **Type Safety**: Full TypeScript type checking

## Rate Limiting

- **Without Token**: 60 requests per hour
- **With Token**: 5,000 requests per hour

The tool will display relevant error messages when rate limits are exceeded.

## Troubleshooting

### ES Module vs CommonJS Error

If you see `ReferenceError: exports is not defined in ES module scope`, this means your `package.json` has `"type": "module"` but TypeScript is compiling to CommonJS. Remove the `"type": "module"` line from your package.json:

```json
{
  "name": "commonsku",
  // Remove this line: "type": "module",
  "scripts": {
    "start": "yarn build && node build/index.js",
    "build": "tsc"
  }
}
```

### Cannot find module 'dist/index.js' Error

If you see an error about missing `dist/index.js`, this means your `package.json` scripts are pointing to the wrong output directory. The build outputs to `build/` not `dist/`. Update your package.json scripts:

```json
{
  "scripts": {
    "start": "yarn build && node build/index.js",
    "build": "tsc",
    "clean": "rm -rf build"
  }
}
```

### Module Resolution Errors

If you encounter `ERR_MODULE_NOT_FOUND` errors:

```bash
# Clean build directory and rebuild
rm -rf build dist
yarn build
```

Make sure your `tsconfig.json` uses `"module": "commonjs"` for Node.js CLI compatibility.

### Build Output Directory

The project is configured to output compiled files to the `build/` directory. To clean and rebuild:

```bash
# Remove build directory and rebuild
rm -rf build
yarn build
```

### Yarn PnP Corepack Error

If you encounter a corepack error with `.pnp.cjs`, follow these steps:

```bash
# Remove Yarn PnP files
rm -rf .pnp.cjs .pnp

# Clean yarn cache
yarn cache clean

# Remove node_modules and yarn.lock
rm -rf node_modules yarn.lock

# Reinstall dependencies
yarn install
```

Alternatively, you can disable Yarn PnP by creating a `.yarnrc.yml` file:

```yaml
nodeLinker: node-modules
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests for new functionality
5. Run tests: `yarn test`
6. Commit changes: `git commit -m 'Add feature'`
7. Push to branch: `git push origin feature-name`
8. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Examples

### Example Output

#### User Information
```
=== GitHub User Information ===
Name: The Octocat
Username: octocat
Bio: A great github mascot
Company: GitHub
Location: San Francisco
Public Repos: 8
Followers: 1000
Following: 100
Created: 1/25/2011
Profile: https://github.com/octocat
```

#### Repository Information
```
=== Repository Information ===
Name: Hello-World
Full Name: octocat/Hello-World
Description: This your first repo!
Language: C
Stars: 80
Forks: 9
Open Issues: 0
License: MIT License
Created: 1/26/2011
Updated: 1/26/2011
URL: https://github.com/octocat/Hello-World
```

## Support

For issues and questions:
1. Check the [GitHub Issues](link-to-issues)
2. Review the documentation
3. Create a new issue with detailed information
