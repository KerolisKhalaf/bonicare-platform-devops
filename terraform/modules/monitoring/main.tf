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

resource "azurerm_monitor_action_group" "this" {
  name                = "${var.workspace_name}-alerts"
  resource_group_name = var.resource_group_name
  short_name          = "bonicare"
  location            = "global"

  email_receiver {
    name                    = "admin"
    email_address           = var.alert_email
    use_common_alert_schema = true
  }
}

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "high_cpu" {
  name                = "${var.workspace_name}-high-cpu"
  resource_group_name = var.resource_group_name
  location            = var.location

  description = "Alert when VM CPU usage is above the configured threshold."

  scopes = [
    azurerm_log_analytics_workspace.this.id
  ]

  evaluation_frequency = "PT5M"
  window_duration      = "PT5M"
  severity             = 2

  criteria {
    query = <<-QUERY
      Perf
      | where ObjectName == "Processor"
      | where CounterName == "% Processor Time"
      | summarize AvgCPU = avg(CounterValue) by bin(TimeGenerated, 5m), Computer
      | where AvgCPU > ${var.cpu_alert_threshold}
    QUERY

    time_aggregation_method = "Average"
    metric_measure_column   = "AvgCPU"
    threshold               = 0
    operator                = "GreaterThan"
  }

  action {
    action_groups = [
      azurerm_monitor_action_group.this.id
    ]
  }
}

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "high_memory" {
  name                = "${var.workspace_name}-high-memory"
  resource_group_name = var.resource_group_name
  location            = var.location

  description = "Alert when VM memory usage is above the configured threshold."

  scopes = [
    azurerm_log_analytics_workspace.this.id
  ]

  evaluation_frequency = "PT5M"
  window_duration      = "PT5M"
  severity             = 2

  criteria {
    query = <<-QUERY
      Perf
      | where ObjectName == "Memory"
      | where CounterName == "% Committed Bytes In Use"
      | summarize AvgMemory = avg(CounterValue) by bin(TimeGenerated, 5m), Computer
      | where AvgMemory > ${var.memory_alert_threshold}
    QUERY

    time_aggregation_method = "Average"
    metric_measure_column   = "AvgMemory"
    threshold               = 0
    operator                = "GreaterThan"
  }

  action {
    action_groups = [
      azurerm_monitor_action_group.this.id
    ]
  }
}

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "low_disk" {
  name                = "${var.workspace_name}-low-disk"
  resource_group_name = var.resource_group_name
  location            = var.location

  description = "Alert when VM disk free space is below the configured threshold."

  scopes = [
    azurerm_log_analytics_workspace.this.id
  ]

  evaluation_frequency = "PT5M"
  window_duration      = "PT5M"
  severity             = 2

  criteria {
    query = <<-QUERY
      Perf
      | where ObjectName == "Logical Disk"
      | where CounterName == "% Free Space"
      | summarize AvgFreeSpace = avg(CounterValue) by bin(TimeGenerated, 5m), Computer
      | where AvgFreeSpace < ${var.disk_free_alert_threshold}
    QUERY

    time_aggregation_method = "Average"
    metric_measure_column   = "AvgFreeSpace"
    threshold               = 0
    operator                = "LessThan"
  }

  action {
    action_groups = [
      azurerm_monitor_action_group.this.id
    ]
  }
}