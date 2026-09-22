variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region where monitoring resources will be created"
  type        = string
}

variable "workspace_name" {
  description = "Name of the Log Analytics workspace"
  type        = string
}

variable "vm_id" {
  description = "ID of the virtual machine where Azure Monitor Agent will be installed"
  type        = string
}
