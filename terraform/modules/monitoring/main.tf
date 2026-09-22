resource "azurerm_log_analytics_workspace" "this" {
  name                = var.workspace_name
  location            = var.location
  resource_group_name = var.resource_group_name

  sku               = "PerGB2018"
  retention_in_days = 30
}

resource "azurerm_virtual_machine_extension" "azure_monitor_agent" {
  name                       = "AzureMonitorLinuxAgent"
  virtual_machine_id         = var.vm_id
  publisher                  = "Microsoft.Azure.Monitor"
  type                       = "AzureMonitorLinuxAgent"
  type_handler_version       = "1.0"
  auto_upgrade_minor_version = true
}

resource "azurerm_monitor_data_collection_rule" "this" {
  name                = "${var.workspace_name}-dcr"
  location            = var.location
  resource_group_name = var.resource_group_name

  destinations {
    log_analytics {
      workspace_resource_id = azurerm_log_analytics_workspace.this.id
      name                  = "log-analytics"
    }
  }

  data_flow {
    streams      = ["Microsoft-Perf"]
    destinations = ["log-analytics"]
  }

  data_sources {
    performance_counter {
      name                          = "vm-performance"
      streams                       = ["Microsoft-Perf"]
      sampling_frequency_in_seconds = 60

      counter_specifiers = [
        "\\Processor(_Total)\\% Processor Time",
        "\\Memory\\% Committed Bytes In Use",
        "\\Logical Disk(_Total)\\% Free Space",
        "\\Network Interface(*)\\Bytes Total/sec"
      ]
    }
  }
}

resource "azurerm_monitor_data_collection_rule_association" "vm" {
  name                    = "${var.workspace_name}-vm-association"
  target_resource_id      = var.vm_id
  data_collection_rule_id = azurerm_monitor_data_collection_rule.this.id
}