output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "container_registry_login_server" {
  description = "Container Registry login server"
  value       = azurerm_container_registry.main.login_server
}

output "container_registry_username" {
  description = "Container Registry admin username"
  value       = azurerm_container_registry.main.admin_username
  sensitive   = true
}

output "container_app_url" {
  description = "URL of the Container App"
  value       = "https://${azurerm_container_app.main.ingress[0].fqdn}"
}

output "container_app_environment_id" {
  description = "Container App Environment ID"
  value       = azurerm_container_app_environment.main.id
}
