resource "azurerm_resource_group" "this" {
  name     = "${var.project_name}-rg"
  location = var.location
}