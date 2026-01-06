# GHCR Setup & Local Build Workflow

This guide explains how to build Docker images locally and push them to GitHub Container Registry (GHCR).

## Overview

**Workflow:**
1. You build the Docker image on your local machine
2. You push it to GitHub Container Registry (GHCR)
3. On your production server, you pull and run the image

**Benefits:**
- ✅ Control when to build (test locally first)
- ✅ No dependency on GitHub Actions
- ✅ Fast deployments (just pull & run)
- ✅ Version history in registry
- ✅ Works with `docker-compose.yml`

## Prerequisites

- Docker installed locally
- GitHub account with repository access
- Git configured on your machine
- Basic Docker knowledge

## Step 1: Create Personal Access Token (PAT)

GitHub Container Registry requires authentication.

### In GitHub:
1. Go to **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **Generate new token (classic)**
3. Name: `GHCR_PAT` (or similar)
4. Select scopes:
   - ✅ `write:packages` - Push images
   - ✅ `read:packages` - Pull images
   - ✅ `delete:packages` - Delete images (optional)
5. Copy the token (you'll need it next)

**Save this token securely!** You won't see it again.

## Step 2: Login to GHCR Locally

Replace `YOUR_GITHUB_USERNAME` and `YOUR_TOKEN` with actual values:

```bash
# Login to GitHub Container Registry
echo "YOUR_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Verify login succeeded
docker run hello-world  # Should work without errors
```

**One-time setup** - You only do this once per machine.

## Step 3: Build Docker Image

### Basic Build

```bash
# Navigate to project
cd "/home/feli/Acrobaticz rental/AV-RENTALS"

# Build image
docker build -t ghcr.io/YOUR_GITHUB_USERNAME/av-rentals:latest .

# Verify build
docker images | grep av-rentals
```

### Build with Tags (Recommended)

Using semantic versioning for better version control:

```bash
# Build with version tag
docker build -t ghcr.io/YOUR_GITHUB_USERNAME/av-rentals:v1.0.0 .
docker build -t ghcr.io/YOUR_GITHUB_USERNAME/av-rentals:latest .

# Both tags point to same image, latest is default
```

### Build Command Breakdown

```bash
docker build \
  -t ghcr.io/YOUR_GITHUB_USERNAME/av-rentals:latest \  # Image tag
  .                                                      # Build from current directory
```

## Step 4: Test Image Locally

Before pushing, test the image:

```bash
# Run container to verify it works
docker run --rm -p 3000:3000 \
  ghcr.io/YOUR_GITHUB_USERNAME/av-rentals:latest

# Access in browser: http://localhost:3000
# Stop with Ctrl+C
```

Or use docker-compose (see updated file):

```bash
docker-compose up -d
```

## Step 5: Push to GHCR

```bash
# Push the latest tag
docker push ghcr.io/YOUR_GITHUB_USERNAME/av-rentals:latest

# Push version tag (if you used one)
docker push ghcr.io/YOUR_GITHUB_USERNAME/av-rentals:v1.0.0

# View pushed images in GitHub:
# Go to your repository → Packages (right sidebar)
```

**Output should show:**
```
Pushing [======================>] ...
Digest: sha256:abc123...
Status: Pushed
```

## Step 6: Pull on Production Server

On your production server:

```bash
# Login (one-time)
echo "YOUR_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Pull latest image
docker pull ghcr.io/YOUR_GITHUB_USERNAME/av-rentals:latest

# Verify
docker images | grep av-rentals
```

## Using with docker-compose.yml

Update `docker-compose.yml` to pull from GHCR instead of building:

```yaml
services:
  app:
    image: ghcr.io/YOUR_GITHUB_USERNAME/av-rentals:latest
    # Remove the 'build' section
    # build: .
    
    environment:
      DATABASE_URL: postgresql://user:password@postgres:5432/db
      # ... other env vars
    
    depends_on:
      postgres:
        condition: service_healthy
```

Then deploy:

```bash
docker-compose up -d
```

## Full Local Build & Push Workflow

**For your regular updates:**

```bash
#!/bin/bash

# 1. Navigate to project
cd "/home/feli/Acrobaticz rental/AV-RENTALS"

# 2. Build
VERSION=$(date +%Y%m%d)
docker build -t ghcr.io/YOUR_GITHUB_USERNAME/av-rentals:$VERSION .
docker build -t ghcr.io/YOUR_GITHUB_USERNAME/av-rentals:latest .

# 3. Test (optional)
docker-compose up -d
# ... manual testing ...
docker-compose down

# 4. Push
docker push ghcr.io/YOUR_GITHUB_USERNAME/av-rentals:$VERSION
docker push ghcr.io/YOUR_GITHUB_USERNAME/av-rentals:latest

echo "✅ Pushed to GHCR"
echo "🚀 Pull on production: docker pull ghcr.io/YOUR_GITHUB_USERNAME/av-rentals:latest"
```

## npm Script (Optional)

Add convenience script to `package.json`:

```json
{
  "scripts": {
    "docker:build-push": "bash ./scripts/docker-build-push.sh"
  }
}
```

Then use: `npm run docker:build-push`

## Viewing Pushed Images

**In GitHub:**
1. Go to your repository
2. Click **Packages** (right sidebar)
3. Find `av-rentals` package
4. See all pushed tags and versions
5. Delete old versions to save space (there's a 500MB free tier limit)

## Troubleshooting

### "authentication required" error
```bash
# Re-login to GHCR
docker logout ghcr.io
echo "YOUR_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### "unauthorized" error
- Token may have expired - generate new PAT
- Token scope might not include `write:packages`
- Username must be lowercase

### Build fails
```bash
# Verify Dockerfile is in project root
ls -la Dockerfile

# Check Docker is running
docker ps

# Try build with verbose output
docker build -t ... . --progress=plain
```

### Image too large
- Check `.dockerignore` is excluding unnecessary files
- Remove development dependencies from production build
- Consider multi-stage build optimization

### Pull fails on production
```bash
# Verify image exists
docker pull ghcr.io/YOUR_GITHUB_USERNAME/av-rentals:latest

# Check credentials on server
cat ~/.docker/config.json

# Re-login
docker logout ghcr.io
docker login ghcr.io -u YOUR_GITHUB_USERNAME
```

## Security Notes

✅ **DO:**
- Keep PAT token private
- Rotate tokens periodically
- Use `$GITHUB_TOKEN` in GitHub Actions (automatic, doesn't need PAT)
- Delete old image versions to save space
- Review who has push access to your repository

❌ **DON'T:**
- Commit PAT token to repository
- Share token in Slack, email, or chat
- Use same token for multiple machines (create separate PATs)
- Leave token in shell history
- Push images with hardcoded secrets inside

## Automation with GitHub Actions

Eventually, you can automate this with GitHub Actions:

1. `.github/workflows/docker-build-push.yml` already exists
2. GitHub Actions runs it automatically on push to `main`
3. It builds and pushes image with `latest` tag
4. You just pull on production

See [docs/deployment/GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md) for secrets configuration.

## Quick Reference

```bash
# One-time setup
docker login ghcr.io -u YOUR_USERNAME
# (paste token when prompted)

# Regular workflow
docker build -t ghcr.io/YOUR_USERNAME/av-rentals:latest .
docker push ghcr.io/YOUR_USERNAME/av-rentals:latest

# On production
docker pull ghcr.io/YOUR_USERNAME/av-rentals:latest
docker-compose up -d
```

## See Also

- [docs/deployment/DOCKER_SETUP.md](DOCKER_SETUP.md) - Docker configuration
- [docs/deployment/GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md) - GitHub Actions secrets
- [../CI_CD.md](../CI_CD.md) - GitHub Actions CI/CD pipelines
