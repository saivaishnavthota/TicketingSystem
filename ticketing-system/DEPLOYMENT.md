# ITSM Platform - Production Deployment Guide

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Make (optional, for convenience commands)
- 4GB RAM minimum
- 20GB disk space

## Quick Start

### 1. Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd itsm-platform

# Copy environment file
cp .env.example .env

# Edit .env with your production values
nano .env
```

### 2. Configure Environment Variables

Edit `.env` file with production values:

```bash
# CRITICAL: Change these for production!
DB_PASSWORD=<strong-password>
REDIS_PASSWORD=<strong-password>
JWT_SECRET=<random-secret-key>

# Optional: Adjust ports if needed
API_PORT=3000
DB_PORT=5432
REDIS_PORT=6379
```

### 3. Start Services

```bash
# Development (API only)
make up

# Production (with Nginx)
make up-prod
```

**Note:** No SSL certificate generation needed. The application runs on HTTP. For HTTPS, configure it at your load balancer level. See [SSL-HTTPS-SETUP.md](SSL-HTTPS-SETUP.md).

## Production Deployment

### Using Docker Compose

```bash
# Start with production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d

# Or using Make
make up-prod
```

### Architecture

```
┌─────────────┐
│   Nginx     │ :80 (HTTP, Rate Limiting)
└──────┬──────┘
       │
┌──────▼──────┐
│  ITSM API   │ :3000 (Node.js/Express)
└──────┬──────┘
       │
   ┌───┴───┬────────┐
   │       │        │
┌──▼───┐ ┌▼────┐ ┌─▼────┐
│ PG   │ │Redis│ │Audit │
└──────┘ └─────┘ └──────┘
```

**Note:** This setup uses HTTP only. For HTTPS, configure SSL at your load balancer or reverse proxy level (AWS ALB, Cloudflare, etc.). See [SSL-HTTPS-SETUP.md](SSL-HTTPS-SETUP.md) for details.

## Configuration

### Database Configuration

PostgreSQL is configured with production-optimized settings in `docker-compose.prod.yml`:
- Max connections: 200
- Shared buffers: 256MB
- Effective cache size: 1GB

### Redis Configuration

Redis is configured with:
- Persistence: AOF (Append Only File)
- Max memory: 512MB
- Eviction policy: allkeys-lru

### API Configuration

The API service includes:
- Health checks every 30s
- Automatic restart on failure
- Resource limits (2 CPU, 2GB RAM)
- Non-root user execution
- Signal handling with dumb-init

### Nginx Configuration

Nginx provides:
- HTTP reverse proxy
- Rate limiting (10 req/s per IP)
- Gzip compression
- Security headers
- Load balancing ready

**Note:** SSL/TLS is not configured by default. For HTTPS, use a load balancer or see [SSL-HTTPS-SETUP.md](SSL-HTTPS-SETUP.md).

## Monitoring

### Health Checks

```bash
# Check all services
docker-compose ps

# API health endpoint
curl http://localhost:3000/health

# Through nginx (HTTPS)
curl https://localhost/health
```

### Logs

```bash
# All services
make logs

# Specific service
make logs-api
make logs-db

# Follow logs
docker-compose logs -f api
```

### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

## Backup and Restore

### Automated Backups

```bash
# Manual backup
make backup

# Setup cron job for daily backups
0 2 * * * cd /path/to/itsm-platform && make backup
```

### Restore from Backup

```bash
make restore FILE=backups/itsm_backup_20260107_120000.sql.gz
```

## Scaling

### Horizontal Scaling

To run multiple API instances:

```yaml
# docker-compose.yml
services:
  api:
    deploy:
      replicas: 3
```

### Database Scaling

For high-load scenarios:
1. Enable PostgreSQL replication
2. Use connection pooling (PgBouncer)
3. Consider read replicas

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secret (32+ characters)
- [ ] Configure SSL/TLS at load balancer level (see SSL-HTTPS-SETUP.md)
- [ ] Configure firewall rules
- [ ] Enable database encryption at rest
- [ ] Set up regular backups
- [ ] Configure log rotation
- [ ] Enable audit logging
- [ ] Implement network segmentation
- [ ] Regular security updates

## Troubleshooting

### API Won't Start

```bash
# Check logs
make logs-api

# Verify database connection
make shell-db

# Restart services
make restart
```

### Database Connection Issues

```bash
# Check PostgreSQL logs
make logs-db

# Verify database is ready
docker exec itsm-postgres pg_isready

# Check connection from API
docker exec itsm-api nc -zv postgres 5432
```

### High Memory Usage

```bash
# Check container stats
docker stats

# Adjust resource limits in docker-compose.prod.yml
```

## Maintenance

### Updates

```bash
# Pull latest changes
git pull

# Rebuild and restart
make build
make restart
```

### Database Migrations

```bash
# Connect to database
make shell-db

# Run migration SQL
\i /path/to/migration.sql
```

### Cleanup

```bash
# Remove old images
docker image prune -a

# Remove old volumes (CAUTION: data loss)
docker volume prune
```

## Performance Tuning

### PostgreSQL

Edit `docker-compose.prod.yml` to adjust:
- `shared_buffers`: 25% of RAM
- `effective_cache_size`: 50-75% of RAM
- `work_mem`: RAM / max_connections / 4

### API

Adjust in `.env`:
- Connection pool size
- Request timeout
- Rate limiting

### Nginx

Edit `nginx.conf`:
- Worker processes
- Worker connections
- Buffer sizes

## Support

For issues and questions:
- Check logs: `make logs`
- Review health: `make health`
- Database shell: `make shell-db`
- API shell: `make shell-api`

## Production Checklist

Before going live:

1. **Security**
   - [ ] All passwords changed
   - [ ] SSL certificates installed
   - [ ] Firewall configured
   - [ ] Security headers enabled

2. **Monitoring**
   - [ ] Health checks working
   - [ ] Log aggregation setup
   - [ ] Alerting configured
   - [ ] Backup automation enabled

3. **Performance**
   - [ ] Load testing completed
   - [ ] Resource limits set
   - [ ] Database optimized
   - [ ] Caching configured

4. **Reliability**
   - [ ] Backup/restore tested
   - [ ] Failover tested
   - [ ] Recovery procedures documented
   - [ ] Monitoring alerts tested

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Tuning](https://wiki.postgresql.org/wiki/Tuning_Your_PostgreSQL_Server)
- [Nginx Best Practices](https://www.nginx.com/blog/nginx-best-practices/)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
