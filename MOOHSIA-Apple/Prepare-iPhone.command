#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
echo "MOOHSIA iPhone Personal Team 準備"
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
    echo "需要 XcodeGen；目前沒有 Homebrew。請先用 Xcode 開發階段安裝 XcodeGen，或之後由 GitHub 產生專案。"
    open "https://github.com/yonaskolb/XcodeGen/releases" || true
    read -r -p "按 Enter 結束…"
    exit 1
  fi
fi
xcodegen generate
open MOOHSIA.xcodeproj
echo "Xcode 已開啟。只需到 Signing & Capabilities 選你的 Personal Team，再把 iPhone 接上並按 Run。"
