output "resource_group_name" {
  description = "Name of the resource group"
  value       = module.resource_group.name
}

output "resource_group_id" {
  description = "ID of the resource group"
  value       = module.resource_group.id
}

output "resource_group_location" {
  description = "Location of the resource group"
  value       = module.resource_group.location
}

output "vnet_id" {
  description = "ID of the virtual network"
  value       = module.networking.vnet_id
}

output "vnet_name" {
  description = "Name of the virtual network"
  value       = module.networking.vnet_name
}

output "subnet_id" {
  description = "ID of the subnet"
  value       = module.networking.subnet_id
}

output "subnet_name" {
  description = "Name of the subnet"
  value       = module.networking.subnet_name
}
output "nsg_id" {
  description = "ID of the network security group"
  value       = module.security.nsg_id
}

output "nsg_name" {
  description = "Name of the network security group"
  value       = module.security.nsg_name
}
output "public_ip_id" {
  description = "ID of the public IP address"
  value       = module.public_ip.public_ip_id
}

output "public_ip_address" {
  description = "Public IP address"
  value       = module.public_ip.public_ip_address
}

output "public_ip_name" {
  description = "Name of the public IP address"
  value       = module.public_ip.public_ip_name
}
output "vm_id" {
  description = "ID of the virtual machine"
  value       = module.vm.vm_id
}

output "vm_name" {
  description = "Name of the virtual machine"
  value       = module.vm.vm_name
}

output "vm_private_ip" {
  description = "Private IP address of the virtual machine"
  value       = module.vm.private_ip_address
}

output "vm_nic_id" {
  description = "ID of the network interface"
  value       = module.vm.nic_id
}
output "monitoring_workspace_id" {
  description = "ID of the Log Analytics workspace"
  value       = module.monitoring.workspace_id
}

output "monitoring_workspace_name" {
  description = "Name of the Log Analytics workspace"
  value       = module.monitoring.workspace_name
}

output "azure_monitor_agent_extension_id" {
  description = "ID of the Azure Monitor Agent extension"
  value       = module.monitoring.azure_monitor_agent_extension_id
}