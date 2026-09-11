#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

echo "MOOHSIA iPhone · Apple Developer Program 準備"

if ! xcode-select -p >/dev/null 2>&1; then
  echo "尚未安裝 Xcode Command Line Tools。"
  xcode-select --install || true
  read -r -p "安裝完成後重新執行；按 Enter 結束…"
  exit 1
fi

if ! command -v xcodegen >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    brew install xcodegen
  else
    echo "需要 XcodeGen；目前沒有 Homebrew。"
    echo "你也可以直接使用 GitHub Actions 產生的 MOOHSIA.xcodeproj 正式專案包。"
    open "https://github.com/yonaskolb/XcodeGen/releases" || true
    read -r -p "按 Enter 結束…"
    exit 1
  fi
fi

xcodegen generate
open MOOHSIA.xcodeproj

echo
printf '%s\n' "Xcode 已開啟。請到 MOOHSIA-iOS > Signing & Capabilities："
printf '%s\n' "1. 勾選 Automatically manage signing"
printf '%s\n' "2. Team 選你的付費 Apple Developer Program Team（不要選 Personal Team）"
printf '%s\n' "3. 確認 Bundle Identifier 為 com.moohsia.personal.ios"
printf '%s\n' "4. iCloud capability 應顯示 CloudKit，container 為 iCloud.com.moohsia.personal.ios"
printf '%s\n' "5. 接上 iPhone，選它作為 Run Destination；若出現 Register Device 就按下去"
printf '%s\n' "6. 按 Run 安裝暮霞"
