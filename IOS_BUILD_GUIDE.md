# Building Blueberry Planner iOS App

This guide explains how to build and publish the Blueberry Planner iOS app to the App Store using Capacitor.

## Prerequisites

1. **Mac computer** (required for iOS development)
2. **Xcode 15+** installed from the Mac App Store
3. **Apple Developer Account** ($99/year) - [developer.apple.com](https://developer.apple.com)
4. **Node.js 20+** installed
5. **CocoaPods** - Install via: `sudo gem install cocoapods`

## Step 1: Clone and Setup

Download or clone your Replit project to your Mac:

```bash
# Navigate to your project folder
cd your-project-folder

# Install dependencies
npm install
```

## Step 2: Build the Web App

```bash
# Build the React app for production
npm run build
```

This creates the `dist/public` folder that Capacitor will package.

## Step 3: Add iOS Platform

```bash
# Add iOS platform (first time only)
npx cap add ios
```

## Step 4: Sync Changes

Every time you update your web app, run:

```bash
# Sync web app to iOS
npx cap sync ios
```

## Step 5: Open in Xcode

```bash
npx cap open ios
```

This opens the iOS project in Xcode.

## Step 6: Configure App Signing

1. In Xcode, select the **App** project in the left sidebar
2. Select the **App** target
3. Go to **Signing & Capabilities** tab
4. Check **Automatically manage signing**
5. Select your **Team** (your Apple Developer account)
6. Xcode will create provisioning profiles automatically

## Step 7: Update Bundle Identifier

1. In the **General** tab, verify:
   - Display Name: `Blueberry Planner`
   - Bundle Identifier: `com.wpclife.blueberry`
   - Version: `1.0.0`
   - Build: `1`

## Step 8: Configure Push Notifications

1. Click **+ Capability** button
2. Add **Push Notifications**
3. Add **Background Modes** and check:
   - Remote notifications
   - Background fetch

## Step 9: Create App Icons

Replace icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

Required sizes:
- 20x20 (1x, 2x, 3x)
- 29x29 (1x, 2x, 3x)
- 40x40 (1x, 2x, 3x)
- 60x60 (2x, 3x)
- 76x76 (1x, 2x)
- 83.5x83.5 (2x)
- 1024x1024 (App Store)

Use tools like [App Icon Generator](https://appicon.co/) to generate all sizes from one image.

## Step 10: Test on Device

1. Connect your iPhone via USB
2. Trust the computer on your phone
3. Select your device in Xcode's device selector (top bar)
4. Click the **Play** button to build and run
5. On first run, go to iPhone Settings > General > Device Management to trust the developer certificate

## Step 11: Create App Store Listing

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - Platform: iOS
   - Name: Blueberry Planner
   - Primary Language: English (U.S.)
   - Bundle ID: com.wpclife.blueberry
   - SKU: BLUEBERRY001
   - User Access: Full Access
4. Click **Create**

## Step 12: Upload to App Store

1. In Xcode, select **Product** → **Archive**
2. Wait for the build to complete
3. The Organizer window opens automatically
4. Select your archive and click **Distribute App**
5. Choose **App Store Connect** → **Upload**
6. Follow the wizard (keep defaults)
7. Wait for upload to complete

## Step 13: Submit for Review

1. In App Store Connect, go to your app
2. Select the uploaded build under **Build** section
3. Fill in all required information:
   - **Screenshots**: Upload for 6.7" (iPhone 15 Pro Max) and 5.5" (iPhone 8 Plus)
   - **Description**: Describe your family organizer app
   - **Keywords**: family, planner, chores, medications, calendar, reminders
   - **Support URL**: Your website or Replit app URL
   - **Privacy Policy URL**: Required for apps with user accounts
   - **Age Rating**: Fill out questionnaire (likely 4+)
4. Click **Submit for Review**

Apple reviews typically take 24-48 hours.

---

## Updating the App

When you make changes to your web app:

```bash
# 1. Build the web app
npm run build

# 2. Sync to iOS
npx cap sync ios

# 3. Open Xcode
npx cap open ios

# 4. Update version/build number in Xcode
# 5. Archive and upload new version
```

---

## App Store Screenshots

Take screenshots using Xcode Simulator:
1. Run app in simulator
2. Use Cmd+S to save screenshot
3. Required device sizes:
   - 6.7" Display (iPhone 15 Pro Max)
   - 5.5" Display (iPhone 8 Plus)
   - Optional: 12.9" iPad Pro

---

## Burnt Orange Theme

The app uses burnt orange (#D2691E) as the primary color. This is already configured in:
- `capacitor.config.ts` - Splash screen and status bar
- All React components use this color

---

## Common Issues

**"No signing certificate"**
→ Sign into your Apple Developer account: Xcode → Settings → Accounts → Add Apple ID

**"Provisioning profile doesn't match"**
→ Delete old profiles: Xcode → Settings → Accounts → Select Team → Download Manual Profiles

**App crashes on launch**
→ Check the Console in Xcode for error logs. Common cause: missing environment variables

**Push notifications not working**
→ Ensure you're using a distribution (not development) certificate for TestFlight/App Store builds

**"This app cannot be installed because its integrity could not be verified"**
→ Re-download app from App Store Connect or re-sign with valid certificate

**App rejected by Apple**
→ Common reasons:
  - Missing privacy policy
  - Incomplete metadata
  - Demo account credentials not provided for login testing
  - Guideline 4.2: Minimum Functionality (app too simple)

---

## TestFlight Beta Testing

Before submitting to App Store, test with beta users:

1. In App Store Connect, go to **TestFlight** tab
2. Add internal testers (up to 100) - instant access
3. Add external testers (up to 10,000) - requires brief review
4. Testers install via TestFlight app on their iPhones

---

## API Server URL

For the iOS app to communicate with your backend:

1. The app will use the same API as your web app
2. Update the API base URL in your React code if needed
3. Ensure your Replit deployment is running for the iOS app to work

Your published Replit app URL will be: `https://your-app-name.replit.app`
