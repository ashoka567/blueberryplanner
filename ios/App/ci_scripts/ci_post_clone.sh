#!/bin/sh
set -e

echo "=== Xcode Cloud CI Post Clone Script ==="

echo "Installing Node.js..."
brew install node

echo "Running npm install in repository root..."
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm install

echo "Installing CocoaPods dependencies..."
cd "$CI_PRIMARY_REPOSITORY_PATH/ios/App"
pod install --repo-update

echo "=== CI Post Clone Complete ==="
