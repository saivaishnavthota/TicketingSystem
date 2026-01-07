# Docker Setup Guide

## Overview

The ITSM Platform uses Docker and Docker Compose for containerized deployment. This setup includes:

- **Multi-stage builds** for optimized production images
- **PostgreSQL** database with production tuning
- **Redis** for caching and session management
- **Nginx** reverse proxy with SSL/TLS
- **Health checks** for all services
- **Automated backups** and restore scripts
- **Monitoring** with Prometheus and Grafana (optional)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Nginx (Port 80/443)              │
│              SSL/TLS, Rate Limiting, Gzip           │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│              ITSM API (Port 3000)                   │
│         Node.js, Express, TypeScript                │
│    Health Checks, Audit Logging, RBAC               │
└────────┬──────────────────────┬─────────────────────┘
         │                      │
    ┌────▼─────┐          ┌────▼─────┐
    │PostgreSQL│          │  Redis   │
    │(Port 5432)│          │(Port 6379)│
    │  Database │          │  Cache   │
    └──────────┘          └──────────┘
```

## Files Structure

```
.
├── Dockerfile                      # Multi-stage production build
├── docker-compose.yml              # Main compose file
├── docker-compose.prod.yml         # Production overrides
├── docker-compose.monitoring.yml   # Optional monitoring stack
├── .dockerignore                   # Files to exclude from build
├── .env.example                    # Environment template
├── nginx.conf                      # Nginx configuration
├── Makefile                        # Convenience commands
├── scripts/
│   ├── backup-db.sh               # Database backup script
│   ├── restore-db.sh              # Database restore script
│   └── generate-ssl-cert.sh       # SSL certificate generator
└── monitoring/
    └── prometheus.yml             # Prometheus configuration
```

## Quick Start

### 1. Prerequisites

```bash
# Check Docker version (20.10+)
docker --version

# Check Docker Compose version (2.0+)
docker-compose --version

# Check Make (optional)
make --version
```

### 2. Initial Setup

```bash
# Copy environment file
cp .env.example .env

# Edit with your values
nano .env

# Generate SSL certificates (for development)
make ssl

# Or for production, place your certificates:
# cp your-cert.pem ssl/cert.pem
# cp your-key.pem ssl/key.pem
```

### 3. Start Services

```bash
# Development (API only)
make up

# Production (with Nginx)
make up-prod

# With monitoring
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

### 4. Verify

```bash
# Check health
make health

# View logs
make logs

# Check specific service
docker-compose ps
```

## Environment Variables

### Required Variables

```bash
# Database
DB_NAME=itsm_platform
DB_USER=itsm_user
DB_PASSWORD=<strong-password>      # CHANGE THIS!

# Redis
REDIS_PASSWORD=<strong-password>   # CHANGE THIS!

# JWT
JWT_SECRET=<random-32-char-string> # CHANGE THIS!
```

### Optional Variables

```bash
# Ports
API_PORT=3000
DB_PORT=5432
REDIS_PORT=6379
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443

# JWT
JWT_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d

# Node
NODE_ENV=production
LOG_LEVEL=info
```

## Docker Compose Services

### API Service

```yaml
api:
  build: .
  ports: ["3000:3000"]
  depends_on: [postgres, redis]
  restart: unless-stopped
  healthcheck: [health endpoint check]
  resources: [2 CPU, 2GB RAM]
```

**Features:**
- Multi-stage build (builder + production)
- Non-root user execution
- Health checks every 30s
- Automatic restart on failure
- Resource limits

### PostgreSQL Service

```yaml
postgres:
  image: postgres:16-alpine
  ports: ["5432:5432"]
  volumes: [persistent data]
  healthcheck: [pg_isready check]
```

**Features:**
- Production-optimized settings
- Persistent data volume
- Automatic schema initialization
- Health checks
- Connection pooling ready

### Redis Service

```yaml
redis:
  image: redis:7-alpine
  ports: ["6379:6379"]
  command: [AOF persistence, password auth]
  volumes: [persistent data]
```

**Features:**
- AOF persistence enabled
- Password authentication
- LRU eviction policy
- Max memory limit (512MB)

### Nginx Service

```yaml
nginx:
  image: nginx:alpine
  ports: ["80:80", "443:443"]
  depends_on: [api]
  volumes: [config, ssl certs]
```

**Features:**
- SSL/TLS termination
- HTTP/2 support
- Rate limiting (10 req/s)
- Gzip compression
- Security headers
- Load balancing ready

## Make Commands

```bash
make help          # Show all commands
make build         # Build images
make up            # Start services
make up-prod       # Start with production config
make down          # Stop services
make logs          # View all logs
make logs-api      # View API logs
make logs-db       # View database logs
make restart       # Restart all services
make restart-api   # Restart API only
make ps            # Show running containers
make health        # Check service health
make backup        # Backup database
make restore       # Restore database
make ssl           # Generate SSL certificate
make shell-api     # Open API shell
make shell-db      # Open database shell
make clean         # Remove all containers/volumes
```

## Production Deployment

### 1. Pre-Deployment

```bash
# Update environment
nano .env

# Generate strong passwords
openssl rand -base64 32  # For DB_PASSWORD
openssl rand -base64 32  # For REDIS_PASSWORD
openssl rand -base64 32  # For JWT_SECRET

# Get SSL certificates
# Use Let's Encrypt or your CA
```

### 2. Build and Deploy

```bash
# Build images
make build

# Start with production config
make up-prod

# Verify
make health
make logs
```

### 3. Post-Deployment

```bash
# Set up automated backups
crontab -e
# Add: 0 2 * * * cd /path/to/itsm-platform && make backup

# Set up monitoring
docker-compose -f docker-compose.monitoring.yml up -d

# Access Grafana: http://localhost:3001
# Access Prometheus: http://localhost:9090
```

## Backup and Restore

### Automated Backups

```bash
# Manual backup
make backup

# Automated (cron)
0 2 * * * cd /path/to/itsm-platform && make backup
```

Backups are stored in `./backups/` with 7-day retention.

### Restore

```bash
# List backups
ls -lh backups/

# Restore specific backup
make restore FILE=backups/itsm_backup_20260107_120000.sql.gz
```

## Monitoring

### Built-in Health Checks

```bash
# API health
curl http://localhost:3000/health

# All services
make health

# Docker health status
docker-compose ps
```

### Optional Monitoring Stack

```bash
# Start monitoring
docker-compose -f docker-compose.monitoring.yml up -d

# Access dashboards
open http://localhost:3001  # Grafana (admin/admin)
open http://localhost:9090  # Prometheus
```

**Metrics Available:**
- System metrics (CPU, memory, disk)
- PostgreSQL metrics (connections, queries, cache)
- Redis metrics (memory, commands, keys)
- API health status

## Troubleshooting

### Services Won't Start

```bash
# Check logs
make logs

# Check specific service
make logs-api
make logs-db

# Verify environment
cat .env

# Check ports
netstat -tulpn | grep -E '3000|5432|6379'
```

### Database Connection Issues

```bash
# Check database is ready
docker exec itsm-postgres pg_isready

# Test connection
make shell-db

# Check from API container
docker exec itsm-api nc -zv postgres 5432
```

### High Resource Usage

```bash
# Check container stats
docker stats

# Check disk usage
docker system df

# Clean up
docker system prune -a
```

### SSL Certificate Issues

```bash
# Verify certificate
openssl x509 -in ssl/cert.pem -text -noout

# Test SSL connection
openssl s_client -connect localhost:443

# Regenerate self-signed cert
make ssl
```

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml
services:
  api:
    deploy:
      replicas: 3
```

### Load Balancing

Nginx is configured for load balancing. Add more API instances:

```yaml
upstream api_backend {
  least_conn;
  server api-1:3000;
  server api-2:3000;
  server api-3:3000;
}
```

## Security Best Practices

1. **Change all default passwords**
2. **Use strong JWT secrets** (32+ characters)
3. **Enable SSL/TLS** with valid certificates
4. **Configure firewall** (only expose 80, 443)
5. **Regular updates** of base images
6. **Enable audit logging**
7. **Use secrets management** (Docker secrets, Vault)
8. **Network segmentation**
9. **Regular backups**
10. **Monitor security logs**

## Performance Tuning

### PostgreSQL

```yaml
# docker-compose.prod.yml
command: >
  postgres
  -c shared_buffers=256MB
  -c effective_cache_size=1GB
  -c max_connections=200
```

### Redis

```yaml
command: >
  redis-server
  --maxmemory 512mb
  --maxmemory-policy allkeys-lru
```

### Nginx

```nginx
# nginx.conf
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
```

## Additional Resources

- [DEPLOYMENT.md](DEPLOYMENT.md) - Full deployment guide
- [PRODUCTION-CHECKLIST.md](PRODUCTION-CHECKLIST.md) - Pre-deployment checklist
- [README.md](README.md) - Application documentation
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
