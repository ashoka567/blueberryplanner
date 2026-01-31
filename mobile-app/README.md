# WPCLife Mobile App

A React Native/Expo mobile app for iOS and Android that connects to your WPCLife web backend.

## Features

- **Dashboard** - Overview of medications, chores, and reminders
- **Calendar** - Weekly/daily view of all events
- **Medications** - Track and log medication doses
- **Chores** - Manage tasks with points and leaderboard
- **Groceries** - Shared shopping list

## Getting Started

### Prerequisites

1. Install Node.js (v18 or later)
2. Install Expo Go on your phone:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Installation

```bash
cd mobile-app
npm install
```

### Running the App

```bash
npm start
```

Then scan the QR code with:
- **iOS**: Camera app
- **Android**: Expo Go app

## Configuration

Update the API URL in `src/lib/api.ts` to point to your backend:

```typescript
const API_BASE = 'https://your-app-url.replit.dev';
```

## Publishing to App Store

### 1. Install EAS CLI
```bash
npm install -g eas-cli
eas login
```

### 2. Configure your app
Update `app.json` with your:
- Bundle identifier (iOS)
- Package name (Android)

### 3. Build for iOS
```bash
eas build --platform ios
```

### 4. Submit to App Store
```bash
eas submit --platform ios
```

## Requirements for App Store

1. **Apple Developer Account** ($99/year)
2. App icons (1024x1024)
3. App Store screenshots
4. Privacy Policy URL
5. App description

## Project Structure

```
mobile-app/
├── App.tsx                 # Main app entry
├── app.json               # Expo configuration
├── src/
│   ├── contexts/          # Auth context
│   ├── hooks/             # Data hooks
│   ├── lib/               # API client
│   ├── navigation/        # Navigation setup
│   └── screens/           # All screens
└── assets/                # App icons and images
```

## Screens

| Screen | Description |
|--------|-------------|
| Login | Email/password login for adults |
| Kid Login | PIN-based login for children |
| Register | Create new family account |
| Dashboard | Home screen with overview |
| Calendar | Week/day event view |
| Medications | Track medication doses |
| Chores | Task management with points |
| Groceries | Shopping list |

## Connecting to Backend

The mobile app connects to the same backend as the web app. Both share:
- User accounts
- Family data
- Medications, chores, groceries, etc.

Make sure your backend is running and accessible before using the mobile app.
