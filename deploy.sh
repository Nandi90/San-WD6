#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# BRK SanWD v6 — Build & Deploy auf RKE2
# ═══════════════════════════════════════════════════════════════════
set -e
V6_DIR="/home/k8susr/SanWD/sanwd-v6"
V5_DIR="/home/k8susr/SanWD/sanwd-k8s"

echo "═══════════════════════════════════════════════"
echo "  BRK SanWD v6 — Build & Deploy"
echo "═══════════════════════════════════════════════"
echo ""

# ── 1. Frontend migrieren ─────────────────────────────────────────
echo "🔄 1/5: v5 → v6 Frontend-Migration..."
cd "$V6_DIR"
python3 migrate-v5-to-v6.py

# api.js + hooks.js sind schon da
echo "✅ Frontend migriert"
echo ""

# ── 2. Secrets aus v5 übernehmen ──────────────────────────────────
echo "🔑 2/5: Secrets aus v5 übernehmen..."
if [ -f "$V5_DIR/sanwd-k8s.yaml" ]; then
  # Extract secrets from v5 manifest
  SESSION_SECRET=$(grep 'SESSION_SECRET:' "$V5_DIR/sanwd-k8s.yaml" | head -1 | awk -F'"' '{print $2}')
  NC_PASSWORD=$(grep 'NEXTCLOUD_PASSWORD:' "$V5_DIR/sanwd-k8s.yaml" | head -1 | awk -F'"' '{print $2}')
  OIDC_SECRET=$(grep 'OIDC_CLIENT_SECRET:' "$V5_DIR/sanwd-k8s.yaml" | head -1 | awk -F'"' '{print $2}')

  if [ -n "$SESSION_SECRET" ] && [ "$SESSION_SECRET" != "HIER_GENERIEREN" ]; then
    sed -i "s|SESSION_SECRET: \"HIER_GENERIEREN\"|SESSION_SECRET: \"$SESSION_SECRET\"|" "$V6_DIR/sanwd-k8s.yaml"
    sed -i "s|NEXTCLOUD_PASSWORD: \"HIER_PASSWORT\"|NEXTCLOUD_PASSWORD: \"$NC_PASSWORD\"|" "$V6_DIR/sanwd-k8s.yaml"
    sed -i "s|OIDC_CLIENT_SECRET: \"HIER_CLIENT_SECRET\"|OIDC_CLIENT_SECRET: \"$OIDC_SECRET\"|" "$V6_DIR/sanwd-k8s.yaml"
    echo "✅ Secrets aus v5 übernommen"
  else
    echo "⚠️  v5 Secrets nicht gefunden, bitte manuell eintragen: nano $V6_DIR/sanwd-k8s.yaml"
  fi
else
  echo "⚠️  v5 Manifest nicht gefunden, bitte Secrets manuell eintragen"
fi
echo ""

# ── 3. Docker Image bauen ─────────────────────────────────────────
echo "🐳 3/5: Docker Image bauen..."
cd "$V6_DIR"

nerdctl --address /run/k3s/containerd/containerd.sock \
  --namespace k8s.io \
  build -t docker.io/library/sanwd-app:v6 .

echo "✅ Image sanwd-app:v6 gebaut"
echo ""

# ── 4. Image auf Worker verteilen ─────────────────────────────────
echo "📦 4/5: Image auf Worker verteilen..."

nerdctl --address /run/k3s/containerd/containerd.sock \
  --namespace k8s.io \
  save -o /tmp/sanwd-app-v6.tar docker.io/library/sanwd-app:v6

for WORKER in 10.100.0.101 10.100.0.102; do
  echo "  → $WORKER"
  scp /tmp/sanwd-app-v6.tar k8susr@$WORKER:/tmp/ 2>/dev/null || true
  ssh k8susr@$WORKER "su -c '/var/lib/rancher/rke2/bin/ctr --address /run/k3s/containerd/containerd.sock --namespace k8s.io images import /tmp/sanwd-app-v6.tar && rm /tmp/sanwd-app-v6.tar'" 2>/dev/null || echo "  ⚠️ Worker $WORKER manuell importieren!"
done
rm -f /tmp/sanwd-app-v6.tar
echo "✅ Images verteilt"
echo ""

# ── 5. Deployment ─────────────────────────────────────────────────
echo "🚀 5/5: Kubernetes Deployment..."

# Altes v5 Deployment löschen (gleicher Namespace, neues Image-Tag)
kubectl delete deployment sanwd-app -n sanwd 2>/dev/null || true
sleep 2

# v6 deployen
kubectl apply -f "$V6_DIR/sanwd-k8s.yaml"

echo ""
echo "⏳ Warte auf Ready..."
for i in $(seq 1 30); do
  STATUS=$(kubectl get pods -n sanwd -l app=sanwd-app -o jsonpath='{.items[0].status.containerStatuses[0].ready}' 2>/dev/null)
  if [ "$STATUS" = "true" ]; then
    echo ""
    echo "✅ Pod ist Ready!"
    break
  fi
  sleep 2
  echo -n "."
done

echo ""
kubectl get pods -n sanwd
echo ""

# Health check
echo "🏥 Health Check..."
sleep 3
curl -s http://10.100.0.100:30092/api/health | python3 -m json.tool 2>/dev/null || echo "Health Check pending..."

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ BRK SanWD v6 deployed!"
echo ""
echo "  URL:       https://sanwd.brkndsob.org"
echo "  NodePort:  http://10.100.0.100:30092"
echo "  Health:    http://10.100.0.100:30092/api/health"
echo "  Version:   6.0.0"
echo ""
echo "  Nächste Schritte:"
echo "  1. ILS-PDF hochladen (Admin → Templates)"
echo "  2. Feld-Mapping konfigurieren"
echo "  3. Stammdaten prüfen"
echo "═══════════════════════════════════════════════"
