#!/usr/bin/env bash
set -euo pipefail

base=http://127.0.0.1:9036
sudo sysctl -w vm.max_map_count=524288
docker run -d --name ec4206-sonar --ulimit nofile=131072:131072 \
  -p 127.0.0.1:9036:9000 sonarqube:26.11.0.134175-community

status=STARTING
for attempt in {1..90}; do
  status=$(curl -fsS "$base/api/system/status" 2>/dev/null | jq -r '.status' || true)
  if [[ "$status" == UP ]]; then break; fi
  sleep 3
done
[[ "$status" == UP ]]

password="Qz9!$(openssl rand -hex 16)"
echo "::add-mask::$password"
curl --fail-with-body -sS -u admin:admin -X POST "$base/api/users/change_password" \
  --data-urlencode login=admin --data-urlencode previousPassword=admin \
  --data-urlencode "password=$password"
token=$(curl --fail-with-body -sS -u "admin:$password" -X POST "$base/api/user_tokens/generate" \
  --data-urlencode name=ec4206-analysis | jq -er '.token')
echo "::add-mask::$token"
printf 'token=%s\n' "$token" >> "$GITHUB_OUTPUT"
