# GA4 Setup - Save & Deploy via GitHub Actions

Your GA4 Measurement ID `G-NVB7E06128` needs to be securely stored in GitHub Secrets.

## 1️⃣ Add GitHub Secret

Go to your repository: https://github.com/DculusIndustries/india-stats/settings/secrets/actions

**Add new secret:**
- **Name**: `NEXT_PUBLIC_GA_ID`
- **Value**: `G-NVB7E06128`

> ℹ️ This is safe because GA4 Measurement IDs are public identifiers (not API keys)

## 2️⃣ How It Works

```
GitHub Secret (NEXT_PUBLIC_GA_ID)
    ↓
Docker Build Args (build-args)
    ↓
Terraform Env Var (TF_VAR_ga_id)
    ↓
Container App Env Var (NEXT_PUBLIC_GA_ID)
    ↓
Browser loads GA4 script
    ↓
Google Analytics receives events
```

## 3️⃣ Deploy

Push to `main` or manually trigger workflow:

```bash
git push origin main
```

The workflow will:
1. ✅ Build Docker image with GA4 ID
2. ✅ Pass GA4 ID to Terraform
3. ✅ Deploy to Azure Container App
4. ✅ Container restarts with GA4 enabled

## 4️⃣ Verify

Check browser DevTools on https://indiastats.org:

```javascript
// In browser console
window.gtag
// Should return: ƒ gtag() { ... }

window.dataLayer
// Should contain tracking data
```

## Files Updated

- `.github/workflows/terraform-deploy.yml` - Added GA4 to build args & Terraform vars
- `infra/variables.tf` - GA4 variable definition
- `infra/container-app.tf` - GA4 environment variable
- `src/utilities/analytics.ts` - GA4 support in track()
- `src/app/(frontend)/layout.tsx` - GA4 script tag

## Architecture

```
Browser
  ↓
GA4 Script (from Google CDN)
  ↓
Google Analytics
(your backend NOT involved)
```

**Result**: Zero backend overhead, GA4 tracks all events automatically.

## Disable GA4

Set secret to empty string and push:
- `NEXT_PUBLIC_GA_ID` = `` (empty)

Then run workflow → GA4 script won't load.
