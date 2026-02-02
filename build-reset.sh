#!/bin/bash

echo "🚀 Starting TRUE Nuclear iOS Reset for Capacitor 8..."

PROJECT_ROOT=$(pwd)
echo "Project root: $PROJECT_ROOT"

# 1️⃣ Close Xcode manually
echo "⚠️ Make sure Xcode is CLOSED before running this!"

# 2️⃣ Remove old iOS folder completely
echo "🧹 Removing old ios folder..."
rm -rf ios

# 3️⃣ Remove DerivedData, CocoaPods caches, SPM caches
echo "🧹 Cleaning caches..."
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf ~/Library/Developer/Xcode/SourcePackages
rm -rf ~/Library/Caches/CocoaPods

# 4️⃣ Re-add iOS platform
echo "📱 Adding iOS platform..."
npx cap add ios

# 5️⃣ Create Podfile safely
PODFILE="$PROJECT_ROOT/ios/App/Podfile"
echo "📄 Creating Podfile at $PODFILE"
mkdir -p "$PROJECT_ROOT/ios/App"
cat > "$PODFILE" <<EOF
platform :ios, '16.0'
install! 'cocoapods', :disable_input_output_paths => true
target 'App' do
  use_frameworks!
  use_modular_headers!
  pod 'Capacitor', :path => '../../node_modules/@capacitor/ios'
  pod 'CapacitorCordova', :path => '../../node_modules/@capacitor/ios'
end
post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'YES'
    end
  end
end
EOF

# 6️⃣ Install pods cleanly
echo "💊 Installing pods..."
cd "$PROJECT_ROOT/ios/App" || exit
pod deintegrate
rm -rf Pods
rm -f Podfile.lock
pod install --repo-update

# 6.5️⃣ Force clean the Pods Xcode project
echo "🧹 Force cleaning Pods Xcode project..."
xcodebuild -project Pods/Pods.xcodeproj -target Pods-App -configuration Debug clean 2>/dev/null || true

# 7️⃣ Copy web assets and sync Capacitor
echo "📂 Copying web assets..."
cd "$PROJECT_ROOT"
npx cap copy ios
npx cap sync ios

# 8️⃣ Open Xcode workspace
echo "📂 Opening App.xcworkspace..."
open ios/App/App.xcworkspace

echo "✅ Nuclear iOS reset complete! Open Xcode, clean build folder, set Deployment Target >= 16.0, and run."