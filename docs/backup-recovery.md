# Backup & Recovery Strategy
PRD-06: Section 15 — Backup & Recovery

---

## 1. Nightly Backups

### PostgreSQL (Supabase)

Supabase provides automatic daily backups on paid plans. For self-hosted or additional backup:

```bash
# Run nightly via cron (00:30 UTC daily)
# Add to crontab: 30 0 * * * /opt/scripts/backup-db.sh

#!/bin/bash
set -euo pipefail

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
DB_URL="${DATABASE_URL}"

mkdir -p "$BACKUP_DIR"

pg_dump "$DB_URL" \
  --format=custom \
  --compress=9 \
  --file="$BACKUP_DIR/cse_platform_$DATE.dump"

# Retain last 30 days only
find "$BACKUP_DIR" -name "*.dump" -mtime +30 -delete

echo "Backup completed: cse_platform_$DATE.dump"
```

### Redis (AOF + RDB)

Redis is configured in `docker-compose.yml` with `appendonly yes` (AOF persistence).
The `redis_data` Docker volume persists across container restarts.

Additional snapshot backup:

```bash
# Copy RDB snapshot
docker exec cse_redis redis-cli BGSAVE
docker cp cse_redis:/data/dump.rdb /backups/redis/dump_$(date +%Y%m%d).rdb
```

---

## 2. Restore Process

### PostgreSQL Restore

```bash
# Full restore from custom-format dump
pg_restore \
  --clean \
  --if-exists \
  --dbname="${DATABASE_URL}" \
  /backups/postgres/cse_platform_<DATE>.dump

# Verify restore
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;"
```

### Redis Restore

```bash
# Stop Redis, copy backup, restart
docker compose stop redis
docker cp /backups/redis/dump_<DATE>.rdb cse_redis:/data/dump.rdb
docker compose start redis
```

---

## 3. Migration Rollback Strategy

### Before running migrations in production:

```bash
# 1. Create a backup first
pg_dump "$DATABASE_URL" --format=custom --file="pre_migration_$(date +%Y%m%d).dump"

# 2. Apply migration
npx prisma migrate deploy

# 3. If rollback is needed — restore backup
pg_restore --clean --dbname="$DATABASE_URL" pre_migration_<DATE>.dump
```

### Using Prisma migrate resolve (mark failed migration):

```bash
# Mark a failed migration as rolled back
npx prisma migrate resolve --rolled-back <migration_name>

# Then re-apply from a specific point
npx prisma migrate deploy
```

### Emergency rollback checklist:
1. Stop the API container: `docker compose stop api worker`
2. Restore database from last known-good backup
3. Restore Redis snapshot if needed
4. Roll back application to previous Docker image tag
5. Restart services: `docker compose up -d`
6. Verify health: `curl http://localhost:3000/api/v1/health`

---

## 4. Automated Backup Script

```bash
#!/bin/bash
# /opt/scripts/full-backup.sh
# Schedule: 0 1 * * * (1 AM UTC daily)

set -euo pipefail

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_ROOT="/backups"

echo "[$(date)] Starting full backup..."

# PostgreSQL
pg_dump "${DATABASE_URL}" \
  --format=custom --compress=9 \
  --file="${BACKUP_ROOT}/postgres/cse_${DATE}.dump"

# Redis snapshot
docker exec cse_redis redis-cli BGSAVE
sleep 5
docker cp cse_redis:/data/dump.rdb "${BACKUP_ROOT}/redis/redis_${DATE}.rdb"

# Cleanup old backups (keep 30 days)
find "${BACKUP_ROOT}" -name "*.dump" -o -name "*.rdb" | \
  sort -r | tail -n +61 | xargs -r rm

echo "[$(date)] Backup complete"
```

---

## 5. Recovery Time Objectives

| Scenario | RTO | RPO |
|---|---|---|
| Redis failure | < 1 min (restart) | Last AOF entry (~1s) |
| DB connection loss | < 2 min (restart) | 0 (no data loss) |
| Full DB restore | < 30 min | Last nightly backup (24h) |
| Full service restore | < 1 hour | Last nightly backup |
