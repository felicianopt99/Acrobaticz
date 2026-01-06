# GitHub Actions Secrets Setup

This document explains how to configure GitHub Actions secrets for automated Docker builds and deployments.

## Why Secrets Matter

**NEVER commit secrets to GitHub!** Use GitHub Actions Secrets to safely inject credentials during CI/CD workflows.

## Required Secrets for GHCR

GitHub Container Registry (GHCR) uses your GitHub token, so minimal setup is needed:

### Automatic (No Setup Required)
- `GITHUB_TOKEN` - Automatically available in all GitHub Actions workflows

### For Docker Login
The workflow file already uses `secrets.GITHUB_TOKEN` with your GitHub username. No additional setup needed.

## Application Secrets (For Production)

If you want the GitHub Actions workflow to deploy directly (future enhancement), add these secrets:

### Step 1: Get Your Secrets

Copy these from your current environment:

```bash
# From your local machine
cat /home/feli/Acrobaticz\ rental/AV-RENTALS/secrets/db_user
cat /home/feli/Acrobaticz\ rental/AV-RENTALS/secrets/db_password
cat /home/feli/Acrobaticz\ rental/AV-RENTALS/secrets/db_name
cat /home/feli/Acrobaticz\ rental/AV-RENTALS/secrets/jwt_secret
cat /home/feli/Acrobaticz\ rental/AV-RENTALS/secrets/deepl_api_key
```

### Step 2: Add to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each:

| Name | Value | Source |
|------|-------|--------|
| `DB_USER` | PostgreSQL username | secrets/db_user |
| `DB_PASSWORD` | PostgreSQL password | secrets/db_password |
| `DB_NAME` | Database name | secrets/db_name |
| `JWT_SECRET` | JWT signing key | secrets/jwt_secret |
| `DEEPL_API_KEY` | Translation API key | secrets/deepl_api_key |
| `GEMINI_API_KEY` | Google AI API key | env.production |
| `DUCKDNS_TOKEN` | DuckDNS token | env.production |
| `DUCKDNS_DOMAIN` | DuckDNS domain | env.production |

### Example: Adding DB_USER Secret

1. Settings → Secrets and variables → Actions
2. Click **New repository secret**
3. Name: `DB_USER`
4. Value: (paste value from `secrets/db_user`)
5. Click **Add secret**

Repeat for each secret above.

## Using Secrets in Workflows

Secrets are accessed in GitHub Actions with `${{ secrets.SECRET_NAME }}`:

```yaml
env:
  DATABASE_URL: postgresql://${{ secrets.DB_USER }}:${{ secrets.DB_PASSWORD }}@postgres:5432/${{ secrets.DB_NAME }}
```

## Security Best Practices

✅ **DO:**
- Rotate secrets regularly
- Use strong, randomly-generated passwords
- Store secrets only in GitHub Secrets (not in code/files)
- Review who has access to secrets (Team settings)
- Delete exposed secrets immediately

❌ **DON'T:**
- Commit `.env` files with real secrets
- Hardcode API keys in workflows
- Share secrets in Slack, email, or chat
- Use the same secret for multiple services
- Store secrets in `.env` that gets version-controlled

## Verifying Secrets Are Set

Check that all required secrets are configured:

```bash
# View repository secrets (from GitHub CLI)
gh secret list
```

## Current Workflow Status

The `docker-build-push.yml` workflow currently:
- ✅ Uses `GITHUB_TOKEN` (automatic)
- ✅ Builds Docker image from Dockerfile
- ✅ Pushes to GHCR as `ghcr.io/username/av-rentals:latest`
- ⏳ Does NOT deploy (manual pull required on production server)

To enable automatic deployment to production, additional secrets and a deploy workflow would be needed.

## Next Steps

1. Add secrets to GitHub (steps above)
2. Push code to GitHub
3. GitHub Actions will automatically build and push Docker image
4. Pull the image on your production server: `docker pull ghcr.io/username/av-rentals:latest`

See [GHCR_SETUP.md](GHCR_SETUP.md) for pulling and running the image.
