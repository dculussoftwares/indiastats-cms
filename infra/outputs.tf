output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "container_app_url" {
  description = "URL of the Container App"
  value       = "https://${azurerm_container_app.main.ingress[0].fqdn}"
}

output "container_app_environment_id" {
  description = "Container App Environment ID"
  value       = azurerm_container_app_environment.main.id
}

output "container_image" {
  description = "Container image deployed"
  value       = var.container_image
}

output "storage_account_name" {
  description = "Name of the media storage account"
  value       = azurerm_storage_account.media.name
}

output "storage_account_url" {
  description = "Primary blob endpoint URL for media files"
  value       = azurerm_storage_account.media.primary_blob_endpoint
}

output "storage_container_name" {
  description = "Name of the media storage container"
  value       = azurerm_storage_container.media.name
}

