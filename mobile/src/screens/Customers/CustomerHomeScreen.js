import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthContext } from '../../context/AuthContext';

const CustomerHomeScreen = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {user?.fullName}</Text>
      <Text style={styles.subtitle}>Role: Customer</Text>

      <Text style={styles.info}>Here we will show:</Text>
      <Text style={styles.info}>- Today’s Special</Text>
      <Text style={styles.info}>- Quick Stats</Text>
      <Text style={styles.info}>- Nearby Panipuri Stalls</Text>

      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7e6',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
    color: '#ff8a00',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
    color: '#444',
  },
  info: {
    fontSize: 14,
    marginBottom: 4,
    color: '#555',
  },
  button: {
    marginTop: 24,
    backgroundColor: '#ff8a00',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default CustomerHomeScreen;
