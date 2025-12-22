variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "rg-indiastats-prod"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "centralindia"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "container_app_name" {
  description = "Name of the Container App"
  type        = string
  default     = "indiastats-cms"
}

variable "container_registry_name" {
  description = "Name of the Container Registry (must be globally unique)"
  type        = string
  default     = "indiastatscr"
}

variable "database_url" {
  description = "PostgreSQL connection string"
  type        = string
  sensitive   = true
}

variable "payload_secret" {
  description = "Payload CMS secret key"
  type        = string
  sensitive   = true
}
