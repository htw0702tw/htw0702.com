#!/bin/bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
trap 'printf "\n建置沒有完成，請保留上方錯誤並交給 ChatGPT 修正。\n"' ERR
if [[ "$(uname -s)" != "Darwin" ]]; then
  printf '請在 Mac 執行。\n'; exit 1
fi
if ! xcrun --find swiftc >/dev/null 2>&1; then
  printf '尚未安裝 Apple 開發工具。請先安裝 Xcode Command Line Tools。\n'; exit 1
fi
mkdir -p build
printf '1/3 編譯暮霞 macOS App…\n'
stage="$(mktemp -d "$PWD/build/stage.XXXXXX")"
app="$stage/MOOHSIA.app"
mkdir -p "$app/Contents/MacOS"
xcrun swiftc -swift-version 5 -O -target "$(uname -m)-apple-macos14.0" \
  Shared/CloudModels.swift Shared/CloudAPI.swift Shared/TokenStore.swift Mac/MOOHSIAMac.swift \
  -framework SwiftUI -framework AppKit -framework Security \
  -o "$app/Contents/MacOS/MOOHSIA"
cat > "$app/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleExecutable</key><string>MOOHSIA</string>
<key>CFBundleIdentifier</key><string>com.moohsia.personal.macos</string>
<key>CFBundleName</key><string>暮霞 MOOHSIA</string>
<key>CFBundleDisplayName</key><string>暮霞 MOOHSIA</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>0.2.0</string>
<key>CFBundleVersion</key><string>1</string>
<key>LSMinimumSystemVersion</key><string>14.0</string>
<key>NSHighResolutionCapable</key><true/>
</dict></plist>
PLIST
printf '2/3 驗證並 ad-hoc 簽署…\n'
plutil -lint "$app/Contents/Info.plist"
codesign --force --sign - "$app"
codesign --verify --deep --strict "$app"
release_dir="$PWD/build/release-$(date +%Y%m%d-%H%M%S)"
mv "$stage" "$release_dir"
printf '3/3 建置成功：%s\n' "$release_dir/MOOHSIA.app"
