import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wpclife.blueberry',
  appName: 'Blueberry Planner',
  webDir: 'dist/public',
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    backgroundColor: '#FFF7ED',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_notification',
      iconColor: '#D2691E',
      sound: 'default',
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#D2691E',
      showSpinner: false,
    },
  },
};

export default config;
