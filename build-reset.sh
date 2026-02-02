#!/bin/bash
# ==========================================
# TRUE Nuclear iOS Reset for Capacitor 8 + iOS 16
# Cleans iOS, CocoaPods, DerivedData, SPM caches
# Re-adds iOS platform, reinstalls pods, syncs Capacitor
# ==========================================

echo "🚀 Starting TRUE Nuclear iOS Reset for Capacitor 8..."

PROJECT_ROOT=$(pwd)
echo "Project root: $PROJECT_ROOT"

# 0️⃣ Ensure node & npx are in PATH
# Replace this with the actual path if which npx gives different
export PATH=$PATH:/usr/local/bin

# Check npx exists
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found in PATH. Install Node.js and npm before running this script."
    exit 1
fi

# 1️⃣ Make sure Xcode is closed
echo "⚠️ Make sure Xcode is CLOSED before running this!"

# 2️⃣ Remove old iOS platform folder
if [ -d "$PROJECT_ROOT/ios" ]; then
  echo "🧹 Removing old ios folder..."
  rm -rf "$PROJECT_ROOT/ios"
fi

# 3️⃣ Clean DerivedData, CocoaPods caches, SwiftPM caches
echo "🧹 Cleaning DerivedData and caches..."
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf ~/Library/Developer/Xcode/SourcePackages
rm -rf ~/Library/Caches/CocoaPods

# 4️⃣ Re-add iOS platform
echo "📱 Adding iOS platform..."
npx cap add ios

# 5️⃣ Detect the Xcode project location
XCODE_PROJECT_PATH=""
if [ -f "$PROJECT_ROOT/ios/App/App.xcodeproj/project.pbxproj" ]; then
    XCODE_PROJECT_PATH="$PROJECT_ROOT/ios/App/App.xcodeproj"
elif [ -f "$PROJECT_ROOT/ios/App.xcodeproj/project.pbxproj" ]; then
    XCODE_PROJECT_PATH="$PROJECT_ROOT/ios/App.xcodeproj"
else
    echo "❌ Could not find Xcode project file. Exiting."
    exit 1
fi
echo "✅ Found Xcode project: $XCODE_PROJECT_PATH"

# 6️⃣ Create Podfile safely
PODFILE="$PROJECT_ROOT/ios/App/Podfile"
echo "📄 Creating Podfile at $PODFILE"
mkdir -p "$PROJECT_ROOT/ios/App"
cat > "$PODFILE" <<EOF
project '${XCODE_PROJECT_PATH##*/}'
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

# 7️⃣ Navigate to iOS folder
cd "$PROJECT_ROOT/ios/App" || exit

# 8️⃣ Explicitly deintegrate pods if anything exists
if [ -f "$XCODE_PROJECT_PATH/project.pbxproj" ]; then
    echo "💊 Deintegrating old pods..."
    pod deintegrate --project="$XCODE_PROJECT_PATH"
fi

# 9️⃣ Remove old pods and lockfile
rm -rf Pods
rm -f Podfile.lock

# 🔟 Install pods cleanly
echo "💊 Installing pods..."
pod install --repo-update

# 1️⃣1️⃣ Copy web assets and sync Capacitor
echo "📂 Copying web assets..."
cd "$PROJECT_ROOT" || exit
npx cap copy ios
npx cap sync ios

# 1️⃣2️⃣ Open the Xcode workspace
WORKSPACE_PATH=""
if [ -f "$PROJECT_ROOT/ios/App/App.xcworkspace" ]; then
    WORKSPACE_PATH="$PROJECT_ROOT/ios/App/App.xcworkspace"
elif [ -f "$PROJECT_ROOT/ios/App.xcworkspace" ]; then
    WORKSPACE_PATH="$PROJECT_ROOT/ios/App.xcworkspace"
fi

if [ -z "$WORKSPACE_PATH" ]; then
    echo "❌ Could not find Xcode workspace. Check if pods installed correctly."
    exit 1
fi

echo "📂 Opening Xcode workspace..."
open "$WORKSPACE_PATH"

echo "✅ Nuclear iOS reset complete!"
echo "Open Xcode, clean build folder (Shift + Cmd + K), verify Deployment Target >= 16.0, and run your app."