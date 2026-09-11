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
printf '1/4 執行 macOS 原生權限規則測試…\n'
xcrun swiftc -swift-version 5 Native/Policy.swift tests/PolicyTests.swift -o build/policy-tests
./build/policy-tests
printf '2/4 編譯暮霞 macOS App…\n'
stage="$(mktemp -d "$PWD/build/stage.XXXXXX")"
app="$stage/MOOHSIA.app"
mkdir -p "$app/Contents/MacOS" "$app/Contents/Resources"
xcrun swiftc -swift-version 5 -O -target "$(uname -m)-apple-macos14.0" \
  Native/Policy.swift Native/Store.swift Native/Sync.swift Native/Services.swift Native/Bridge.swift Native/main.swift \
  -framework AppKit -framework WebKit -framework Speech -framework AVFoundation -framework Security -lsqlite3 \
  -o "$app/Contents/MacOS/MOOHSIA"
cp Resources/Info.plist "$app/Contents/Info.plist"
cp Resources/index.html Resources/style.css Resources/core.js Resources/app.js Resources/schema.sql "$app/Contents/Resources/"
printf '3/4 驗證並 ad-hoc 簽署…\n'
plutil -lint "$app/Contents/Info.plist"
codesign --force --sign - "$app"
codesign --verify --deep --strict "$app"
release_dir="$PWD/build/release-$(date +%Y%m%d-%H%M%S)"
mv "$stage" "$release_dir"
printf '4/4 建置成功：%s\n' "$release_dir/MOOHSIA.app"
