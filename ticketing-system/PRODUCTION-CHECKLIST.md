# Production Deployment Checklist

## Pre-Deployment

### Security
- [ ] Changed all default passwords in `.env`
- [ ] Generated strong JWT secret (32+ characters)
- [ ] Obtained valid SSL/TLS certificates (not self-signed)
- [ ] Configured firewall rules (only expose 80, 443)
- [ ] Disabled unnecessary ports
- [ ] Set up VPN/bastion for database access
- [ ] Enabled database encryption at rest
- [ ] Configured secure password policies
- [ ] Set up fail2ban or similar intrusion prevention
- [ ] Reviewed and hardened nginx configuration

### Configuration
- [ ] Set `NODE_ENV=production`
- [ ] Configured proper database connection pool size
- [ ] Set appropriate resource limits in docker-compose
- [ ] Configured log levels (info or warn for production)
- [ ] Set up log rotation
- [ ] Configured rate limiting appropriately
- [ ] Set proper CORS policies
- [ ] Configured session timeouts
- [ ] Set up Redis persistence (AOF)
- [ ] Configured database backup retention

### Infrastructure
- [ ] Provisioned adequate server resources (4GB+ RAM, 2+ CPU)
- [ ] Set up monitoring and alerting
- [ ] Configured automated backups
- [ ] Set up log aggregation
- [ ] Configured DNS records
- [ ] Set up CDN (if needed)
- [ ] Configured load balancer (if scaling)
- [ ] Set up health check endpoints
- [ ] Configured auto-restart policies
- [ ] Set up container orchestration (if using K8s)

## Deployment

### Build and Test
- [ ] Run full test suite locally
- [ ] Build Docker images
- [ ] Test images locally
- [ ] Push images to registry
- [ ] Verify image signatures
- [ ] Test database migrations
- [ ] Verify all environment variables
- [ ] Test SSL certificate installation
- [ ] Verify nginx configuration

### Deploy
- [ ] Create database backup before deployment
- [ ] Deploy to staging environment first
- [ ] Run smoke tests on staging
- [ ] Deploy to production
- [ ] Verify all services are healthy
- [ ] Test API endpoints
- [ ] Verify database connectivity
- [ ] Test authentication flow
- [ ] Verify audit logging is working
- [ ] Check SSL/TLS is working correctly

## Post-Deployment

### Verification
- [ ] All services showing as healthy
- [ ] API responding to requests
- [ ] Database queries working
- [ ] Redis cache working
- [ ] Audit logs being created
- [ ] Health checks passing
- [ ] SSL certificate valid
- [ ] Rate limiting working
- [ ] Authentication working
- [ ] Authorization working

### Monitoring
- [ ] Set up uptime monitoring
- [ ] Configure error alerting
- [ ] Set up performance monitoring
- [ ] Configure resource usage alerts
- [ ] Set up database monitoring
- [ ] Configure backup success/failure alerts
- [ ] Set up security event monitoring
- [ ] Configure log analysis
- [ ] Set up SLA monitoring
- [ ] Test alert notifications

### Documentation
- [ ] Document deployment process
- [ ] Document rollback procedure
- [ ] Document backup/restore process
- [ ] Document monitoring setup
- [ ] Document troubleshooting steps
- [ ] Document API endpoints
- [ ] Document authentication flow
- [ ] Document database schema
- [ ] Create runbook for common issues
- [ ] Document scaling procedures

## Ongoing Maintenance

### Daily
- [ ] Check service health
- [ ] Review error logs
- [ ] Monitor resource usage
- [ ] Check backup success

### Weekly
- [ ] Review security logs
- [ ] Check disk space
- [ ] Review performance metrics
- [ ] Test backup restoration
- [ ] Review rate limiting logs
- [ ] Check for security updates

### Monthly
- [ ] Update dependencies
- [ ] Review and rotate logs
- [ ] Audit user access
- [ ] Review and update documentation
- [ ] Performance tuning review
- [ ] Security audit
- [ ] Disaster recovery drill
- [ ] Review and update SSL certificates

### Quarterly
- [ ] Full security audit
- [ ] Penetration testing
- [ ] Capacity planning review
- [ ] Disaster recovery test
- [ ] Review and update policies
- [ ] Architecture review
- [ ] Cost optimization review

## Emergency Procedures

### Service Down
1. Check service health: `make health`
2. Review logs: `make logs`
3. Restart services: `make restart`
4. If database issue: Check `make logs-db`
5. If persistent: Restore from backup

### Database Issues
1. Check database logs: `make logs-db`
2. Verify connectivity: `make shell-db`
3. Check disk space
4. Review slow queries
5. If corrupted: Restore from backup

### Security Incident
1. Isolate affected systems
2. Review audit logs
3. Change all credentials
4. Review access logs
5. Notify stakeholders
6. Document incident
7. Implement fixes
8. Post-mortem review

### Performance Issues
1. Check resource usage: `docker stats`
2. Review slow queries
3. Check cache hit rates
4. Review rate limiting logs
5. Scale resources if needed
6. Optimize queries
7. Increase cache size

## Rollback Procedure

If deployment fails:

1. **Immediate Actions**
   ```bash
   # Stop new version
   make down
   
   # Restore database backup
   make restore FILE=backups/pre-deployment-backup.sql.gz
   
   # Deploy previous version
   git checkout <previous-tag>
   make build
   make up-prod
   ```

2. **Verify Rollback**
   - Check service health
   - Test critical endpoints
   - Verify data integrity
   - Check logs for errors

3. **Post-Rollback**
   - Document what went wrong
   - Fix issues in development
   - Test thoroughly
   - Plan next deployment

## Success Criteria

Deployment is successful when:

- [ ] All services are healthy for 1 hour
- [ ] API response time < 200ms (p95)
- [ ] Error rate < 0.1%
- [ ] Database queries < 100ms (p95)
- [ ] Cache hit rate > 80%
- [ ] No security alerts
- [ ] Backups completing successfully
- [ ] Monitoring and alerts working
- [ ] SSL certificate valid
- [ ] All critical endpoints responding

## Support Contacts

- **DevOps Lead**: [contact]
- **Database Admin**: [contact]
- **Security Team**: [contact]
- **On-Call Engineer**: [contact]
- **Escalation**: [contact]

## Additional Resources

- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment guide
- [README.md](README.md) - Application documentation
- Monitoring Dashboard: http://localhost:3001 (Grafana)
- Metrics: http://localhost:9090 (Prometheus)
