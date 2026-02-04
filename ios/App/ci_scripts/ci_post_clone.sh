#!/bin/sh
set -e

echo "=== Xcode Cloud CI Post Clone Script ==="

echo "Installing CocoaPods dependencies..."
cd "$CI_PRIMARY_REPOSITORY_PATH/ios/App"
pod install --repo-update

echo "=== CI Post Clone Complete ==="
