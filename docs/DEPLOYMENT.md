# Deployment Guide

Production deployment instructions for BHC Markets.

## Table of Contents

- [Deployment Overview](#deployment-overview)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Deployment Options](#deployment-options)
- [Monitoring](#monitoring)
- [Backup & Recovery](#backup--recovery)
- [Security Checklist](#security-checklist)

## Deployment Overview

BHC Markets can be deployed in several configurations:

1. **Single Server** - All services on one machine (development/small scale)
2. **Microservices** - Each service on separate instances (recommended)
3. **Container Orchestration** - Kubernetes/Docker Swarm (large scale)
4. **Serverless** - Cloudflare Workers for email service

## Prerequisites

### Required Software

- **Node.js**: 18+ (or Bun runtime)
- **PostgreSQL**: 15+
- **Redis**: 7+ (recommended)
- **Nginx**: Latest (reverse proxy)
- **SSL Certificate**: Let's Encrypt or commercial

### Infrastructure Requirements

**Minimum (Single Server):**
- CPU: 4 cores
- RAM: 8GB
- Storage: 100GB SSD
- Network: 1Gbps

**Recommended (Microservices):**
- Backend API: 2 cores, 4GB RAM
- Order Engine: 4 cores, 8GB RAM
- Market Data: 2 cores, 4GB RAM
- Database: 4 cores, 16GB RAM, 500GB SSD
- Redis: 2 cores, 4GB RAM

## Environment Configuration

### Production Environment Variables

Create `.env.production`:

```bash
# Environment
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@db.internal:5432/bhcmarkets
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# Redis
REDIS_URL=redis://redis.internal:6379
REDIS_POOL_SIZE=10

# Backend API
PORT=8080
JWT_SECRET=<generate-strong-256-bit-secret>
ACCESS_TTL_SEC=900
REFRESH_TTL_SEC=2592000
BCRYPT_ROUNDS=10

# CORS
CORS_ORIGINS=https://auth.bhcmarkets.com,https://platform.bhcmarkets.com,https://admin.bhcmarkets.com

# Order Engine
ORDER_ENGINE_PORT=4003
ORDER_ENGINE_WS_PORT=4004
MAX_ORDERS_PER_ACCOUNT=1000
RATE_LIMIT_ORDERS_PER_SECOND=10

# Market Data
MARKET_DATA_PORT=4001
MARKET_DATA_WS_PORT=4002
YAHOO_POLL_INTERVAL_MS=15000

# Logging
LOG_LEVEL=info
LOG_TO_FILE=true
LOG_DIR=/var/log/bhcmarkets

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
DATADOG_API_KEY=xxx
```

### Generating Secrets

```bash
# Generate JWT secret (256-bit)
openssl rand -base64 32

# Generate API keys
openssl rand -hex 32
```

## Database Setup

### Production Database

1. **Create database and user:**
   ```sql
   CREATE USER bhcmarkets WITH PASSWORD '<strong-password>';
   CREATE DATABASE bhcmarkets OWNER bhcmarkets;
   \c bhcmarkets
   GRANT ALL PRIVILEGES ON DATABASE bhcmarkets TO bhcmarkets;
   ```

2. **Configure PostgreSQL:**
   ```bash
   # Edit postgresql.conf
   sudo nano /etc/postgresql/15/main/postgresql.conf

   # Recommended settings
   max_connections = 100
   shared_buffers = 4GB
   effective_cache_size = 12GB
   maintenance_work_mem = 1GB
   checkpoint_completion_target = 0.9
   wal_buffers = 16MB
   default_statistics_target = 100
   random_page_cost = 1.1
   effective_io_concurrency = 200
   work_mem = 20MB
   min_wal_size = 2GB
   max_wal_size = 8GB
   ```

3. **Run migrations:**
   ```bash
   NODE_ENV=production bun run db:migrate
   ```

4. **Seed admin user:**
   ```bash
   NODE_ENV=production bun run seed:admin
   ```

### Database Backups

**Automated daily backups:**

```bash
#!/bin/bash
# /etc/cron.daily/backup-bhcmarkets

BACKUP_DIR="/var/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="bhcmarkets"

# Create backup
pg_dump $DB_NAME | gzip > "$BACKUP_DIR/bhcmarkets_$DATE.sql.gz"

# Delete backups older than 30 days
find $BACKUP_DIR -name "bhcmarkets_*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp "$BACKUP_DIR/bhcmarkets_$DATE.sql.gz" s3://backups/postgres/
```

**Make executable:**
```bash
chmod +x /etc/cron.daily/backup-bhcmarkets
```

## Deployment Options

### Option 1: PM2 (Node Process Manager)

**Install PM2:**
```bash
npm install -g pm2
```

**Create ecosystem file:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'backend-api',
      cwd: './packages/backend',
      script: 'bun',
      args: 'run start',
      instances: 2,
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 8080,
      },
    },
    {
      name: 'order-engine',
      cwd: './packages/order-engine',
      script: 'bun',
      args: 'run start',
      instances: 1,
      env_production: {
        NODE_ENV: 'production',
        PORT: 4003,
        WS_PORT: 4004,
      },
    },
    {
      name: 'market-data',
      cwd: './packages/market-data',
      script: 'bun',
      args: 'run start',
      instances: 1,
      env_production: {
        NODE_ENV: 'production',
        PORT: 4001,
        WS_PORT: 4002,
      },
    },
  ],
};
```

**Deploy:**
```bash
# Build all packages
bun run build

# Start services
pm2 start ecosystem.config.js --env production

# Save process list
pm2 save

# Set up startup script
pm2 startup

# View logs
pm2 logs

# Monitor
pm2 monit
```

### Option 2: Docker Compose

**Create docker-compose.yml:**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: bhcmarkets
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: bhcmarkets
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - bhcmarkets
    restart: always

  redis:
    image: redis:7
    volumes:
      - redis_data:/data
    networks:
      - bhcmarkets
    restart: always

  backend:
    build:
      context: .
      dockerfile: packages/backend/Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://bhcmarkets:${DB_PASSWORD}@postgres:5432/bhcmarkets
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis
    networks:
      - bhcmarkets
    restart: always

  order-engine:
    build:
      context: .
      dockerfile: packages/order-engine/Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://bhcmarkets:${DB_PASSWORD}@postgres:5432/bhcmarkets
      REDIS_URL: redis://redis:6379
    ports:
      - "4003:4003"
      - "4004:4004"
    depends_on:
      - postgres
      - redis
    networks:
      - bhcmarkets
    restart: always

  market-data:
    build:
      context: .
      dockerfile: packages/market-data/Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://bhcmarkets:${DB_PASSWORD}@postgres:5432/bhcmarkets
      REDIS_URL: redis://redis:6379
    ports:
      - "4001:4001"
      - "4002:4002"
    depends_on:
      - postgres
      - redis
    networks:
      - bhcmarkets
    restart: always

  nginx:
    image: nginx:latest
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
      - order-engine
      - market-data
    networks:
      - bhcmarkets
    restart: always

volumes:
  postgres_data:
  redis_data:

networks:
  bhcmarkets:
    driver: bridge
```

**Deploy:**
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 3: Kubernetes

**Create deployment manifests:**

```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend-api
  template:
    metadata:
      labels:
        app: backend-api
    spec:
      containers:
      - name: backend
        image: bhcmarkets/backend:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: bhcmarkets-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: bhcmarkets-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
          limits:
            memory: "4Gi"
            cpu: "2"
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /readyz
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: backend-api
spec:
  selector:
    app: backend-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: LoadBalancer
```

**Deploy to Kubernetes:**
```bash
# Create secrets
kubectl create secret generic bhcmarkets-secrets \
  --from-literal=database-url='postgresql://...' \
  --from-literal=jwt-secret='...'

# Apply deployments
kubectl apply -f backend-deployment.yaml
kubectl apply -f order-engine-deployment.yaml
kubectl apply -f market-data-deployment.yaml

# Check status
kubectl get pods
kubectl get services

# View logs
kubectl logs -f deployment/backend-api
```

## Nginx Configuration

**Create nginx.conf:**

```nginx
upstream backend_api {
    least_conn;
    server localhost:8080;
}

upstream order_engine {
    server localhost:4003;
}

upstream market_data {
    server localhost:4001;
}

# HTTP redirect to HTTPS
server {
    listen 80;
    server_name api.bhcmarkets.com;
    return 301 https://$server_name$request_uri;
}

# Backend API
server {
    listen 443 ssl http2;
    server_name api.bhcmarkets.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Rate limiting
        limit_req zone=api_limit burst=20 nodelay;
    }
}

# WebSocket servers
server {
    listen 443 ssl http2;
    server_name ws.bhcmarkets.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location /market-data {
        proxy_pass http://localhost:4002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    location /order-engine {
        proxy_pass http://localhost:4004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
```

## Frontend Deployment

### Vite Apps (Static Sites)

**Build:**
```bash
# Build all apps
bun run build:apps

# Or build individual apps
bun run --filter=platform build
bun run --filter=auth build
bun run --filter=admin build
bun run --filter=web build
```

**Deploy to Vercel:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd apps/platform
vercel --prod
```

**Deploy to Netlify:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd apps/platform
netlify deploy --prod --dir=dist
```

**Deploy to S3 + CloudFront:**
```bash
# Sync to S3
aws s3 sync dist/ s3://bhcmarkets-platform/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id XXX --paths "/*"
```

## Monitoring

### Application Monitoring

**Sentry (Error Tracking):**
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

**Datadog (Metrics & APM):**
```typescript
import { StatsD } from 'node-dogstatsd';

const dogstatsd = new StatsD();

// Track metrics
dogstatsd.increment('orders.placed');
dogstatsd.histogram('order.execution_time', executionTime);
```

### Health Checks

**Kubernetes liveness probe:**
```typescript
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok' });
});
```

**Kubernetes readiness probe:**
```typescript
app.get('/readyz', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});
```

## Backup & Recovery

### Database Backup

**Point-in-Time Recovery:**
```bash
# Enable WAL archiving in postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/wal_archive/%f'
```

**Restore from backup:**
```bash
# Stop PostgreSQL
sudo systemctl stop postgresql

# Restore from base backup
rm -rf /var/lib/postgresql/15/main
tar -xzf /var/backups/postgres/base_backup.tar.gz -C /var/lib/postgresql/15/main

# Create recovery.conf
echo "restore_command = 'cp /var/lib/postgresql/wal_archive/%f %p'" > /var/lib/postgresql/15/main/recovery.conf

# Start PostgreSQL
sudo systemctl start postgresql
```

## Security Checklist

- [ ] Use HTTPS everywhere (TLS 1.3)
- [ ] Generate strong JWT secret (256-bit)
- [ ] Enable database SSL connections
- [ ] Set up firewall rules (only allow necessary ports)
- [ ] Use environment variables for secrets (never commit to git)
- [ ] Enable rate limiting on API endpoints
- [ ] Set up CORS with specific origins
- [ ] Enable HTTP security headers
- [ ] Use prepared statements (prevent SQL injection)
- [ ] Sanitize user inputs
- [ ] Set up automated backups
- [ ] Enable audit logging
- [ ] Use least-privilege principle for database users
- [ ] Set up monitoring and alerting
- [ ] Keep dependencies up to date
- [ ] Conduct regular security audits

## License

Private - BHC Markets
