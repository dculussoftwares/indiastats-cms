terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.80"
    }
  }

  # Backend configured via CLI during init
  backend "azurerm" {}
}

provider "azurerm" {
  features {}
  use_oidc = true
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    Environment = var.environment
    Project     = "IndiaStats"
    ManagedBy   = "Terraform"
  }
}
