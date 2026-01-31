# Building WPCLife iOS App

This guide explains how to build and publish the WPCLife iOS app to the App Store.

## Prerequisites

1. **Mac computer** (required for iOS development)
2. **Xcode 15+** installed from the Mac App Store
3. **Apple Developer Account** ($99/year) - [developer.apple.com](https://developer.apple.com)
4. **Node.js 20+** installed

## Step 1: Setup Project

```bash
cd wpclife-frontend

# Install dependencies
npm install

# Build the web app
npm run build:prod

# Add iOS platform
npm run cap:add:ios
```

## Step 2: Open in Xcode

```bash
npm run cap:open:ios
```

This opens the iOS project in Xcode.

## Step 3: Configure Signing

1. In Xcode, select the **WPCLife** project in the left sidebar
2. Go to **Signing & Capabilities** tab
3. Select your **Team** (your Apple Developer account)
4. Xcode will automatically create provisioning profiles

## Step 4: Configure Push Notifications

1. In Xcode, click **+ Capability**
2. Add **Push Notifications**
3. Add **Background Modes** and check:
   - Remote notifications
   - Background fetch

## Step 5: Create App Icons

Replace the default icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/` with your app icons.

Required sizes:
- 20x20, 29x29, 40x40, 60x60, 76x76, 83.5x83.5, 1024x1024

## Step 6: Test on Device

1. Connect your iPhone via USB
2. Select your device in Xcode's device selector
3. Click the **Play** button to build and run

## Step 7: Create App Store Listing

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - Platform: iOS
   - Name: WPCLife
   - Bundle ID: com.wpclife.app
   - SKU: WPCLIFE001
4. Save

## Step 8: Upload to App Store

1. In Xcode, select **Product** → **Archive**
2. Wait for build to complete
3. Click **Distribute App**
4. Select **App Store Connect**
5. Follow the upload wizard

## Step 9: Submit for Review

1. In App Store Connect, go to your app
2. Fill in all required information:
   - Screenshots (6.5" and 5.5" iPhones)
   - Description
   - Keywords
   - Privacy Policy URL
3. Click **Submit for Review**

Apple typically reviews apps within 24-48 hours.

---

## Push Notifications Setup (Apple Push Notification Service)

### Generate APNs Key

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Keys**
3. Click **+** to create a new key
4. Name it "WPCLife Push Key"
5. Enable **Apple Push Notifications service (APNs)**
6. Click **Continue** → **Register**
7. **Download the .p8 file** (you can only download once!)
8. Note the **Key ID** and your **Team ID**

### Configure Backend

You'll need to add the APNs key to your backend to send push notifications. Options:
- Firebase Cloud Messaging (free, recommended)
- Direct APNs integration
- Third-party service like OneSignal

---

## Updating the App

When you make changes to the web app:

```bash
# Build and sync
npm run build:ios

# Open Xcode
npm run cap:open:ios
```

Then archive and upload a new version.

---

## Common Issues

**"No signing certificate"**
→ Make sure you're signed into your Apple Developer account in Xcode → Settings → Accounts

**"Push notifications not working"**
→ Ensure the app was built with a distribution certificate, not development

**"App rejected"**
→ Common reasons: missing privacy policy, incorrect screenshots, login issues for reviewers
