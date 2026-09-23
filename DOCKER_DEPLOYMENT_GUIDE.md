# BoniCare Docker Deployment Guide

## Overview

This guide covers the production-ready Docker setup for BoniCare Orthopedic Platform. The stack includes:

- **Frontend**: Angular 19 + Nginx (SPA with optimizations)
- **Backend**: Express.js API with Socket.IO
- **AI Service**: FastAPI with TensorFlow/Keras models
- **WebRTC**: Node.js signaling server
- **Database**: MongoDB 7.0
- **Cache**: Redis 7
- **Monitoring**: Prometheus, Grafana, Loki, Tempo, AlertManager

---

## Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git
- 4GB+ RAM available
- Port availability: 80, 3000, 5002, 8000, 27017, 6379, 9090, 3001

### Development Environment

```bash
# Clone and navigate to project
cd d:\projects\full-project\Team2

# Build and start development stack
docker-compose -f compose/compose.yaml -f compose/compose.dev.yaml up --build

# Logs
docker-compose -f compose/compose.yaml -f compose/compose.dev.yaml logs -f

# Stop
docker-compose -f compose/compose.yaml -f compose/compose.dev.yaml down
```

**Services Available:**
- Frontend: http://localhost:80
- Backend API: http://localhost:3000
- AI Service: http://localhost:8000
- WebRTC: http://localhost:5002
- MongoDB: localhost:27017
- Redis: localhost:6379

### Production Environment

```bash
# Build images
docker-compose -f compose/compose.yaml -f compose/compose.prod.yaml build

# Start production stack
docker-compose -f compose/compose.yaml -f compose/compose.prod.yaml up -d

# View logs
docker-compose -f compose/compose.yaml -f compose/compose.prod.yaml logs -f

# Stop gracefully
docker-compose -f compose/compose.yaml -f compose/compose.prod.yaml down
```

### Monitoring Stack

```bash
# Start monitoring alongside production services
docker-compose -f compose/compose.yaml -f compose/compose.prod.yaml \
               -f compose/compose.monitoring.yaml up -d

# Access monitoring tools
# - Prometheus: http://localhost:9090
# - Grafana: http://localhost:3001 (admin and the value of GRAFANA_ADMIN_PASSWORD)
# - Loki: http://localhost:3100
# - Tempo: http://localhost:3200
# - AlertManager: http://localhost:9093
```

---

## Architecture Details

### Network Layout

```
┌─────────────────────────────────────────────────────┐
│         Docker Network: bonicare-network            │
│                    (bridge, 172.20.0.0/16)          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Frontend │  │ Backend  │  │ AI Svc   │         │
│  │:80       │  │:3000     │  │:8000     │         │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘         │
│       │             │             │               │
│       └─────────────┼─────────────┘               │
│                     │                             │
│  ┌──────────────────┼──────────────────┐         │
│  │                  │                  │         │
│  ▼                  ▼                  ▼         │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│ │ WebRTC   │  │ MongoDB  │  │  Redis   │        │
│ │:5002     │  │:27017    │  │:6379     │        │
│ └──────────┘  └──────────┘  └──────────┘        │
│                                                     │
└─────────────────────────────────────────────────────┘

Monitoring (optional, separate network):
┌──────────────┐  ┌──────────┐  ┌──────────┐
│ Prometheus   │  │ Grafana  │  │   Loki   │
│:9090         │  │:3001     │  │:3100     │
└──────────────┘  └──────────┘  └──────────┘
```

### Volume Strategy

| Service | Volume | Purpose | Type |
|---------|--------|---------|------|
| Backend | backend_uploads | File uploads | Named |
| MongoDB | mongo_data | Database data | Named |
| MongoDB | mongo_backups | Backup storage | Named |
| Redis | redis_data | Cache persistence | Named |
| Grafana | grafana_data | Dashboard configs | Named |
| Prometheus | prometheus_data | Metrics history | Named |

---

## Dockerfiles Overview

### Backend Dockerfile

**Optimizations:**
- Multi-stage build (dependencies, runtime)
- BuildKit cache mount for npm
- `npm ci --omit=dev` (production dependencies only)
- Non-root user (appuser:1001)
- Health check on `/health` endpoint
- **Image size**: ~220MB (from ~330MB)

**Build time**: ~30 seconds (cached builds ~5s)

### Frontend Dockerfile

**Optimizations:**
- Stage 1: Node build environment
- Stage 2: Nginx with custom configuration
- nginx.conf includes:
  - SPA routing (try_files fallback)
  - Gzip compression (60-80% reduction)
  - Cache headers (1-year for versioned assets)
  - Security headers (X-Frame-Options, CSP, etc.)
- Non-root user (nginx-user:1001)
- Health check on `/health` endpoint
- **Image size**: ~50MB (Nginx only)

**Build time**: ~40 seconds (cached builds ~8s)

### AI Service Dockerfile

**Optimizations:**
- Stage 1: Python build with build-essential
- Stage 2: Python runtime (slim, no build tools)
- BuildKit cache mount for pip
- Python-specific optimizations:
  - `PYTHONUNBUFFERED=1` (no buffering)
  - `PYTHONDONTWRITEBYTECODE=1` (no .pyc files)
- Non-root user (appuser:1001)
- Health check on `/health` endpoint
- **Image size**: ~600MB (from ~900MB+)

**Build time**: ~60 seconds (ML dependencies, cached builds ~10s)

### WebRTC Dockerfile

**Optimizations:**
- Multi-stage build (dependencies, runtime)
- BuildKit cache mount for npm
- `npm ci --omit=dev`
- Non-root user (appuser:1001)
- Health check on `/health` endpoint
- **Image size**: ~180MB

**Build time**: ~20 seconds (cached builds ~3s)

---

## Environment Configuration

### Development (.env)

Located at: `d:\projects\full-project\Team2\.env`

**Key Variables:**
```
NODE_ENV=development
MONGO_URI=mongodb://mongo:27017/bonicare
REDIS_URL=redis://redis:6379
AI_SERVICE_URL=http://ai-service:8000
```

### Production Environment

**Override in compose.prod.yaml:**
```yaml
environment:
  - NODE_ENV=production
  - LOG_LEVEL=warn
  - SENTRY_DSN=${SENTRY_DSN:-}  # Optional: Sentry error tracking
```

**Secrets Management:**
- Use `docker secrets` for sensitive data (Kubernetes-compatible)
- Use `.env.prod` file (not in version control)
- Alternative: AWS Secrets Manager, HashiCorp Vault

---

## Health Checks

All services implement `/health` endpoints for monitoring:

| Service | Endpoint | Response | Interval |
|---------|----------|----------|----------|
| Backend | GET /health | JSON | 30s |
| Frontend | GET /health | JSON | 30s |
| AI Service | GET /health | JSON | 30s |
| WebRTC | GET /health | JSON | 30s |
| MongoDB | mongosh ping | Text | 30s |
| Redis | redis-cli ping | Text | 30s |

**Docker Compose Integration:**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  start_period: 5s
  retries: 3
```

---

## Logging Strategy

### Development

All services log to stdout with `json-file` driver:
```
docker-compose logs -f backend
docker-compose logs --tail=100 ai-service
```

### Production

**Logging Configuration** (compose.prod.yaml):
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"      # Max file size before rotation
    max-file: "5"        # Keep 5 rotated files
    labels: "service=backend"
```

**Log Location**: `/var/lib/docker/containers/[container-id]/[container-id]-json.log`

**Integration with Loki:**
- Configure Promtail to ship logs to Loki
- Query logs via Grafana Explore

---

## Resource Limits

### Development

No resource limits (maximum flexibility)

### Production

| Service | CPU | Memory | Justification |
|---------|-----|--------|---------------|
| Frontend | 0.5 | 256M | Static file serving |
| Backend | 1 | 512M | API processing |
| AI Service | 2 | 2G | ML model inference |
| WebRTC | 0.5 | 256M | Signaling only |
| MongoDB | 1 | 1G | Database operations |
| Redis | 0.5 | 512M | Cache operations |

**Resource Requests** (reserved):
- Frontend: 0.25 CPU, 128M
- Backend: 0.5 CPU, 256M
- AI Service: 1 CPU, 1G
- WebRTC: 0.25 CPU, 128M
- MongoDB: 0.5 CPU, 512M
- Redis: 0.25 CPU, 256M

---

## Restart Policies

### Development

```yaml
restart: unless-stopped
```
- Restart containers unless manually stopped
- Allow easy debugging

### Production

```yaml
restart: unless-stopped
```
- Automatic recovery from crashes
- Manual override available for maintenance

---

## Networking

### Service Discovery

All services accessible by name within network:
```
http://backend:3000      # From frontend container
http://mongo:27017       # From backend container
http://redis:6379        # From any service
http://ai-service:8000   # From backend container
```

### Port Exposure

Only frontend (80) and monitoring (9090, 3001) exposed to host.

Internal services communicate via bridge network.

---

## Kubernetes Migration

This setup is compatible with Kubernetes:

1. **Dockerfiles**: Multi-stage, pinned versions, security hardening
2. **Health Checks**: Used by K8s liveness/readiness probes
3. **Resource Limits**: Defined in compose.prod.yaml, translatable to K8s requests/limits
4. **Logging**: JSON-file driver compatible with fluentd/filebeat
5. **Secrets**: Docker secrets equivalent to K8s secrets

**Future K8s Conversion:**
```bash
# Kompose can convert Compose to Kubernetes manifests
kompose convert -f compose.yaml -o k8s/
```

---

## Common Tasks

### Rebuild Images

```bash
# Rebuild specific service
docker-compose -f compose/compose.yaml -f compose/compose.prod.yaml build backend

# Rebuild all
docker-compose -f compose/compose.yaml -f compose/compose.prod.yaml build
```

### Database Backup

```bash
# MongoDB backup
docker-compose exec mongo mongodump --out /backups/$(date +%Y%m%d-%H%M%S)

# Restore
docker-compose exec mongo mongorestore /backups/20240101-120000
```

### Database Seeding

```bash
# Run seed script
docker-compose exec backend npm run seed

# Reset database
docker-compose exec backend npm run seed:reset
```

### View Container Metrics

```bash
# CPU and memory usage
docker stats

# Detailed stats
docker stats --no-stream
```

### Shell Access

```bash
# Backend
docker-compose exec backend sh

# Database
docker-compose exec mongo mongosh

# Redis
docker-compose exec redis redis-cli
```

### Network Debugging

```bash
# Check DNS resolution
docker-compose exec backend nslookup mongo

# Test connectivity
docker-compose exec backend nc -zv mongo 27017
```

---

## Troubleshooting

### Service won't start

```bash
# Check logs
docker-compose logs backend

# Inspect container
docker inspect [container-id]

# Check port conflicts
lsof -i :3000
```

### Health check failing

```bash
# Test endpoint manually
docker-compose exec backend curl http://localhost:3000/health

# Check service logs
docker-compose logs --tail=50 backend
```

### Out of disk space

```bash
# Prune unused images/volumes
docker system prune --volumes -f

# Check disk usage
docker system df
```

### Performance issues

```bash
# Monitor resource usage
docker stats --no-stream

# Check slow queries (MongoDB)
docker-compose exec mongo mongosh
> db.setProfilingLevel(1)

# View slow log (Redis)
docker-compose exec redis redis-cli slowlog get 10
```

---

## Security Best Practices

### Authentication

- **MongoDB**: Enable authentication in production
- **Redis**: Set password via environment variable
- **Grafana**: Set `GRAFANA_ADMIN_PASSWORD` to a strong secret before starting monitoring

### Network Security

- Use VPN/SSH tunnel for remote deployments
- Firewall ports except 80 (frontend only)
- Never expose backend/database ports to internet

### Secrets Management

```bash
# Use environment files (not in version control)
docker-compose -f compose.yaml --env-file .env.prod up

# Or use Docker secrets (Swarm/K8s)
docker secret create db_password db_password.txt
```

### Image Security

- All images use Alpine (minimal, security patches)
- Non-root users in all containers
- Read-only filesystems where possible
- Regular image updates

---

## Performance Tuning

### Frontend Optimization

Nginx configuration already includes:
- Gzip compression (text content)
- Browser caching headers
- SPA routing optimization
- Security headers

### Backend Optimization

- Node.js clustering (production)
- Connection pooling (MongoDB, Redis)
- Request logging level (warn in prod)
- Memory monitoring

### AI Service Optimization

- TensorFlow memory limits
- Model caching (loaded once)
- Request queue limits
- CPU thread optimization

### Database Optimization

- MongoDB indexes configured
- Redis memory limit with eviction policy
- Regular backups
- Query profiling

---

## Monitoring & Alerts

### Prometheus Metrics

Services expose metrics for Prometheus scraping:
- HTTP request latency
- Error rates
- Container metrics (cAdvisor)
- System metrics (Node Exporter)

### Grafana Dashboards

Pre-built dashboards for:
- Application performance
- Container resource usage
- System metrics
- Custom business metrics

### Alert Rules

Define alerts in `monitoring/prometheus/alerts.yml`:
- High CPU/memory usage
- Service health check failures
- High error rates
- Database availability

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build images
        run: docker-compose build
      - name: Push to registry
        run: docker tag bonicare-backend myregistry/bonicare-backend:${{ github.sha }}
      - name: Deploy
        run: docker-compose -f compose.yaml -f compose.prod.yaml up -d
```

### Jenkins Pipeline Example

```groovy
pipeline {
    stages {
        stage('Build') {
            steps {
                sh 'docker-compose -f compose.yaml build'
            }
        }
        stage('Test') {
            steps {
                sh 'docker-compose run --rm backend npm test'
            }
        }
        stage('Deploy') {
            steps {
                sh 'docker-compose -f compose.yaml -f compose.prod.yaml up -d'
            }
        }
    }
}
```

---

## References

- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Docker BuildKit](https://docs.docker.com/build/buildkit/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [Prometheus](https://prometheus.io/docs/)
- [Grafana](https://grafana.com/docs/)
- [FastAPI Docker](https://fastapi.tiangolo.com/deployment/docker/)

---

## Support

For issues or questions:
1. Check service logs: `docker-compose logs [service]`
2. Test health endpoints: `curl http://localhost:3000/health`
3. Review monitoring dashboards: http://localhost:3001 (Grafana)
4. Check error trackers: Sentry integration

---

**Last Updated**: 2026-07-08  
**Docker Compose Version**: 3.9  
**Compatible with**: Docker 20.10+, Docker Compose 2.0+
