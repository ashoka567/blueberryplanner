#!/bin/bash
set -e

echo "=== iOS App Store Build Script ==="
echo ""

cd /Users/aganagav/Projects/blueberryplanner

echo "1. Removing CI scripts (not needed)..."
rm -rf ios/App/ci_scripts

echo "2. Installing npm dependencies..."
npm install

echo "3. Building web app..."
npm run build

echo "4. Syncing Capacitor..."
npx cap sync ios

echo "5. Installing CocoaPods..."
cd ios/App
pod install

echo "6. Adding files to git..."
=======
cd /Users/aganagav/Projects/blueberryplanner
rm -rf ios/App/ci_scripts
npm run build
npx cap sync ios
cd ios/App
pod install
git add -f Pods/
git add -f App.xcworkspace/
git add Podfile.lock
git add App.xcodeproj/

echo "7. Committing and pushing..."
cd ../..
git add -A
git commit -m "Add complete iOS build with Pods - no CI needed"

echo ""
echo "=== Done! ==="
echo "Now go to Xcode Cloud and make sure your workflow uses App.xcworkspace"
=======
