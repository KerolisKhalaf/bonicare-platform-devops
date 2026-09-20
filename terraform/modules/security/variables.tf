variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region where the NSG will be created"
  type        = string
}

variable "nsg_name" {
  description = "Name of the network security group"
  type        = string
}