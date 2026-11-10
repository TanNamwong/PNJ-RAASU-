#!/usr/bin/env bash
# ใช้: ./bump-version.sh 1.0.3 "รายละเอียดอัปเดต"
set -e
V="$1"; NOTES="${2:-อัปเดตแอป}"
[ -z "$V" ] && { echo "ระบุเวอร์ชัน เช่น 1.0.3"; exit 1; }
cd "$(dirname "$0")"
sed -i "s/const APP_VERSION='[^']*'/const APP_VERSION='$V'/" index.html
sed -i "s/<span id=\"footerVersion\">[^<]*</<span id=\"footerVersion\">$V</" index.html
sed -i "s/^const VERSION='[^']*'/const VERSION='$V'/" sw.js
printf '{\n  "version": "%s",\n  "notes": "%s"\n}\n' "$V" "$NOTES" > version.json
echo "อัปเดตเป็น $V แล้ว -> git add . && git commit && git push"
