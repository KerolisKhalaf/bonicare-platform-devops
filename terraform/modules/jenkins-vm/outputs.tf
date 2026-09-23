output "vm_id" {
  description = "ID of the Jenkins virtual machine"
  value       = azurerm_linux_virtual_machine.this.id
}

output "vm_name" {
  description = "Name of the Jenkins virtual machine"
  value       = azurerm_linux_virtual_machine.this.name
}

output "private_ip_address" {
  description = "Private IP address of the Jenkins VM"
  value       = azurerm_network_interface.this.private_ip_address
}

output "nic_id" {
  description = "ID of the Jenkins VM network interface"
  value       = azurerm_network_interface.this.id
}