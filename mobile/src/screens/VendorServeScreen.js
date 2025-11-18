// src/screens/VendorServeScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const VendorServeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Serve Customers</Text>
      <Text style={styles.text}>Here we will add:</Text>
      <Text style={styles.text}>- Select customer (phone / QR)</Text>
      <Text style={styles.text}>- Enter number of plates</Text>
      <Text style={styles.text}>- Choose payment method</Text>
      <Text style={styles.text}>- Update loyalty & payments</Text>
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
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
    color: '#ff8a00',
  },
  text: {
    fontSize: 14,
    marginBottom: 4,
    color: '#444',
  },
});

export default VendorServeScreen;
