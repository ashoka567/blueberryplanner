import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../screens/DashboardScreen';
import CalendarScreen from '../screens/CalendarScreen';
import MedicationsScreen from '../screens/MedicationsScreen';
import ChoresScreen from '../screens/ChoresScreen';
import GroceriesScreen from '../screens/GroceriesScreen';

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Calendar':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Medications':
              iconName = focused ? 'medkit' : 'medkit-outline';
              break;
            case 'Chores':
              iconName = focused ? 'checkbox' : 'checkbox-outline';
              break;
            case 'Groceries':
              iconName = focused ? 'cart' : 'cart-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: 'gray',
        headerStyle: { backgroundColor: '#6366f1' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Medications" component={MedicationsScreen} />
      <Tab.Screen name="Chores" component={ChoresScreen} />
      <Tab.Screen name="Groceries" component={GroceriesScreen} />
    </Tab.Navigator>
  );
}
