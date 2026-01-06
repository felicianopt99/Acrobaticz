# GitHub Actions CI/CD Pipeline

This document explains the automated CI/CD workflows in the `.github/workflows/` directory.

## Overview

Three GitHub Actions workflows automate development and deployment:

1. **docker-build-push.yml** - Build Docker image on push to `main`, push to GHCR
2. **tests.yml** - Run tests on push and pull requests
3. **Automatic triggering** - No manual intervention needed

## Workflows

### 1. Docker Build & Push Workflow

**File:** `.github/workflows/docker-build-push.yml`

**Triggers:**
- Push to `main` branch (production)
- Git tags matching `v*` (releases like `v1.0.0`)
- Manual trigger via GitHub UI

**What it does:**
```
1. Checkout code
2. Setup Docker Buildx (build tool)
3. Login to GitHub Container Registry (GHCR)
4. Extract image metadata (version tags)
5. Build Docker image
6. Push to ghcr.io/YOUR_USERNAME/av-rentals:TAG
7. Report success/failure
```

**Output:**
```
Built image: ghcr.io/YOUR_USERNAME/av-rentals:latest
            ghcr.io/YOUR_USERNAME/av-rentals:main
            ghcr.io/YOUR_USERNAME/av-rentals:sha-abc123
```

**Image Tags:**
- `latest` - Always latest from main
- `main` - Current main branch version
- `sha-abc123` - Specific commit SHA
- `v1.0.0` - Release version (if tagged)

**GitHub Actions Secrets Needed:**
- ✅ `GITHUB_TOKEN` - Automatic (built into GitHub Actions)
- ❌ No additional secrets needed for GHCR!

**How to Use:**
1. Make changes locally
2. Commit and push to `main` branch
3. GitHub Actions automatically:
   - Builds Docker image
   - Tests it
   - Pushes to GHCR
4. On production server:
   ```bash
   docker pull ghcr.io/YOUR_USERNAME/av-rentals:latest
   docker-compose up -d
   ```

### 2. Tests Workflow

**File:** `.github/workflows/tests.yml`

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual trigger

**What it does:**
```
1. Checkout code
2. Setup Node.js environment
3. Install dependencies
4. Run TypeScript type checking
5. Run ESLint linter
6. Run vitest unit tests
7. Upload coverage to Codecov (optional)
```

**Success Criteria:**
- ✅ No TypeScript errors
- ✅ Linter passes
- ✅ All tests pass

**Failure Handling:**
- Build fails if any check fails
- You'll see failure notification on GitHub
- Pull requests block merge if tests fail

**Local Testing (Before Push):**
```bash
npm run typecheck        # Check TypeScript
npm run lint --if-present  # Run linter
npm run test:run         # Run tests
```

## Workflow Status

### Viewing Workflow Runs

1. Go to GitHub repository
2. Click **Actions** tab
3. See list of workflow runs
4. Click run to see details

### Interpreting Results

**✅ Success (Green Checkmark)**
- Code passed all checks
- Image built and pushed successfully
- Safe to deploy

**❌ Failure (Red X)**
- One or more checks failed
- See workflow details for error
- Fix issues locally before pushing again

**⏳ In Progress (Yellow Circle)**
- Workflow is running
- Wait for completion

## Configuration Details

### Docker Build Optimization

**Caching:**
- Uses GitHub Actions cache (`type=gha`)
- Faster rebuilds by reusing layers
- Automatically cleans up old cache

**Multi-platform:**
- Currently builds for Linux (x86-64)
- Can be extended to ARM (for Raspberry Pi, etc.)

**Build Context:**
- Builds from root directory (`.`)
- Uses `.dockerignore` to exclude files
- Respects `.gitignore` patterns

### Test Configuration

**Node Version:** 20.x (LTS)

**Test Suites:**
- Unit tests (vitest)
- Type checking (TypeScript)
- Linting (ESLint)

**Coverage:**
- Uploads to Codecov if available
- Visible in pull request reviews

## Branch Strategy

### main branch
- **Protected**: Yes (requires passing tests)
- **Auto-deploy**: Yes (builds Docker image)
- **Purpose**: Production-ready code

### develop branch
- **Protected**: No (allows force-push)
- **Auto-deploy**: No (testing only)
- **Purpose**: Feature integration

### feature/* branches
- **Protected**: No
- **Auto-deploy**: No
- **Testing**: Only on pull request

### hotfix/* branches
- **Protected**: No
- **Auto-deploy**: Yes (builds image)
- **Purpose**: Critical production fixes

## Setting Up Secrets (If Needed)

**For simple builds (current setup):**
- ✅ No secrets needed
- GITHUB_TOKEN is automatic

**For future enhancements (direct deployment):**
1. Go to repository Settings
2. Secrets and variables → Actions
3. Add any needed secrets
4. Reference in workflow: `${{ secrets.SECRET_NAME }}`

## Security

✅ **Current Security:**
- Image builds in isolated environment
- Source code not exposed
- Credentials never logged
- GITHUB_TOKEN has limited scope
- Build logs visible only to collaborators

**Best Practices:**
- Don't commit secrets to code
- Use GitHub Secrets for credentials
- Review workflow files before major changes
- Monitor Actions usage (free tier has limits)

## Monitoring & Logs

### View Workflow Logs

1. Go to **Actions** tab
2. Click workflow run
3. Click job (e.g., "build-and-push")
4. Expand steps to see logs
5. Search for errors/warnings

### Common Issues

| Error | Cause | Fix |
|-------|-------|-----|
| Build fails | Syntax error in code | Fix locally, push again |
| Push fails | Image too large | Optimize Dockerfile, reduce size |
| Tests fail | Code regression | Fix code, rerun tests |
| Login fails | Credentials invalid | Check GITHUB_TOKEN permissions |

## Workflow Limits (GitHub Free Tier)

- ✅ 2,000 Actions minutes/month free
- ✅ 500 MB storage
- Build time: ~2-3 minutes per push
- Usage resets monthly

For public repositories: **Unlimited** (no cost)

## Disabling Workflows

If you need to disable a workflow temporarily:

1. Go to **Actions** tab
2. Select workflow
3. Click **...** menu → **Disable workflow**

Re-enable: Click **Enable workflow**

## Running Workflows Manually

To manually trigger a workflow:

1. Go to **Actions** tab
2. Select workflow (e.g., "Build and Push Docker Image")
3. Click **Run workflow** button
4. Confirm

Useful for:
- Testing without pushing code
- Deploying a specific commit
- Building for different platforms

## GitHub Actions Status Badge

Add to README to show workflow status:

```markdown
![Docker Build](https://github.com/YOUR_USERNAME/av-rentals/actions/workflows/docker-build-push.yml/badge.svg)
![Tests](https://github.com/YOUR_USERNAME/av-rentals/actions/workflows/tests.yml/badge.svg)
```

## Next Steps

1. Push code to GitHub
2. Watch GitHub Actions run
3. Verify image appears in Packages
4. Pull image on production: `docker pull ghcr.io/YOUR_USERNAME/av-rentals:latest`
5. Deploy with docker-compose

## Troubleshooting

### Workflow doesn't run after push
- Check branch is `main` (not other branches)
- Verify workflow file is in `.github/workflows/`
- Check workflow is enabled (not disabled)

### Build succeeds but image missing in Packages
- Verify `docker push` command ran
- Check GitHub token has `write:packages` scope
- Try manual run to test

### Tests fail but code works locally
- Ensure all files are committed
- Check `.env` and `.env.example` differences
- Run locally: `npm run test:run`

## See Also

- [GHCR_SETUP.md](GHCR_SETUP.md) - Building & pushing images locally
- [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md) - Managing secrets
- [DOCKER_SETUP.md](DOCKER_SETUP.md) - Docker configuration
- [../../CONTRIBUTING.md](../../CONTRIBUTING.md) - Development contribution guide
