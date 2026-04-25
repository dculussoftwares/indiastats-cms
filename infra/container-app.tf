# Log Analytics Workspace (required for Container Apps Environment)
resource "azurerm_log_analytics_workspace" "main" {
  name                = "log-${var.container_app_name}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30 # Minimum retention

  tags = {
    Environment = var.environment
    Project     = "IndiaStats"
  }
}

# Container Apps Environment
resource "azurerm_container_app_environment" "main" {
  name                       = "cae-${var.container_app_name}"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  tags = {
    Environment = var.environment
    Project     = "IndiaStats"
  }
}

# Container App - Pulling from GitHub Container Registry (public)
resource "azurerm_container_app" "main" {
  name                         = var.container_app_name
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"

  secret {
    name  = "database-url"
    value = var.database_url
  }

  secret {
    name  = "payload-secret"
    value = var.payload_secret
  }

  secret {
    name  = "azure-storage-connection-string"
    value = azurerm_storage_account.media.primary_connection_string
  }

  ingress {
    external_enabled = true
    target_port      = 3000
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas = 1 # Always 1 replica running
    max_replicas = 5

    container {
      name   = "indiastats-cms"
      image  = var.container_image # Pull from GHCR (public, no auth needed)
      cpu    = 2.0
      memory = "4Gi"

      env {
        name        = "DATABASE_URI"
        secret_name = "database-url"
      }

      env {
        name        = "PAYLOAD_SECRET"
        secret_name = "payload-secret"
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "NEXT_PUBLIC_SERVER_URL"
        value = "https://indiastats.org"
      }

      env {
        name        = "AZURE_STORAGE_CONNECTION_STRING"
        secret_name = "azure-storage-connection-string"
      }

      env {
        name  = "AZURE_STORAGE_CONTAINER_NAME"
        value = azurerm_storage_container.media.name
      }

      env {
        name  = "AZURE_STORAGE_ACCOUNT_BASEURL"
        value = azurerm_storage_account.media.primary_blob_endpoint
      }

      env {
        name  = "NEXT_PUBLIC_CLARITY_ID"
        value = var.clarity_id
      }

      env {
        name  = "NEXT_PUBLIC_POSTHOG_KEY"
        value = var.posthog_key
      }

      env {
        name  = "NEXT_PUBLIC_POSTHOG_HOST"
        value = var.posthog_host
      }

      env {
        name  = "NEXT_PUBLIC_GA_ID"
        value = var.ga_id
      }

      env {
        name  = "NEXT_PUBLIC_ADSENSE_CLIENT_ID"
        value = var.adsense_client_id
      }
    }
  }

  tags = {
    Environment = var.environment
    Project     = "IndiaStats"
  }
}
