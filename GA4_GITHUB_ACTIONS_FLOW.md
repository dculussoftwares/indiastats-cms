# GA4 + GitHub Actions Flow

## One-Time Setup

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Add GitHub Secret                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Go to: Settings → Secrets and variables → Actions           │
│                                                              │
│ Click: New repository secret                                │
│                                                              │
│ Name:  NEXT_PUBLIC_GA_ID                                    │
│ Value: G-NVB7E06128                                         │
│                                                              │
│ Click: Add secret                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Every Deploy (Automatic After Setup)

```
┌──────────────────────────────────────────────────────────────────┐
│ STEP 2: Push to main                                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│ $ git push origin main                                           │
│                                                                   │
│ (or manually trigger: Actions → Deploy to Azure → Run workflow)  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Deployment Pipeline

```
GitHub Secret
│
├─ NEXT_PUBLIC_GA_ID = G-NVB7E06128 (encrypted)
│
├─ [Triggered on push to main]
│
├─────────────────────────────────────────────────────────────────
│
│ BUILD STAGE
│
│ Docker Build (build-and-push job)
│ ├─ Reads secret: ${{ secrets.NEXT_PUBLIC_GA_ID }}
│ ├─ Passes as build arg: NEXT_PUBLIC_GA_ID=G-NVB7E06128
│ ├─ Builds Next.js image with GA4 ID embedded
│ └─ Pushes to GHCR: ghcr.io/dculusindustries/india-stats:latest
│
├─────────────────────────────────────────────────────────────────
│
│ TERRAFORM STAGE (needs build to complete first)
│
│ Terraform Init
│ ├─ Connect to Azure backend
│ └─ Load current state
│
│ Terraform Plan
│ ├─ Reads env var: TF_VAR_ga_id = ${{ secrets.NEXT_PUBLIC_GA_ID }}
│ ├─ Plans: container_app.env.ga_id = var.ga_id
│ └─ Prepares infrastructure changes
│
│ Terraform Apply
│ ├─ Update Container App
│ ├─ Set env var: NEXT_PUBLIC_GA_ID=G-NVB7E06128
│ ├─ Restart container (pulls new image)
│ └─ ✅ Deployment complete
│
├─────────────────────────────────────────────────────────────────
│
│ PRODUCTION (Azure Container App)
│
│ Container starts
│ ├─ Env var set: NEXT_PUBLIC_GA_ID=G-NVB7E06128
│ ├─ Next.js build uses this value
│ ├─ GA4 script embedded in HTML
│ └─ Ready to serve
│
├─────────────────────────────────────────────────────────────────
│
│ USER'S BROWSER
│
│ Visits https://indiastats.org
│ ├─ Downloads HTML with GA4 script
│ ├─ Script loads from Google CDN
│ ├─ GA4 initializes with G-NVB7E06128
│ ├─ Tracking begins
│ └─ Events sent to Google Analytics
│
└─────────────────────────────────────────────────────────────────
```

## GitHub Actions Workflow (YAML)

```yaml
# .github/workflows/terraform-deploy.yml

build-and-push:
  steps:
    - name: Build and Push
      uses: docker/build-push-action@v5
      with:
        build-args: |
          # ↓ GA4 ID from secret
          NEXT_PUBLIC_GA_ID=${{ secrets.NEXT_PUBLIC_GA_ID }}

terraform:
  steps:
    - name: Terraform Plan
      env:
        # ↓ GA4 ID from secret for Terraform
        TF_VAR_ga_id: ${{ secrets.NEXT_PUBLIC_GA_ID }}
      run: terraform plan ...

    - name: Terraform Apply
      # ↓ Passes to Container App
      run: terraform apply tfplan
```

## What Each Service Sees

### GitHub Actions
```
✅ Can see secret: secrets.NEXT_PUBLIC_GA_ID = G-NVB7E06128
✅ Passes to Docker build: build-args
✅ Passes to Terraform: TF_VAR_ga_id env var
```

### Docker (Build Time)
```
✅ Receives build arg: NEXT_PUBLIC_GA_ID=G-NVB7E06128
✅ Next.js uses this during build: process.env.NEXT_PUBLIC_GA_ID
✅ Embeds GA4 script in HTML
✅ Image pushed to registry
```

### Terraform
```
✅ Receives env var: TF_VAR_ga_id=G-NVB7E06128
✅ Uses in variable: var.ga_id = G-NVB7E06128
✅ Sets Container App env: NEXT_PUBLIC_GA_ID=G-NVB7E06128
```

### Azure Container App
```
✅ Receives env var: NEXT_PUBLIC_GA_ID=G-NVB7E06128
✅ Next.js runtime uses this value
✅ GA4 script runs with correct ID
```

### User's Browser
```
✅ Receives HTML with GA4 script
✅ Script initializes: gtag('config', 'G-NVB7E06128')
✅ Tracking starts
✅ Events sent to Google Analytics (not your servers)
```

## Environment Variable Chain

```
GitHub Secret
    ↓
secrets.NEXT_PUBLIC_GA_ID
    ↓
Docker build arg: NEXT_PUBLIC_GA_ID
    ↓
GitHub Actions env: TF_VAR_ga_id
    ↓
Terraform variable: var.ga_id
    ↓
Container App env: NEXT_PUBLIC_GA_ID
    ↓
Next.js process.env.NEXT_PUBLIC_GA_ID
    ↓
Browser receives GA4 script with ID
    ↓
Google Analytics receives events
```

## Status Codes

| Stage | Status | Indicator |
|-------|--------|-----------|
| Secret Added | ✅ | Green checkmark in Settings → Secrets |
| Build Starting | 🟡 | Workflow running (yellow dot) |
| Build Complete | ✅ | Docker image pushed to GHCR |
| Terraform Starting | 🟡 | Plan generated |
| Terraform Complete | ✅ | Apply successful, container restarted |
| Container Ready | ✅ | New pod running with GA4 ID |
| GA4 Tracking | ✅ | Events in Google Analytics (after 5 min) |

## Key Files

```
.github/workflows/terraform-deploy.yml
├─ build-and-push job
│  └─ NEXT_PUBLIC_GA_ID=${{ secrets.NEXT_PUBLIC_GA_ID }}
│
└─ terraform job
   ├─ TF_VAR_ga_id: ${{ secrets.NEXT_PUBLIC_GA_ID }}
   └─ terraform plan -var="..."

infra/variables.tf
├─ variable "ga_id"

infra/container-app.tf
├─ env { name = "NEXT_PUBLIC_GA_ID", value = var.ga_id }

src/app/(frontend)/layout.tsx
├─ Script id="ga-script"
├─ src="https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}"
```

## Rollback

```
To disable GA4:
1. Go to Settings → Secrets
2. Edit NEXT_PUBLIC_GA_ID
3. Clear the value (leave empty)
4. Save
5. Push to main (or manually trigger workflow)
6. Terraform will set ga_id = ""
7. GA4 script won't load
```

## Verification Commands

```bash
# Check secret exists
gh secret list | grep GA_ID

# Check container env var set
az containerapp show \
  --name indiastats-cms \
  --resource-group rg-indiastats-prod \
  --query "properties.template.containers[0].env[?name=='NEXT_PUBLIC_GA_ID']"

# View workflow runs
gh run list --workflow terraform-deploy.yml
```

## Troubleshooting

| Problem | Check |
|---------|-------|
| Workflow not running | Push to `main` branch, not another branch |
| Build fails | Check `NEXT_PUBLIC_GA_ID` secret exists |
| Container not restarting | Terraform apply might have failed - check logs |
| GA4 not in browser | Check `NEXT_PUBLIC_GA_ID` env var in container |
| Wrong GA ID tracking | Verify secret value in Settings → Secrets |
