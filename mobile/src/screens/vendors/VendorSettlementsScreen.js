// src/screens/VendorSettlementsScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const VendorSettlementsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settlements</Text>
      <Text style={styles.text}>Here we will show:</Text>
      <Text style={styles.text}>- Total collected (by method)</Text>
      <Text style={styles.text}>- Amount pending settlement</Text>
      <Text style={styles.text}>- Settlement history</Text>
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

export default VendorSettlementsScreen;
