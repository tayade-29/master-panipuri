// src/screens/VendorDashboardScreen.js
import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';

const VendorDashboardScreen = () => {
  const { user } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello, {user?.fullName}</Text>
      <Text style={styles.subtitle}>Vendor Dashboard</Text>
      <Text style={styles.status}>Status: {user?.vendorStatus || 'N/A'}</Text>

      <Text style={styles.text}>Here we will show:</Text>
      <Text style={styles.text}>- Today’s plates sold</Text>
      <Text style={styles.text}>- Total amount collected</Text>
      <Text style={styles.text}>- Free plates given (loyalty)</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7e6',
    padding: 16,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    color: '#ff8a00',
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
  },
  text: {
    fontSize: 14,
    marginBottom: 4,
    color: '#444',
  },
});

export default VendorDashboardScreen;
