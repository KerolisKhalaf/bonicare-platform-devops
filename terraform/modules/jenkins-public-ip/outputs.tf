output "public_ip_id" {
  description = "ID of the Jenkins public IP"
  value       = azurerm_public_ip.this.id
}

output "public_ip_address" {
  description = "IP address of the Jenkins public IP"
  value       = azurerm_public_ip.this.ip_address
}

output "public_ip_name" {
  description = "Name of the Jenkins public IP"
  value       = azurerm_public_ip.this.name
}