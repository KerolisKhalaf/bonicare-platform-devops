module "resource_group" {
  source = "./modules/resource-group"

  project_name = var.project_name
  location     = var.location
}
module "networking" {
  source = "./modules/networking"

  resource_group_name     = module.resource_group.name
  location                = var.location
  vnet_name               = var.vnet_name
  vnet_address_space      = var.vnet_address_space
  subnet_name             = var.subnet_name
  subnet_address_prefixes = var.subnet_address_prefixes
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