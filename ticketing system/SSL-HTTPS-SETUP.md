# SSL/HTTPS Setup Guide

## Overview

The ITSM Platform Docker setup runs on **HTTP only** by default. This is suitable for:
- Development environments
- Internal networks behind a firewall
- Deployments behind a load balancer or reverse proxy that handles SSL

## Adding HTTPS Support

If you need HTTPS, there are several recommended approaches:

### Option 1: Load Balancer (Recommended for Production)

Use a load balancer to handle SSL termination:

**AWS Application Load Balancer (ALB)**
```
Internet → ALB (HTTPS) → ITSM Platform (HTTP)
```

**Google Cloud Load Balancer**
```
Internet → GCLB (HTTPS) → ITSM Platform (HTTP)
```

**Azure Application Gateway**
```
Internet → App Gateway (HTTPS) → ITSM Platform (HTTP)
```

Benefits:
- Automatic certificate management
- Better performance
- Easier certificate rotation
- DDoS protection
- WAF integration

### Option 2: Cloudflare (Easiest)

Use Cloudflare as a reverse proxy:

1. Point your domain to Cloudflare
2. Enable "Full" or "Full (strict)" SSL mode
3. Cloudflare handles SSL termination
4. Your app runs on HTTP behind Cloudflare

Benefits:
- Free SSL certificates
- CDN included
- DDoS protection
- Easy setup

### Option 3: Let's Encrypt with Certbot

Add SSL directly to Nginx:

1. **Install Certbot in Nginx container:**

```dockerfile
# Add to Dockerfile or use certbot container
FROM nginx:alpine
RUN apk add --no-cache certbot certbot-nginx
```

2. **Update nginx.conf:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # ... rest of config
}
```

3. **Update docker-compose.yml:**

```yaml
nginx:
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
    - certbot_data:/etc/letsencrypt
    - certbot_www:/var/www/certbot
  ports:
    - "80:80"
    - "443:443"

certbot:
  image: certbot/certbot
  volumes:
    - certbot_data:/etc/letsencrypt
    - certbot_www:/var/www/certbot
  entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

volumes:
  certbot_data:
  certbot_www:
```

4. **Get certificate:**

```bash
docker-compose run --rm certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email your@email.com \
  --agree-tos \
  --no-eff-email \
  -d yourdomain.com
```

### Option 4: Self-Signed Certificate (Development Only)

For development/testing only:

1. **Generate certificate:**

```bash
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Org/CN=localhost"
```

2. **Update nginx.conf:**

```nginx
server {
    listen 443 ssl http2;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # ... rest of config
}
```

3. **Update docker-compose.yml:**

```yaml
nginx:
  volumes:
    - ./ssl:/etc/nginx/ssl:ro
  ports:
    - "443:443"
```

**Warning:** Self-signed certificates will show security warnings in browsers and are not suitable for production.

## Recommended Approach by Environment

### Development
- **HTTP only** (current setup) ✅
- Or self-signed certificate if testing SSL features

### Staging
- **Cloudflare** (easiest)
- Or **Let's Encrypt** (more control)

### Production
- **Load Balancer** (AWS ALB, GCP LB, Azure AG) ✅ Recommended
- Or **Cloudflare** (good for smaller deployments)
- Or **Let's Encrypt** (if managing your own infrastructure)

## Security Considerations

When running HTTP only:

1. **Use behind a firewall** - Don't expose directly to internet
2. **Use VPN** - For remote access
3. **Internal network only** - Keep within private network
4. **Load balancer** - Let it handle SSL termination

When adding HTTPS:

1. **Use strong ciphers** - TLS 1.2+ only
2. **Enable HSTS** - Force HTTPS
3. **Certificate monitoring** - Alert on expiry
4. **Auto-renewal** - For Let's Encrypt
5. **Security headers** - Already configured in nginx.conf

## Current Setup

The current Docker setup:
- ✅ Runs on HTTP (port 80)
- ✅ Nginx reverse proxy included
- ✅ Rate limiting configured
- ✅ Security headers (except HSTS)
- ✅ Ready for load balancer SSL termination

To add HTTPS, choose one of the options above based on your deployment environment.

## Questions?

- For cloud deployments: Use load balancer SSL
- For self-hosted: Use Let's Encrypt
- For development: HTTP is fine
- For CDN: Use Cloudflare

The simplest production approach is to use your cloud provider's load balancer with automatic SSL certificate management.
