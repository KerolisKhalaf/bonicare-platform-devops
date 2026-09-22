output "workspace_id" {
  description = "ID of the Log Analytics workspace"
  value       = azurerm_log_analytics_workspace.this.id
}

output "workspace_name" {
  description = "Name of the Log Analytics workspace"
  value       = azurerm_log_analytics_workspace.this.name
}

output "azure_monitor_agent_extension_id" {
  description = "ID of the Azure Monitor Agent extension"
  value       = azurerm_virtual_machine_extension.azure_monitor_agent.id
}
