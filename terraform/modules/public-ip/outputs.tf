output "public_ip_id" {
  description = "ID of the public IP address"
  value       = azurerm_public_ip.this.id
}

output "public_ip_address" {
  description = "Public IP address"
  value       = azurerm_public_ip.this.ip_address
}

output "public_ip_name" {
  description = "Name of the public IP address"
  value       = azurerm_public_ip.this.name
}