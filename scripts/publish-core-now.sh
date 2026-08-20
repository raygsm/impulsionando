#!/usr/bin/env bash
set -Eeuo pipefail

REPO_URL="https://github.com/raygsm/impulsionando.git"
STATE_DIR="/var/lib/impulsionando-publisher"
WORKTREE="$STATE_DIR/repo"
STATUS_FILE="$STATE_DIR/status.json"
RELEASE_ROOT="/var/www/impulsionando-core/releases"
CURRENT_LINK="/var/www/impulsionando-core/current"
COMPOSE="/opt/impulsionando/deploy/hostinger/docker-compose.yml"
LOCK_FILE="$STATE_DIR/publish.lock"

mkdir -p "$STATE_DIR" "$RELEASE_ROOT" "$STATE_DIR/npm-home" "$STATE_DIR/npm-cache"
chmod 0755 "$STATE_DIR" "$STATE_DIR/npm-home" "$STATE_DIR/npm-cache"
export HOME="$STATE_DIR/npm-home"
export npm_config_cache="$STATE_DIR/npm-cache"
export npm_config_update_notifier=false
export npm_config_fund=false
export npm_config_audit=false

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  printf '{"state":"busy","stage":"Já existe uma publicação em andamento.","updated_at":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$STATUS_FILE"
  chmod 0644 "$STATUS_FILE"
  exit 0
fi

write_status() {
  local state="$1" stage="$2" sha="${3:-}"
  python3 - "$STATUS_FILE" "$state" "$stage" "$sha" <<'PY'
import json,sys,datetime,os
path,state,stage,sha=sys.argv[1:]
obj={"state":state,"stage":stage,"sha":sha or None,"updated_at":datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z')}
tmp=path+'.tmp'
with open(tmp,'w',encoding='utf-8') as f: json.dump(obj,f,ensure_ascii=False)
os.chmod(tmp,0o644)
os.replace(tmp,path)
PY
}

PREVIOUS_RELEASE=""
EDGE_ROLLBACK_READY=0
switched=0
rollback() {
  rc=$?
  set +e
  write_status "error" "Falha na publicação. Produção anterior preservada/restaurada." "${SHA:-}"
  if [ "$switched" = 1 ] && [ -n "$PREVIOUS_RELEASE" ] && [ -f "$PREVIOUS_RELEASE/.output/server/index.mjs" ]; then
    ln -sfn "$PREVIOUS_RELEASE" "$CURRENT_LINK"
    systemctl restart impulsionando-core
  fi
  if [ "$EDGE_ROLLBACK_READY" = 1 ] && docker image inspect impulsionando-core:deploy-rollback >/dev/null 2>&1; then
    docker tag "$old_image" impulsionando-core:latest 2>/dev/null || docker tag impulsionando-core:deploy-rollback impulsionando-core:latest
    cd /opt/impulsionando/deploy/hostinger
    docker compose -f "$COMPOSE" up -d --no-build --force-recreate impulsionando-core >/dev/null 2>&1 || true
  fi
  exit "$rc"
}
trap rollback ERR

write_status "running" "Sincronizando o código mais recente do GitHub." ""
rm -rf "$WORKTREE"
git clone --depth=1 --branch main "$REPO_URL" "$WORKTREE"
SHA="$(git -C "$WORKTREE" rev-parse HEAD)"

CURRENT_RELEASE="$(readlink -f "$CURRENT_LINK" 2>/dev/null || true)"
if [ -n "$CURRENT_RELEASE" ] && [[ "$CURRENT_RELEASE" == *"$SHA"* ]]; then
  write_status "success" "O front já está publicado na versão mais recente." "$SHA"
  exit 0
fi

write_status "running" "Instalando dependências e validando a versão." "$SHA"
cd "$WORKTREE"
npm ci --no-audit --no-fund

write_status "running" "Compilando o front e o backend do Core." "$SHA"
npm run build

test -f .output/server/index.mjs
test -d .output/public
test -f scripts/start-core-runtime.mjs

RELEASE_DIR="$RELEASE_ROOT/manual-$SHA"
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"
cp -a .output "$RELEASE_DIR/.output"
cp -a scripts "$RELEASE_DIR/scripts"
cp package.json package-lock.json "$RELEASE_DIR/"
cd "$RELEASE_DIR"
npm ci --omit=dev --no-audit --no-fund

PREVIOUS_RELEASE="$CURRENT_RELEASE"
if [ -n "$PREVIOUS_RELEASE" ]; then printf '%s\n' "$PREVIOUS_RELEASE" > /var/www/impulsionando-core/.previous-release; fi

write_status "running" "Ativando a nova versão com rollback automático." "$SHA"
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"
switched=1
systemctl restart impulsionando-core
for attempt in $(seq 1 45); do
  if curl -fsS --max-time 5 http://127.0.0.1:3000/ >/dev/null 2>&1; then break; fi
  [ "$attempt" -lt 45 ] || false
  sleep 1
done

write_status "running" "Atualizando a borda pública da CHRISMED e demais clientes do Core." "$SHA"
test -f "$COMPOSE"
old_image="$(docker inspect -f '{{.Image}}' impulsionando-core 2>/dev/null || true)"
if [ -n "$old_image" ]; then
  docker tag "$old_image" impulsionando-core:deploy-rollback
  EDGE_ROLLBACK_READY=1
fi
cat > /tmp/Dockerfile.impulsionando-runtime <<'DOCKERFILE'
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY .output ./.output
COPY scripts ./scripts
EXPOSE 3000
CMD ["node","scripts/start-core-runtime.mjs"]
DOCKERFILE
printf 'node_modules\n' > "$RELEASE_DIR/.dockerignore"
docker build -f /tmp/Dockerfile.impulsionando-runtime -t impulsionando-core:latest "$RELEASE_DIR"
cd /opt/impulsionando/deploy/hostinger
docker compose -f "$COMPOSE" up -d --no-build --force-recreate impulsionando-core

for attempt in $(seq 1 60); do
  ip="$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' impulsionando-core 2>/dev/null || true)"
  if [ -n "$ip" ] && curl -fsS --max-time 5 -H 'Host: chrismed.impulsionando.com.br' -H 'Accept: text/html,application/xhtml+xml' "http://$ip:3000/" >/dev/null 2>&1; then break; fi
  [ "$attempt" -lt 60 ] || false
  sleep 2
done

write_status "success" "PUBLICADO. A nova versão já está disponível no front." "$SHA"
