#!/bin/bash
# Push the extracted source folder to a repository owned by the user.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
if ! command -v git >/dev/null 2>&1; then
  echo 'Git kurulu değil. Önce Git kurulumu yapın.'
  exit 1
fi
DEFAULT_REMOTE='https://github.com/muratpalak/Frameera-Social-OS.git'
echo 'GitHub üzerinde önce BOŞ Frameera-Social-OS deposunu oluşturun.'
read -r -p "GitHub depo adresi [$DEFAULT_REMOTE]: " REMOTE
REMOTE="${REMOTE:-$DEFAULT_REMOTE}"
case "$REMOTE" in https://github.com/*/*.git|git@github.com:*/*.git) ;; *) echo 'Geçerli bir GitHub .git depo adresi girin.'; exit 1 ;; esac
if [ ! -d .git ]; then git init; fi
git branch -M main
git add .
if ! git diff --cached --quiet; then
  git commit -m 'Release Frameera Social OS v1.1'
else
  echo 'Yeni değişiklik yok; mevcut commit gönderilecek.'
fi
if git remote get-url origin >/dev/null 2>&1; then
  CURRENT="$(git remote get-url origin)"
  if [ "$CURRENT" != "$REMOTE" ]; then
    echo "Mevcut origin farklı: $CURRENT"
    echo 'Depo değiştirilmedi. İşlemi durdurup bağlantıyı kontrol edin.'
    exit 1
  fi
else
  git remote add origin "$REMOTE"
fi
git push -u origin main
echo 'GitHub aktarımı tamamlandı.'
