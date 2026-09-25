variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region where the Jenkins VM is created"
  type        = string
}

variable "vm_name" {
  description = "Name of the Jenkins virtual machine"
  type        = string
}

variable "vm_size" {
  description = "Size of the Jenkins virtual machine"
  type        = string
}

variable "admin_username" {
  description = "Admin username for the Jenkins VM"
  type        = string
}

variable "ssh_public_key" {
  description = "SSH public key for the Jenkins VM"
  type        = string
}

variable "subnet_id" {
  description = "ID of the Jenkins subnet"
  type        = string
}

variable "nsg_id" {
  description = "ID of the Jenkins network security group"
  type        = string
}

variable "public_ip_id" {
  description = "ID of the Jenkins public IP"
  type        = string
}