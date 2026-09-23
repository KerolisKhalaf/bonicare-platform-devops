variable "REGISTRY" {
  default = "docker.io"
}

variable "NAMESPACE" {
  default = "keroliskhalaf1"
}

variable "VERSION" {
}

# مجموعة الاستهدافات للخدمات
group "default" {
  targets = [
    "backend",
    "frontend",
    "ai-service",
    "webrtc"
  ]
}
# الإعدادات العامة المشتركة (DRY Principle)
target "_common" {

  platforms = [
    "linux/amd64"
  ]

  output = [
    "type=registry"
  ]

  labels = {
    project = "BoniCare"
    team    = "DevOps"
  }

}

target "backend" {

  inherits = ["_common"]

  context = "./apps/bonicare-backend"

  dockerfile = "Dockerfile"

  tags = [
    "${REGISTRY}/${NAMESPACE}/bonicare-backend:${VERSION}"
  ]

}

target "frontend" {

  inherits = ["_common"]

  context = "./apps/bonicare-frontend"

  dockerfile = "Dockerfile"

  tags = [
    "${REGISTRY}/${NAMESPACE}/bonicare-frontend:${VERSION}"
  ]

}

target "ai-service" {

  inherits = ["_common"]

  context = "./apps/ai-service"

  dockerfile = "Dockerfile"

  tags = [
    "${REGISTRY}/${NAMESPACE}/bonicare-ai-service:${VERSION}"
  ]

}

target "webrtc" {

  inherits = ["_common"]

  context = "./apps/webrtc"

  dockerfile = "Dockerfile"

  tags = [
    "${REGISTRY}/${NAMESPACE}/bonicare-webrtc:${VERSION}"
  ]

}