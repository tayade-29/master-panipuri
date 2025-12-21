import React, { useContext } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, Text, StyleSheet, Image } from 'react-native';

import { AuthProvider, AuthContext } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import CustomerHomeScreen from './src/screens/Customers/CustomerHomeScreen';
import VendorsScreen from './src/screens/Customers/VendorsScreen';
import OffersScreen from './src/screens/Customers/OffersScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import VendorDashboardScreen from './src/screens/vendors/VendorDashboardScreen';
import VendorServeScreen from './src/screens/vendors/VendorServeScreen';
import VendorSettlementsScreen from './src/screens/vendors/VendorSettlementsScreen';
import VendorProfileScreen from './src/screens/vendors/VendorProfileScreen';
import PaymentScreen from './src/screens/Customers/PaymentScreen';
import CustomerReferralScreen from './src/screens/Customers/CustomerReferralScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const LogoHeader = ({ title }) => (
  <View style={headerStyles.container}>
    <Text style={headerStyles.title}>{title}</Text>
    <Image
      source={require('./assets/images/icon.png')}
      style={headerStyles.logo}
    />
  </View>
);


const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  logo: {
    width: 80,     // ⬅️ bigger logo
    height: 80,    // ⬅️ bigger logo
    resizeMode: 'contain',
  },
});


const CustomerTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: '#ff8a00' },
        headerTitleStyle: { color: '#fff', fontWeight: '700' },
        tabBarActiveTintColor: '#ff8a00',
        tabBarInactiveTintColor: '#777',
        tabBarStyle: { backgroundColor: '#fff' },
        headerTitle: () => <LogoHeader title={route.name} />,

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
      />
      <Tab.Screen
        name="Vendors"
        component={VendorsScreen}
      />
      <Tab.Screen
        name="Offers"
        component={OffersScreen}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
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
        headerTitle: () => <LogoHeader title={route.name === 'VendorDashboard' ? 'Dashboard' : route.name === 'VendorServe' ? 'Serve' : route.name === 'VendorSettlements' ? 'Settlements' : 'Profile'} />,

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

  if (user.role === 'vendor') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="VendorTabs" component={VendorTabs} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CustomerTabs"
        component={CustomerTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{
          title: 'Payment',
          headerStyle: { backgroundColor: '#ff8a00' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <Stack.Screen
        name="Referral"
        component={CustomerReferralScreen}
        options={{
          title: 'Referral & Earn',
          headerStyle: { backgroundColor: '#ff8a00' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
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
