import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const OffersScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Offers</Text>
      <Text style={styles.text}>Here we will show:</Text>
      <Text style={styles.text}>- List of active offers</Text>
      <Text style={styles.text}>- Coupon codes & conditions</Text>
      <Text style={styles.text}>- “Use Now” flow</Text>
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

export default OffersScreen;
