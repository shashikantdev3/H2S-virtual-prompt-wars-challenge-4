#!/usr/bin/env bash
#
# One-command deploy of StadiumIQ to Google Cloud Run (from source).
#
# Prerequisites (one-time):
#   1. Install the gcloud CLI:  https://cloud.google.com/sdk/docs/install
#   2. Authenticate:            gcloud auth login
#   3. Pick/create a project:   gcloud projects create <id>  (or use an existing one)
#
# Usage:
#   ./deploy.sh                          # uses your active gcloud project
#   PROJECT_ID=my-proj ./deploy.sh       # target a specific project
#   GEMINI_API_KEY=xxxx ./deploy.sh      # deploy with the generative model enabled
#
# Optional environment overrides:
#   REGION   (default: us-central1)
#   SERVICE  (default: stadiumiq)
#
set -euo pipefail

SERVICE="${SERVICE:-stadiumiq}"
REGION="${REGION:-us-central1}"

echo "==> StadiumIQ deploy to Google Cloud Run"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "ERROR: gcloud CLI not found. Install it: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

# Resolve the project id.
PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || true)}"
if [ -z "${PROJECT_ID}" ] || [ "${PROJECT_ID}" = "(unset)" ]; then
  echo "ERROR: No GCP project set. Run 'gcloud config set project <PROJECT_ID>' or pass PROJECT_ID=..."
  exit 1
fi

echo "    Project : ${PROJECT_ID}"
echo "    Service : ${SERVICE}"
echo "    Region  : ${REGION}"

echo "==> Enabling required APIs (run, cloudbuild, artifactregistry)..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  --project "${PROJECT_ID}"

# Pass the Gemini key as a runtime env var only if provided (never baked into the image).
ENV_ARGS=()
if [ -n "${GEMINI_API_KEY:-}" ]; then
  echo "==> GEMINI_API_KEY detected: deploying with the generative model enabled."
  ENV_ARGS+=(--set-env-vars "GEMINI_API_KEY=${GEMINI_API_KEY}")
else
  echo "==> No GEMINI_API_KEY set: deploying with the deterministic fallback (still fully functional)."
fi

echo "==> Building and deploying from source (this can take a few minutes)..."
gcloud run deploy "${SERVICE}" \
  --source . \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --cpu 1 \
  --memory 512Mi \
  --max-instances 3 \
  "${ENV_ARGS[@]}"

echo "==> Done. Service URL:"
gcloud run services describe "${SERVICE}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --format 'value(status.url)'
