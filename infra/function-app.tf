# Storage account required by Azure Functions runtime (AzureWebJobsStorage)
resource "azurerm_storage_account" "scraper" {
  name                     = "stindiastatsscraper"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"

  tags = {
    Environment = var.environment
    Project     = "IndiaStats"
    Component   = "ECI-Scraper"
  }
}

# Consumption plan (Linux Y1) — pay-per-execution, effectively free at this scale
resource "azurerm_service_plan" "scraper" {
  name                = "asp-indiastats-scraper"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = "Y1"

  tags = {
    Environment = var.environment
    Project     = "IndiaStats"
    Component   = "ECI-Scraper"
  }
}

# Linux Function App — Node.js 20, timer every 5 minutes
resource "azurerm_linux_function_app" "scraper" {
  name                       = "func-indiastats-eci-scraper"
  resource_group_name        = azurerm_resource_group.main.name
  location                   = azurerm_resource_group.main.location
  service_plan_id            = azurerm_service_plan.scraper.id
  storage_account_name       = azurerm_storage_account.scraper.name
  storage_account_access_key = azurerm_storage_account.scraper.primary_access_key

  site_config {
    application_stack {
      node_version = "20"
    }
  }

  app_settings = {
    # Runtime config
    FUNCTIONS_WORKER_RUNTIME     = "node"
    WEBSITE_RUN_FROM_PACKAGE     = "1"

    # Scraper config — uses direct Container App URL to bypass Cloudflare bot protection
    PAYLOAD_API_URL = "https://indiastats-cms.lemonpebble-15b93aac.centralindia.azurecontainerapps.io"
    CRON_SECRET     = var.cron_secret
  }

  tags = {
    Environment = var.environment
    Project     = "IndiaStats"
    Component   = "ECI-Scraper"
  }
}
