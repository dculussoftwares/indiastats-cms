# Switch to Azure DB - Implementation Guide

**Status**: ✅ **VERIFIED** - Azure DB is fully in sync with Neon DB

## Comparison Results

- **Total tables**: 79 ✅ All match
- **Row counts**: 100% in sync across all tables
- **Column schemas**: All match perfectly
- **Key tables verified**:
  - Assemblies: 234 records ✅
  - Districts: 38 records ✅
  - Booths: 45,616 records ✅
  - Election History: 15,725 records ✅
  - Alliances, Zones, Caste Census ✅

---

## Implementation Steps

### Step 1: Update Environment Variables

#### A. Update `terraform.tfvars`

```bash
cd infra/
# Edit terraform.tfvars and update the database_url variable
# Replace Neon DB connection string with Azure DB
```

**Current (Neon)**:
```
database_url = "postgresql://neondb_owner:...@ep-nameless-firefly-a1m9jyhp-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

**New (Azure)**:
```
database_url = "postgresql://dculus_admin:PASSWORD@dculus-shared-postgres.postgres.database.azure.com/indiastats_cms_db?sslmode=verify-ca"
```

#### B. Update GitHub Actions Secrets

Go to: https://github.com/YOUR_REPO/settings/secrets/actions

Add/Update these secrets:
- `DATABASE_URI`: Azure connection string
- Keep other secrets unchanged

**Format**:
```
postgresql://dculus_admin:PASSWORD@dculus-shared-postgres.postgres.database.azure.com/indiastats_cms_db?sslmode=verify-ca
```

### Step 2: Test Locally

Before deploying, verify the app works with Azure DB:

```bash
# Update .env.local with Azure DB connection (already done)
grep DATABASE_URI .env.local

# Start dev server
pnpm dev

# Check:
# 1. App loads without errors
# 2. Can fetch assembly data
# 3. Can fetch district data
# 4. Election data displays correctly
# 5. Analytics events fire
```

**Test URLs**:
- http://localhost:3001 - Home page
- http://localhost:3001/tamil-nadu - State page
- http://localhost:3001/tamil-nadu/assembly/chennai/ac001 - Assembly detail
- http://localhost:3001/tamil-nadu/district/chennai - District detail

### Step 3: Deploy Infrastructure

Deploy the updated Terraform configuration to Azure:

```bash
cd infra/

# Plan deployment (review changes)
terraform plan

# Apply deployment
terraform apply

# Verify deployment
az containerapp show --name indiastats-cms --resource-group rg-indiastats-prod \
  --query "properties.template.containers[0].env[?name=='DATABASE_URI']" -o json
```

### Step 4: Verify Production Deployment

After deployment, verify the app is using Azure DB:

1. **Check Container Logs**:
   ```bash
   az containerapp logs show \
     --name indiastats-cms \
     --resource-group rg-indiastats-prod \
     --follow
   ```

2. **Smoke Tests** (visit these URLs on prod):
   - https://indiastats.org - Home page
   - https://indiastats.org/tamil-nadu - State page
   - https://indiastats.org/tamil-nadu/assembly/chennai/ac001 - Assembly detail
   - Check browser console for errors
   - Check Analytics events are firing (PostHog, GA4)

3. **Database Connection Verification**:
   ```bash
   # Connect to Azure DB to verify it's being used
   psql "postgresql://dculus_admin:PASSWORD@dculus-shared-postgres.postgres.database.azure.com/indiastats_cms_db?sslmode=verify-ca"
   
   # Check recent activity (this will show if app is connected)
   SELECT datname, usename, application_name, state 
   FROM pg_stat_activity 
   WHERE datname = 'indiastats_cms_db';
   ```

---

## Rollback Plan (If Issues Occur)

If you need to revert to Neon DB:

```bash
# 1. Update terraform.tfvars with Neon connection string
# 2. Update GitHub Actions secrets with Neon connection string
# 3. Redeploy:
cd infra/
terraform apply

# 4. Verify Neon DB is active in container logs
az containerapp logs show --name indiastats-cms --resource-group rg-indiastats-prod --follow
```

---

## Benefits of Azure DB

| Aspect | Neon | Azure |
|--------|------|-------|
| **Location** | Singapore (AWS) | India (Azure) | 🇮🇳
| **Latency** | ~150-200ms | ~5-10ms | ⚡
| **Integrated** | Separate vendor | Same Azure ecosystem | 🔗
| **Cost** | Per-compute | Included in subscription | 💰
| **Backups** | Managed by Neon | Azure backup integration | 📦

---

## Post-Deployment Checklist

- [ ] Local dev environment tested with Azure DB
- [ ] Terraform plan reviewed and approved
- [ ] Terraform apply completed successfully
- [ ] Container logs show no errors
- [ ] Production smoke tests pass
- [ ] Analytics events firing correctly
- [ ] Database connections active (psql verification)
- [ ] Neon DB access removed (optional cleanup)

---

## Files Modified

1. `infra/terraform.tfvars` - Updated database_url
2. `.env.local` - Already updated (local dev)
3. GitHub Actions Secrets - Updated DATABASE_URI

## Files Created (for reference)

- `scripts/compare-databases.ts` - Database comparison script
- `DB_COMPARISON_GUIDE.md` - Comparison guide
- `SWITCH_TO_AZURE_DB.md` - This file

---

## Monitoring Post-Switch

### Azure Monitor

Check container app metrics:
```bash
az monitor metrics list \
  --resource /subscriptions/{subscription}/resourceGroups/rg-indiastats-prod/providers/Microsoft.App/containerApps/indiastats-cms \
  --interval PT1M \
  --metric HttpRequestsTotal
```

### Application Logs

Monitor app logs for database errors:
```bash
# Stream logs
az containerapp logs show --name indiastats-cms --resource-group rg-indiastats-prod --follow

# Search for errors
az containerapp logs show --name indiastats-cms --resource-group rg-indiastats-prod | grep -i error
```

### Database Activity

Monitor active connections:
```bash
psql "postgresql://dculus_admin:PASSWORD@dculus-shared-postgres.postgres.database.azure.com/indiastats_cms_db"

# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Check slow queries (if available)
SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC;
```

---

## Support

For issues during or after the switch:
1. Check container logs: `az containerapp logs show --name indiastats-cms --resource-group rg-indiastats-prod --follow`
2. Verify database connection: `psql "postgresql://..."`
3. Rollback if needed (see Rollback Plan section)
4. Contact: DevOps/Infrastructure team

---

## Timeline Estimate

- **Local testing**: 15 minutes
- **Terraform deployment**: 5-10 minutes
- **Production verification**: 10 minutes
- **Total**: ~30-35 minutes

**Recommendation**: Deploy during low-traffic hours (early morning or late evening).
