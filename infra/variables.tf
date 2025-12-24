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

variable "container_image" {
  description = "Docker image to deploy (from GHCR)"
  type        = string
  default     = "ghcr.io/dculusindustries/india-stats:latest"
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

variable "storage_account_name" {
  description = "Name of the Azure Storage Account for media files"
  type        = string
  default     = "stindiastatsmedia"
}

