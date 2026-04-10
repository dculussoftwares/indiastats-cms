# GA4 Quick Start - 3 Steps to Production

## For Local Development

```bash
# 1. Add to .env.local (keep this file private)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# 2. Run dev server
pnpm dev

# 3. Verify GA4 loads
# - Open browser DevTools → Network tab
# - Refresh page
# - Look for: www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX
```

## For Azure Production

### Step 1: Add GA ID to Terraform

Edit `infra/terraform.tfvars`:
```hcl
ga_id = "G-XXXXXXXXXX"
```

### Step 2: Deploy

```bash
cd infra
terraform plan
terraform apply
```

### Step 3: Verify

```bash
# Check container app has GA4 env var
az containerapp show --name indiastats-cms \
  --resource-group rg-indiastats-prod \
  --query "properties.template.containers[0].env[?name=='NEXT_PUBLIC_GA_ID'].value"

# Should output: "G-XXXXXXXXXX"
```

## Architecture (30 seconds)

```
┌─────────────────────────────────────────────────────────┐
│                  Your Container App                      │
│  (serves Next.js with GA4 script in HTML)               │
└─────────────────────────────────────────────────────────┘
                          ↓
        ┌────────────────────────────────┐
        │  User's Browser                 │
        │ - Runs GA4 script               │
        │ - Sends events to Google        │
        │ - No data to your backend       │
        └────────────────────────────────┘
                          ↓
        ┌────────────────────────────────┐
        │  Google Analytics               │
        │ - Collects events               │
        │ - Your backend uninvolved       │
        └────────────────────────────────┘
```

## Key Points

✅ **GA4 Measurement ID is PUBLIC** - Safe to embed in code
✅ **Client-side only** - Browser talks directly to Google
✅ **No backend impact** - Zero CPU/memory overhead on container
✅ **Automatic tracking** - All events from `track()` go to GA4
✅ **Easy to disable** - Set `ga_id = ""` in Terraform

## Files Changed

```
infra/
  ├── variables.tf          (added ga_id variable)
  └── container-app.tf      (added env var)

src/
  └── utilities/analytics.ts (GA4 support added)

src/app/(frontend)/
  └── layout.tsx            (GA4 script added)

.env.example               (documented GA_ID placeholder)

📄 CLOUD_GA4_DEPLOYMENT.md (full deployment guide)
📄 ANALYTICS_SETUP.md      (local setup guide)
```

## Verify GA4 Is Working

### In Production

Open DevTools on indiastats.org:

```javascript
// In browser console
window.gtag('event', 'test_event', {test: true})

// Then check Google Analytics
// (may take 2-5 minutes to appear)
```

### Check Environment

```bash
# View all Container App environment variables
az containerapp env show \
  --name cae-indiastats-cms \
  --resource-group rg-indiastats-prod
```

## Troubleshooting

| Issue | Check |
|-------|-------|
| GA4 not loading | `az containerapp logs show --name indiastats-cms` |
| Events not tracked | Browser DevTools → Network → google analytics requests |
| Wrong GA ID | Compare `NEXT_PUBLIC_GA_ID` in container vs Google Analytics console |
| No tracking cookie | Clear browser cache, reload page |

## Support

- Full guide: `CLOUD_GA4_DEPLOYMENT.md`
- Local setup: `ANALYTICS_SETUP.md`
- Google Analytics Help: https://support.google.com/analytics
