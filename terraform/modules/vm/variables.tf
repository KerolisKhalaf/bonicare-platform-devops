variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region where the VM will be created"
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

variable "subnet_id" {
  description = "ID of the subnet where the VM NIC will be attached"
  type        = string
}

variable "nsg_id" {
  description = "ID of the network security group to associate with the VM NIC"
  type        = string
}

variable "public_ip_id" {
  description = "ID of the public IP address attached to the VM NIC"
  type        = string
}