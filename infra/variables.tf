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

variable "clarity_id" {
  description = "Microsoft Clarity Project ID for analytics"
  type        = string
  sensitive   = false
  default     = ""
}

variable "posthog_key" {
  description = "PostHog Project API Key for analytics"
  type        = string
  sensitive   = false
  default     = ""
}

variable "posthog_host" {
  description = "PostHog API Host URL"
  type        = string
  sensitive   = false
  default     = "https://eu.i.posthog.com"
}

variable "ga_id" {
  description = "Google Analytics 4 Measurement ID (public identifier, not sensitive)"
  type        = string
  sensitive   = false
  default     = ""
}

variable "adsense_client_id" {
  description = "Google AdSense Publisher ID (public identifier, not sensitive)"
  type        = string
  sensitive   = false
  default     = ""
}
