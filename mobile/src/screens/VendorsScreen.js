import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const VendorsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vendors Near You</Text>
      <Text style={styles.text}>Here we will show:</Text>
      <Text style={styles.text}>- Search bar</Text>
      <Text style={styles.text}>- List of nearby stalls</Text>
      <Text style={styles.text}>- Pay / Visit buttons</Text>
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

export default VendorsScreen;
