variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region where the Jenkins public IP is created"
  type        = string
}

variable "public_ip_name" {
  description = "Name of the Jenkins public IP"
  type        = string
}

variable "allocation_method" {
  description = "Allocation method for the Jenkins public IP"
  type        = string
}

variable "sku" {
  description = "SKU of the Jenkins public IP"
  type        = string
}