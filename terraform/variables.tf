variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "location" {
  description = "Azure region where resources will be created"
  type        = string
}
variable "vnet_name" {
  description = "Name of the virtual network"
  type        = string
}

variable "vnet_address_space" {
  description = "Address space of the virtual network"
  type        = list(string)
}

variable "subnet_name" {
  description = "Name of the subnet"
  type        = string
}

variable "subnet_address_prefixes" {
  description = "Address prefixes assigned to the subnet"
  type        = list(string)
}
variable "nsg_name" {
  description = "Name of the network security group"
  type        = string
}
variable "public_ip_name" {
  description = "Name of the public IP address"
  type        = string
}

variable "public_ip_allocation_method" {
  description = "Allocation method for the public IP"
  type        = string
}

variable "public_ip_sku" {
  description = "SKU of the public IP"
  type        = string
}
variable "vm_name" {
  description = "Name of the virtual machine"
  type        = string
}

variable "vm_size" {
  description = "Size of the virtual machine"
  type        = string
}

variable "admin_username" {
  description = "Admin username for the Linux VM"
  type        = string
}

variable "ssh_public_key" {
  description = "SSH public key used to access the Linux VM"
  type        = string
}
variable "monitoring_workspace_name" {
  description = "Name of the Log Analytics workspace"
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
variable "jenkins_subnet_name" {
  description = "Name of the Jenkins subnet"
  type        = string
}

variable "jenkins_subnet_address_prefixes" {
  description = "Address prefixes for the Jenkins subnet"
  type        = list(string)
}