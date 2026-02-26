#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# SanWD v6 – Deployment Script
# Immer: Master-Node only, Image: sanwd-app:v65, NS: sanwd
# ═══════════════════════════════════════════════════════════════
set -e

NERDCTL="nerdctl --address /run/k3s/containerd/containerd.sock --namespace k8s.io"
IMAGE="docker.io/library/sanwd-app:v65"
NS="sanwd"
DEPLOY="sanwd-app"

echo "🔨 Build: $IMAGE"
$NERDCTL build -t $IMAGE .

echo "🚀 Deploy: $DEPLOY in $NS"
kubectl -n $NS set image deployment/$DEPLOY sanwd=$IMAGE
kubectl -n $NS delete pod -l app=$DEPLOY
kubectl -n $NS rollout status deployment/$DEPLOY --timeout=60s

echo "✅ Fertig: $(kubectl -n $NS get pods -l app=$DEPLOY --no-headers)"
