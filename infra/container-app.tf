# Azure Container Registry
resource "azurerm_container_registry" "main" {
  name                = var.container_registry_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic" # Lowest cost tier
  admin_enabled       = true    # Required for Container Apps

  tags = {
    Environment = var.environment
    Project     = "IndiaStats"
  }
}

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

# Container App
resource "azurerm_container_app" "main" {
  name                         = var.container_app_name
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"

  registry {
    server               = azurerm_container_registry.main.login_server
    username             = azurerm_container_registry.main.admin_username
    password_secret_name = "acr-password"
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.main.admin_password
  }

  secret {
    name  = "database-url"
    value = var.database_url
  }

  secret {
    name  = "payload-secret"
    value = var.payload_secret
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
    min_replicas = 0 # Scale to zero when no traffic
    max_replicas = 2 # Low cost scaling

    container {
      name   = "indiastats-cms"
      image  = "${azurerm_container_registry.main.login_server}/${var.container_app_name}:latest"
      cpu    = 0.5 # Minimum for production
      memory = "1Gi"

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
        value = "https://${var.container_app_name}.${azurerm_container_app_environment.main.default_domain}"
      }
    }
  }

  tags = {
    Environment = var.environment
    Project     = "IndiaStats"
  }
}
