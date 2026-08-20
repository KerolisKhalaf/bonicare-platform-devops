variable "REGISTRY" {
  default = "docker.io"
}

variable "NAMESPACE" {
  default = "keroliskhalaf1"
}

variable "VERSION" {
  default = "latest"
}

group "default" {
  targets = [
    "backend",
    "frontend",
    "ai-service",
    "webrtc"
  ]
}

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

  cache-from = [
    "type=registry,ref=${REGISTRY}/${NAMESPACE}/bonicare-backend-cache"
  ]

  cache-to = [
    "type=registry,ref=${REGISTRY}/${NAMESPACE}/bonicare-backend-cache,mode=min"
  ]
}

target "frontend" {

  inherits = ["_common"]

  context = "./apps/bonicare-frontend"

  dockerfile = "Dockerfile"

  tags = [
    "${REGISTRY}/${NAMESPACE}/bonicare-frontend:${VERSION}"
  ]

  cache-from = [
    "type=registry,ref=${REGISTRY}/${NAMESPACE}/bonicare-frontend-cache"
  ]

  cache-to = [
    "type=registry,ref=${REGISTRY}/${NAMESPACE}/bonicare-frontend-cache,mode=min"
  ]
}

target "ai-service" {

  inherits = ["_common"]

  context = "./apps/ai-service"

  dockerfile = "Dockerfile"

  tags = [
    "${REGISTRY}/${NAMESPACE}/bonicare-ai-service:${VERSION}"
  ]

  cache-from = [
    "type=registry,ref=${REGISTRY}/${NAMESPACE}/bonicare-ai-service-cache"
  ]
  cache-from[
    "type=registry,ref=${REGISTRY}/${NAMESPACE}/bonicare-ai-service-cache"
  ]

  cache-to = [
    "type=registry,ref=${REGISTRY}/${NAMESPACE}/bonicare-ai-service-cache,mode=min"
  ]
}

target "webrtc" {

  inherits = ["_common"]

  context = "./apps/webrtc"

  dockerfile = "Dockerfile"

  tags = [
    "${REGISTRY}/${NAMESPACE}/bonicare-webrtc:${VERSION}"
  ]

  cache-from = [
    "type=registry,ref=${REGISTRY}/${NAMESPACE}/bonicare-webrtc-cache"
  ]

  cache-to = [
    "type=registry,ref=${REGISTRY}/${NAMESPACE}/bonicare-webrtc-cache,mode=min"
  ]
}


