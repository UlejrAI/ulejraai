#!/usr/bin/env bash
# =============================================================================
# setup-openclaw-gcp.sh
# One-time GCP infrastructure setup for OpenClaw Mission Control
#
# Usage:
#   chmod +x scripts/setup-openclaw-gcp.sh
#   ./scripts/setup-openclaw-gcp.sh
#
# What this script does:
#   1. Creates a Cloud SQL PostgreSQL 16 instance (openclaw-postgres)
#   2. Creates the mission_control database inside it
#   3. Creates a Cloud Memorystore Redis instance (openclaw-redis)
#   4. Generates a secure LOCAL_AUTH_TOKEN
#   5. Stores DATABASE_URL, AUTH_TOKEN, REDIS_URL in GCP Secret Manager
#   6. Grants Cloud Run SA access to the secrets
# =============================================================================

set -euo pipefail

PROJECT_ID="ulejraai"
REGION="europe-west1"
CLOUD_RUN_SA="481969206534-compute@developer.gserviceaccount.com"

CLOUDSQL_INSTANCE="openclaw-postgres"
CLOUDSQL_DB="mission_control"
CLOUDSQL_USER="openclaw"

REDIS_INSTANCE="openclaw-redis"

SECRET_DB="OPENCLAW_DATABASE_URL"
SECRET_TOKEN="OPENCLAW_AUTH_TOKEN"
SECRET_REDIS="OPENCLAW_REDIS_URL"

echo "=== OpenClaw GCP Setup ==="
echo "Project: $PROJECT_ID | Region: $REGION"
echo ""

# ── 1. Cloud SQL (PostgreSQL 16) ──────────────────────────────────────────────
echo "[1/5] Creating Cloud SQL instance: $CLOUDSQL_INSTANCE ..."
if gcloud sql instances describe "$CLOUDSQL_INSTANCE" --project="$PROJECT_ID" &>/dev/null; then
  echo "  ✓ Already exists, skipping."
else
  gcloud sql instances create "$CLOUDSQL_INSTANCE" \
    --database-version=POSTGRES_16 \
    --tier=db-f1-micro \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --storage-auto-increase
  echo "  ✓ Instance created."
fi

echo "[2/5] Creating database and user ..."
# Create database
gcloud sql databases create "$CLOUDSQL_DB" \
  --instance="$CLOUDSQL_INSTANCE" \
  --project="$PROJECT_ID" 2>/dev/null || echo "  ✓ Database already exists."

# Generate a random password for the SQL user
CLOUDSQL_PASSWORD=$(openssl rand -hex 24)

# Create user
gcloud sql users create "$CLOUDSQL_USER" \
  --instance="$CLOUDSQL_INSTANCE" \
  --password="$CLOUDSQL_PASSWORD" \
  --project="$PROJECT_ID" 2>/dev/null || echo "  ✓ User already exists (password not changed)."

# Build the connection string (using Cloud Run's Cloud SQL connector via Unix socket)
CLOUDSQL_CONNECTION_NAME=$(gcloud sql instances describe "$CLOUDSQL_INSTANCE" \
  --project="$PROJECT_ID" --format="value(connectionName)")

DATABASE_URL="postgresql+psycopg://${CLOUDSQL_USER}:${CLOUDSQL_PASSWORD}@/${CLOUDSQL_DB}?host=/cloudsql/${CLOUDSQL_CONNECTION_NAME}"
echo "  ✓ DATABASE_URL constructed (via Unix socket for Cloud Run)."

# ── 2. Cloud Memorystore Redis (Basic tier, 1 GB) ─────────────────────────────
echo "[3/5] Creating Cloud Memorystore Redis: $REDIS_INSTANCE ..."
if gcloud redis instances describe "$REDIS_INSTANCE" --region="$REGION" --project="$PROJECT_ID" &>/dev/null; then
  echo "  ✓ Already exists, skipping."
  REDIS_HOST=$(gcloud redis instances describe "$REDIS_INSTANCE" \
    --region="$REGION" --project="$PROJECT_ID" --format="value(host)")
else
  gcloud redis instances create "$REDIS_INSTANCE" \
    --size=1 \
    --region="$REGION" \
    --redis-version=redis_7_0 \
    --project="$PROJECT_ID"
  REDIS_HOST=$(gcloud redis instances describe "$REDIS_INSTANCE" \
    --region="$REGION" --project="$PROJECT_ID" --format="value(host)")
  echo "  ✓ Redis created at $REDIS_HOST."
fi

REDIS_PORT=6379
REDIS_URL="redis://${REDIS_HOST}:${REDIS_PORT}/0"

# ── 3. Generate auth token ────────────────────────────────────────────────────
echo "[4/5] Generating LOCAL_AUTH_TOKEN ..."
AUTH_TOKEN=$(openssl rand -hex 32)
echo "  ✓ Token generated (64 hex chars)."

# ── 4. Create / update secrets in Secret Manager ─────────────────────────────
echo "[5/5] Writing secrets to GCP Secret Manager ..."

create_or_update_secret() {
  local name="$1"
  local value="$2"
  if gcloud secrets describe "$name" --project="$PROJECT_ID" &>/dev/null; then
    echo "$value" | gcloud secrets versions add "$name" \
      --data-file=- --project="$PROJECT_ID"
    echo "  ✓ Updated secret: $name"
  else
    echo "$value" | gcloud secrets create "$name" \
      --data-file=- --project="$PROJECT_ID" \
      --replication-policy=automatic
    echo "  ✓ Created secret: $name"
  fi
}

create_or_update_secret "$SECRET_DB"    "$DATABASE_URL"
create_or_update_secret "$SECRET_TOKEN" "$AUTH_TOKEN"
create_or_update_secret "$SECRET_REDIS" "$REDIS_URL"

# Grant Cloud Run SA access to all openclaw secrets
for secret in "$SECRET_DB" "$SECRET_TOKEN" "$SECRET_REDIS"; do
  gcloud secrets add-iam-policy-binding "$secret" \
    --project="$PROJECT_ID" \
    --member="serviceAccount:$CLOUD_RUN_SA" \
    --role="roles/secretmanager.secretAccessor" 2>/dev/null || true
done
echo "  ✓ IAM bindings set for $CLOUD_RUN_SA"

# Grant Cloud Run SA access to Cloud SQL
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$CLOUD_RUN_SA" \
  --role="roles/cloudsql.client" 2>/dev/null || true
echo "  ✓ Cloud SQL client role granted to Cloud Run SA"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "============================================================"
echo "✅ OpenClaw GCP setup complete!"
echo ""
echo "  DATABASE_URL  → stored in Secret Manager: $SECRET_DB"
echo "  AUTH_TOKEN    → stored in Secret Manager: $SECRET_TOKEN"
echo "  REDIS_URL     → stored in Secret Manager: $SECRET_REDIS"
echo ""
echo "  LOCAL_AUTH_TOKEN (save this for login): $AUTH_TOKEN"
echo ""
echo "IMPORTANT: Add Cloud SQL connection to Cloud Run deploy flags:"
echo "  --add-cloudsql-instances=$CLOUDSQL_CONNECTION_NAME"
echo ""
echo "Update .github/workflows/deploy-openclaw.yml to add:"
echo "  flags: \"--add-cloudsql-instances=$CLOUDSQL_CONNECTION_NAME\""
echo "============================================================"
