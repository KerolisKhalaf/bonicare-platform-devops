module "resource_group" {
  source = "./modules/resource-group"

  project_name = var.project_name
  location     = var.location
}