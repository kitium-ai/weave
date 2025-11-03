# Weave Deployment Guide

Production deployment guide for Weave applications across different environments.

## Environment Setup

### Required Environment Variables

```bash
# Provider Configuration
OPENAI_API_KEY=sk_...
OPENAI_MODEL=gpt-4

# OR
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-sonnet

# OR
GOOGLE_API_KEY=AIza...
GOOGLE_MODEL=gemini-pro

# Application
NODE_ENV=production
LOG_LEVEL=info
PORT=3000
```

### .env.example

```bash
# Copy to .env and fill in values
OPENAI_API_KEY=your_key_here
NODE_ENV=production
LOG_LEVEL=info
ENABLE_MONITORING=true
METRICS_ENDPOINT=http://prometheus:9090
```

## Deployment Platforms

### Node.js/Express - Docker

**Dockerfile**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

# Copy application
COPY . .

# Build if necessary
RUN yarn build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "dist/index.js"]
```

**docker-compose.yml**

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - LOG_LEVEL=info
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

  prometheus:
    image: prom/prometheus
    ports:
      - '9090:9090'
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

### Next.js - Vercel

**vercel.json**

```json
{
  "env": {
    "OPENAI_API_KEY": "@openai_api_key",
    "LOG_LEVEL": "info"
  },
  "buildCommand": "yarn build",
  "outputDirectory": ".next",
  "functions": {
    "pages/api/**/*.ts": {
      "memory": 512,
      "maxDuration": 10
    }
  }
}
```

### Next.js - Self-Hosted

```bash
# Build
yarn build

# Start production server
NODE_ENV=production node .next/standalone/server.js

# With PM2 for process management
pm2 start .next/standalone/server.js --name "weave-app" --instances max
```

### NestJS - Docker + K8s

**Dockerfile**

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json yarn.lock ./
RUN yarn install

COPY . .
RUN yarn build

FROM node:18-alpine

WORKDIR /app
COPY package*.json yarn.lock ./
RUN yarn install --production

COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]
```

**k8s-deployment.yaml**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: weave-api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: weave-api
  template:
    metadata:
      labels:
        app: weave-api
    spec:
      containers:
        - name: api
          image: weave-api:latest
          ports:
            - containerPort: 3000
          env:
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: weave-secrets
                  key: openai-api-key
            - name: NODE_ENV
              value: 'production'
          resources:
            requests:
              memory: '256Mi'
              cpu: '250m'
            limits:
              memory: '512Mi'
              cpu: '500m'
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: weave-api-service
spec:
  selector:
    app: weave-api
  type: LoadBalancer
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
```

### React/Vue/Svelte - Static Hosting

**Netlify Configuration**

```toml
[build]
  command = "yarn build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
```

**AWS S3 + CloudFront**

```bash
# Build
yarn build

# Deploy to S3
aws s3 sync dist/ s3://my-bucket/ --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id E123ABCD --paths "/*"
```

### React Native - EAS Build

**eas.json**

```json
{
  "build": {
    "production": {
      "ios": {
        "buildType": "archive"
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "asciiProvider": "app-store-connect"
      },
      "android": {
        "googlePlayAccount": "my-account"
      }
    }
  }
}
```

### Flutter - Release Build

```bash
# iOS
flutter build ios --release

# Android
flutter build appbundle --release

# Web
flutter build web --release
```

## Monitoring and Observability

### Structured Logging

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});

// Usage
logger.info({ prompt: 'hello' }, 'Generation started');
```

### Metrics with Prometheus

```typescript
import { register, Counter, Histogram } from 'prom-client';

const generateCounter = new Counter({
  name: 'weave_generate_total',
  help: 'Total generation requests',
  labelNames: ['status'],
});

const generateDuration = new Histogram({
  name: 'weave_generate_duration_ms',
  help: 'Generation duration in milliseconds',
});

// Usage
const start = Date.now();
try {
  await weave.generate(prompt);
  generateCounter.labels('success').inc();
} catch (error) {
  generateCounter.labels('error').inc();
} finally {
  generateDuration.observe(Date.now() - start);
}
```

### Error Tracking with Sentry

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

try {
  await weave.generate(prompt);
} catch (error) {
  Sentry.captureException(error);
}
```

## Security Considerations

### API Key Rotation

```bash
# Rotate keys regularly
# 1. Create new API key in provider dashboard
# 2. Update environment variable
# 3. Test in staging
# 4. Deploy to production
# 5. Revoke old key after confirmation
```

### CORS Configuration

```typescript
import cors from 'cors';

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
    credentials: true,
  })
);
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
});

app.use('/api/', limiter);
```

### Input Validation

```typescript
import { body, validationResult } from 'express-validator';

app.post(
  '/api/generate',
  body('prompt').isString().trim().isLength({ min: 1, max: 4000 }).escape(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process request
  }
);
```

## Performance Tuning

### Enable Caching

```typescript
import redis from 'redis';

const client = redis.createClient();

async function generateWithCache(prompt: string) {
  const cacheKey = `generate:${hash(prompt)}`;
  const cached = await client.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const result = await weave.generate(prompt);
  await client.setEx(cacheKey, 3600, JSON.stringify(result)); // 1 hour TTL

  return result;
}
```

### Connection Pooling

```typescript
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## Scaling Strategies

### Horizontal Scaling

```yaml
# Load balance across multiple instances
upstream api {
server app1:3000;
server app2:3000;
server app3:3000;
}

server {
listen 80;
location /api/ {
proxy_pass http://api;
}
}
```

### Queue Processing

```typescript
import Bull from 'bull';

const generateQueue = new Bull('generate', {
  redis: { host: 'redis', port: 6379 },
});

generateQueue.process(async (job) => {
  return await weave.generate(job.data.prompt);
});

// Add to queue
generateQueue.add(
  { prompt: 'hello' },
  {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  }
);
```

## Backup and Recovery

### Database Backups

```bash
# PostgreSQL
pg_dump -h localhost -U user database > backup.sql

# MongoDB
mongodump --uri mongodb://localhost/database

# Automated with cron
0 2 * * * pg_dump -h localhost -U user database | gzip > /backups/$(date +\%Y\%m\%d).sql.gz
```

## Rollback Procedures

```bash
# Docker rollback
docker service rollback weave-api

# Kubernetes rollback
kubectl rollout undo deployment/weave-api

# Git rollback
git revert <commit-hash>
git push origin main
```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Logging enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Backups tested
- [ ] Health checks working
- [ ] Rollback procedure documented
- [ ] Load testing completed
- [ ] Security audit passed

## Getting Help

- Documentation: https://weave.ai/docs
- Issues: https://github.com/kitium-ai/weave/issues
- Community: https://discord.gg/weave
