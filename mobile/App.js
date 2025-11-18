import React, { useContext } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, Text } from 'react-native';

import { AuthProvider, AuthContext } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import CustomerHomeScreen from './src/screens/CustomerHomeScreen';
import VendorsScreen from './src/screens/VendorsScreen';
import OffersScreen from './src/screens/OffersScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import VendorDashboardScreen from './src/screens/VendorDashboardScreen';
import VendorServeScreen from './src/screens/VendorServeScreen';
import VendorSettlementsScreen from './src/screens/VendorSettlementsScreen';
import VendorProfileScreen from './src/screens/VendorProfileScreen';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Customer bottom tabs
const CustomerTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: '#ff8a00' },
        headerTitleStyle: { color: '#fff', fontWeight: '700' },
        tabBarActiveTintColor: '#ff8a00',
        tabBarInactiveTintColor: '#777',
        tabBarStyle: { backgroundColor: '#fff' },

        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Vendors') {
            iconName = focused ? 'storefront' : 'storefront-outline';
          } else if (route.name === 'Offers') {
            iconName = focused ? 'gift' : 'gift-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },

      })}
    >
      <Tab.Screen
        name="Home"
        component={CustomerHomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="Vendors"
        component={VendorsScreen}
        options={{ title: 'Vendors' }}
      />
      <Tab.Screen
        name="Offers"
        component={OffersScreen}
        options={{ title: 'Offers' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

const VendorTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: '#ff8a00' },
        headerTitleStyle: { color: '#fff', fontWeight: '700' },
        tabBarActiveTintColor: '#ff8a00',
        tabBarInactiveTintColor: '#777',
        tabBarStyle: { backgroundColor: '#fff' },

        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'VendorDashboard') {
            iconName = focused ? 'speedometer' : 'speedometer-outline';
          } else if (route.name === 'VendorServe') {
            iconName = focused ? 'fast-food' : 'fast-food-outline';
          } else if (route.name === 'VendorSettlements') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'VendorProfile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="VendorDashboard"
        component={VendorDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="VendorServe"
        component={VendorServeScreen}
        options={{ title: 'Serve' }}
      />
      <Tab.Screen
        name="VendorSettlements"
        component={VendorSettlementsScreen}
        options={{ title: 'Settlements' }}
      />
      <Tab.Screen
        name="VendorProfile"
        component={VendorProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};



const RootNavigator = () => {
  const { authLoading, user } = useContext(AuthContext);

  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading...</Text>
      </View>
    );
  }

  // Not logged in -> Auth stack
  if (!user) {
    return (
      <Stack.Navigator>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerTitle: 'Register' }}
        />
      </Stack.Navigator>
    );
  }

  // Vendor -> Vendor Dashboard (we'll add vendor tabs later)
  if (user.role === 'vendor') {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VendorTabs" component={VendorTabs} />
    </Stack.Navigator>
  );
}


  // Default -> Customer tabs
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
