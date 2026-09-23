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
output "data_collection_rule_id" {
  description = "ID of the Data Collection Rule"
  value       = azurerm_monitor_data_collection_rule.this.id
}

output "data_collection_rule_association_id" {
  description = "ID of the VM Data Collection Rule association"
  value       = azurerm_monitor_data_collection_rule_association.vm.id
}