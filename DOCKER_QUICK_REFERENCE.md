# BoniCare Docker Quick Reference

## 🚀 Quick Commands

### Start Services

```bash
# Development (with hot-reload)
docker-compose -f compose/compose.yaml -f compose/compose.dev.yaml up -d

# Production (with resource limits)
docker-compose -f compose/compose.yaml -f compose/compose.prod.yaml up -d

# With monitoring
docker-compose -f compose/compose.yaml -f compose/compose.prod.yaml -f compose/compose.monitoring.yaml up -d
```

### Stop Services

```bash
docker-compose -f compose/compose.yaml -f compose/compose.dev.yaml down
docker-compose -f compose/compose.yaml -f compose/compose.prod.yaml down
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f ai-service
docker-compose logs -f mongo

# Last 100 lines
docker-compose logs --tail=100
```

### Build Images

```bash
# Build all
docker-compose -f compose/compose.yaml build

# Build specific service
docker-compose -f compose/compose.yaml build backend

# Build without cache
docker-compose -f compose/compose.yaml build --no-cache
```

### Shell Access

```bash
# Backend (Node.js)
docker-compose exec backend sh

# AI Service (Python)
docker-compose exec ai-service python

# Database (MongoDB)
docker-compose exec mongo mongosh

# Redis
docker-compose exec redis redis-cli
```

## 📊 Monitoring

| Service | URL | Port |
|---------|-----|------|
| Frontend | http://localhost | 80 |
| Backend | http://localhost:3000 | 3000 |
| AI Service | http://localhost:8000 | 8000 |
| WebRTC | http://localhost:5002 | 5002 |
| Prometheus | http://localhost:9090 | 9090 |
| Grafana | http://localhost:3001 | 3001 |
| Loki | http://localhost:3100 | 3100 |
| AlertManager | http://localhost:9093 | 9093 |

## 🔍 Debugging

```bash
# Check health status
curl http://localhost:3000/health
curl http://localhost:8000/health
curl http://localhost:5002/health

# Container resource usage
docker stats

# Inspect specific container
docker inspect bonicare-backend

# Check network connectivity
docker-compose exec backend nc -zv mongo 27017
docker-compose exec backend curl http://ai-service:8000/health

# View service dependencies
docker-compose ps
```

## 📦 Data Management

```bash
# MongoDB backup
docker-compose exec mongo mongodump --out /backups/backup-$(date +%Y%m%d)
docker-compose cp mongo:/backups/backup-20240101 ./backups/

# MongoDB restore
docker-compose cp ./backups/backup-20240101 mongo:/backups/
docker-compose exec mongo mongorestore /backups/backup-20240101

# Redis persistence
docker-compose exec redis redis-cli bgsave

# View volumes
docker volume ls | grep bonicare
docker volume inspect bonicare_mongo_data
```

## 🧹 Cleanup

```bash
# Remove all stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Complete cleanup (careful!)
docker system prune --volumes -f

# Specific volume
docker volume rm bonicare_redis_data
```

## 🔐 Production Checklist

- [ ] Change MongoDB default credentials
- [ ] Change Redis password
- [ ] Set `GRAFANA_ADMIN_PASSWORD` to a strong secret before starting monitoring
- [ ] Set environment to production
- [ ] Configure resource limits
- [ ] Set up log rotation
- [ ] Enable HTTPS/TLS (proxy with nginx/traefik)
- [ ] Configure backup strategy
- [ ] Set up monitoring alerts
- [ ] Test disaster recovery

## 📝 Common Tasks

### Seed Database

```bash
docker-compose exec backend npm run seed
docker-compose exec backend npm run seed:reset
```

### Run Tests

```bash
docker-compose run --rm backend npm test
```

### View Database

```bash
# MongoDB
docker-compose exec mongo mongosh bonicare
db.users.find()

# Redis
docker-compose exec redis redis-cli
KEYS *
GET session:123
```

### Scale Services (Docker Swarm)

```bash
docker service scale bonicare_backend=3
docker service scale bonicare_ai-service=2
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Port already in use** | `lsof -i :3000` then kill process or use different port |
| **Service won't start** | Check logs: `docker-compose logs [service]` |
| **Health check failing** | Verify endpoint manually: `curl http://localhost:3000/health` |
| **No network connectivity** | Check network: `docker network inspect bonicare-network` |
| **High memory usage** | Check resource limits, restart service |
| **Disk full** | Run `docker system prune --volumes` |

## 📚 File Structure

```
compose/
├── compose.yaml           # Core services
├── compose.dev.yaml       # Development overrides
├── compose.prod.yaml      # Production overrides
└── compose.monitoring.yaml # Monitoring stack

apps/
├── bonicare-backend/
│   ├── Dockerfile        # Multi-stage optimized
│   └── .dockerignore
├── bonicare-frontend/
│   ├── Dockerfile        # Angular build + Nginx
│   ├── nginx.conf        # SPA routing, gzip, caching
│   └── .dockerignore
├── ai-service/
│   ├── Dockerfile        # Python + TensorFlow
│   └── .dockerignore
└── webrtc/
    ├── Dockerfile        # Node.js signaling
    └── .dockerignore
```

## 🎯 Optimization Tips

### Build Speed
- Use BuildKit: `DOCKER_BUILDKIT=1 docker build`
- Cache mounted npm/pip: Already configured in Dockerfiles
- Layer ordering: package.json copied before source

### Image Size
- Backend: ~220MB (from ~330MB)
- Frontend: ~50MB (Nginx only)
- AI Service: ~600MB (from ~900MB+)
- WebRTC: ~180MB

### Runtime Performance
- Resource limits prevent OOM
- Health checks ensure recovery
- Logging rotation prevents disk fill
- Named volumes enable fast I/O

## 🔄 CI/CD Integration

```yaml
# GitHub Actions example
- name: Build and test
  run: |
    docker-compose -f compose/compose.yaml build
    docker-compose run --rm backend npm test
    docker-compose down

# Jenkins example
sh '''
  docker-compose -f compose/compose.yaml build
  docker-compose -f compose/compose.yaml -f compose/compose.prod.yaml up -d
  sleep 10
  curl http://localhost:3000/health
'''
```

## 📞 Support

- Logs: `docker-compose logs [service]`
- Monitoring: http://localhost:3001 (Grafana)
- Health endpoints: `/health` on each service
- Documentation: [DOCKER_DEPLOYMENT_GUIDE.md](./DOCKER_DEPLOYMENT_GUIDE.md)
