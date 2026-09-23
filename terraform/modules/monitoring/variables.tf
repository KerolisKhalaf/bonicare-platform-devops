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
variable "alert_email" {
  description = "Email address that will receive monitoring alerts"
  type        = string
}

variable "cpu_alert_threshold" {
  description = "CPU usage percentage that triggers the alert"
  type        = number
}

variable "memory_alert_threshold" {
  description = "Memory usage percentage that triggers the alert"
  type        = number
}

variable "disk_free_alert_threshold" {
  description = "Disk free space percentage that triggers the alert"
  type        = number
}