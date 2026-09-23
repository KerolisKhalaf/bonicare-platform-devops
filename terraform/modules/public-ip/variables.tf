variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region where the public IP will be created"
  type        = string
}

variable "public_ip_name" {
  description = "Name of the public IP address"
  type        = string
}

variable "allocation_method" {
  description = "Allocation method for the public IP"
  type        = string
}

variable "sku" {
  description = "SKU of the public IP"
  type        = string
}