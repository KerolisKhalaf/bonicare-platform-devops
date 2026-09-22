module "resource_group" {
  source = "./modules/resource-group"

  project_name = var.project_name
  location     = var.location
}
module "networking" {
  source = "./modules/networking"

  resource_group_name             = module.resource_group.name
  location                        = var.location
  vnet_name                       = var.vnet_name
  vnet_address_space              = var.vnet_address_space
  subnet_name                     = var.subnet_name
  subnet_address_prefixes         = var.subnet_address_prefixes
  jenkins_subnet_name             = var.jenkins_subnet_name
  jenkins_subnet_address_prefixes = var.jenkins_subnet_address_prefixes

}

module "security" {
  source = "./modules/security"

  resource_group_name = module.resource_group.name
  location            = var.location
  nsg_name            = var.nsg_name
}
module "public_ip" {
  source = "./modules/public-ip"

  resource_group_name = module.resource_group.name
  location            = var.location
  public_ip_name      = var.public_ip_name
  allocation_method   = var.public_ip_allocation_method
  sku                 = var.public_ip_sku
}
module "vm" {
  source = "./modules/vm"

  resource_group_name = module.resource_group.name
  location            = var.location

  vm_name = var.vm_name
  vm_size = var.vm_size

  admin_username = var.admin_username
  ssh_public_key = var.ssh_public_key

  subnet_id    = module.networking.subnet_id
  nsg_id       = module.security.nsg_id
  public_ip_id = module.public_ip.public_ip_id
}
module "monitoring" {
  source = "./modules/monitoring"

  resource_group_name = module.resource_group.name
  location            = var.location
  workspace_name      = var.monitoring_workspace_name
  vm_id               = module.vm.vm_id

  alert_email               = var.alert_email
  cpu_alert_threshold       = var.cpu_alert_threshold
  memory_alert_threshold    = var.memory_alert_threshold
  disk_free_alert_threshold = var.disk_free_alert_threshold
}
