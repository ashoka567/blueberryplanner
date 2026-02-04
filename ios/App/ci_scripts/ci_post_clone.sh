#!/bin/sh
set -e
echo "Installing Node.js dependencies..."
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm install
echo "Building web app..."
npm run build
echo "Syncing Capacitor..."
npx cap sync ios
echo "Installing CocoaPods dependencies..."
cd "$CI_PRIMARY_REPOSITORY_PATH/ios/App"
pod install