variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region where the Jenkins NSG is created"
  type        = string
}

variable "nsg_name" {
  description = "Name of the Jenkins network security group"
  type        = string
}