# Azure Storage Account for media files
resource "azurerm_storage_account" "media" {
  name                     = var.storage_account_name
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS" # Locally redundant - cost effective
  account_kind             = "StorageV2"

  # Enable static website hosting for direct blob access
  allow_nested_items_to_be_public = true

  # CORS configuration for frontend access
  blob_properties {
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["GET", "HEAD", "OPTIONS"]
      allowed_origins    = ["*"] # Will be restricted in production
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }
  }

  tags = {
    Environment = var.environment
    Project     = "IndiaStats"
    ManagedBy   = "Terraform"
  }
}

# Blob container for media uploads
resource "azurerm_storage_container" "media" {
  name                  = "indiastats-cms-media"
  storage_account_id    = azurerm_storage_account.media.id
  container_access_type = "blob" # Public read access for blobs
}
