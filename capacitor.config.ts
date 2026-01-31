import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wpclife.blueberry',
  appName: 'Blueberry Planner',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#D2691E'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#D2691E',
      showSpinner: false
    },
    StatusBar: {
      backgroundColor: '#D2691E',
      style: 'LIGHT'
    }
  }
};

export default config;
