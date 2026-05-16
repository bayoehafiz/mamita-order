#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-103.183.74.22}"
REMOTE_USER="${REMOTE_USER:-masbay}"
REMOTE_DIR="${REMOTE_DIR:-~/projects/mamita-order}"
COMPOSE_FILE="docker-compose.yml"

echo "==> Pulling latest image from GHCR..."
docker compose -f "${COMPOSE_FILE}" pull mamita-order

echo "==> Recreating container..."
docker compose -f "${COMPOSE_FILE}" up -d --force-recreate mamita-order

echo "==> Pruning unused images..."
docker image prune -f

echo "==> Health check..."
sleep 5
docker compose -f "${COMPOSE_FILE}" ps

echo "==> Deploy complete!"
