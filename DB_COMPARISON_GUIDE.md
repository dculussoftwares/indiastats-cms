# Database Comparison Guide

This guide helps you compare Neon DB (currently on prod) with Azure DB to ensure Azure DB is ready before switching.

## Quick Start

### Step 1: Get the Neon DB Connection String

The Neon DB connection string is currently used in production (Azure Container App). You need to retrieve it:

**Option A: From Azure Container App (via Azure CLI)**
```bash
# Get the secret value from Container App
az containerapp secret list --name indiastats-cms --resource-group rg-indiastats-prod

# Or specifically for database-url
az keyvault secret show --name database-url --vault-name kv-indiastats-prod --query value -o tsv
```

**Option B: From Terraform State**
```bash
# If you have Terraform access
cd infra/
terraform state show azurerm_container_app.main
```

**Option C: Manual (Check with team lead)**
- Ask for the `DATABASE_URI` secret from the prod Azure Container App

### Step 2: Run the Comparison

Once you have the Neon DB connection string, run:

```bash
# Set environment variables
export NEON_DATABASE_URI="postgresql://user:password@neon-host.neon.tech/dbname"
export AZURE_DATABASE_URI="postgresql://dculus_admin:PASSWORD@dculus-shared-postgres.postgres.database.azure.com/indiastats_cms_db?sslmode=verify-ca"

# Run comparison (from project root)
pnpm exec tsx scripts/compare-databases.ts
```

Or in one command:

```bash
NEON_DATABASE_URI="..." AZURE_DATABASE_URI="postgresql://dculus_admin:PASSWORD@dculus-shared-postgres.postgres.database.azure.com/indiastats_cms_db?sslmode=verify-ca" pnpm exec tsx scripts/compare-databases.ts
```

### Step 3: Interpret Results

The script will output:

1. **Connection test** - Verifies both databases are accessible
2. **Row counts** - Compares record counts across all tables
   - ✅ MATCH - Same count in both databases
   - ⚠️ MISMATCH - Different row counts (data sync issues)
   - ❌ MISSING - Table missing in Azure
   - ❌ EXTRA - Table extra in Azure
3. **Column schemas** - Verifies column names and data types match
4. **Summary** - Final verdict

#### When Results are Good ✅
- All tables show ✅ MATCH
- No MISMATCH, MISSING, or EXTRA tables
- All column schemas match
- Message: "✅ Azure DB is ready to use!"

#### When Results Show Issues ❌
- Review which tables have mismatches
- Run migrations if columns are missing
- Sync data if row counts don't match
- Check `scripts/migrate-supabase.ts` for data migration patterns

## What the Script Checks

| Check | What's Verified |
|-------|-----------------|
| Connection | Both DBs are reachable |
| Row Counts | Every table has same number of records |
| Columns | All columns exist with same data types |
| Tables | No extra/missing tables |

## Next Steps After Comparison

### If Azure DB is Ready ✅
1. Update `.env.local` to point to Azure DB
2. Test the app locally
3. Update Azure Container App environment variables
4. Update Terraform `terraform.tfvars` with new DATABASE_URI
5. Run `terraform apply` to deploy

### If Azure DB Needs Sync ⚠️
1. Identify which collections need syncing
2. Run Payload CMS sync operations if available
3. Or run data migration scripts:
   ```bash
   pnpm exec tsx scripts/migrate-supabase.ts
   ```
4. Re-run comparison script to verify

## Connection Strings Format

### Neon DB (Example)
```
postgresql://username:password@ep-host.neon.tech/dbname?sslmode=require
```

### Azure DB (Your Local)
```
postgresql://dculus_admin:PASSWORD@dculus-shared-postgres.postgres.database.azure.com/indiastats_cms_db?sslmode=verify-ca
```

## Troubleshooting

### "Connection refused"
- Verify database URLs are correct
- Check if databases are online
- Verify firewall rules (Azure: check database firewall settings)

### "Authentication failed"
- Verify credentials in connection string
- Check passwords haven't expired
- Verify user has database access

### Row count mismatches
- Check when data was last synced
- Review migration script logs
- Compare with recent git commits

### Column type mismatches
- May need to run schema migrations
- Check Payload CMS schema push
- Consider manual ALTER TABLE commands

## Files

- **Script**: `scripts/compare-databases.ts`
- **This guide**: `DB_COMPARISON_GUIDE.md`

## Support

For connection issues or data sync problems, contact your database administrator or team lead.
