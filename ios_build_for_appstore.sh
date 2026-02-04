cd /Users/aganagav/Projects/blueberryplanner
rm -rf ios/App/ci_scripts
npm install
npm run build
npx cap sync ios
cd ios/App
pod install
git add -f Pods/
git add -f App.xcworkspace/
git add Podfile.lock
git add App.xcodeproj/
cd ../..
git add -A
git commit -m "Add complete iOS build with Pods"
