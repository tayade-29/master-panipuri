// src/screens/VendorServeScreen.js
import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';

const VendorServeScreen = () => {
  const { token } = useContext(AuthContext);

  const [stallLoading, setStallLoading] = useState(true);
  const [stall, setStall] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const [customerPhone, setCustomerPhone] = useState('');
  const [plateCount, setPlateCount] = useState('1');
  const [pricePerPlate, setPricePerPlate] = useState('');
  const [method, setMethod] = useState('CASH');
  const [serving, setServing] = useState(false);

  const loadMyStall = async () => {
    try {
      const res = await apiRequest('/api/stalls/mine', 'GET', null, token);
      if (!res.stall) {
        setStall(null);
        return;
      }
      setStall(res.stall);
      setPricePerPlate(res.stall.pricePerPlate ? String(res.stall.pricePerPlate) : '');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load stall');
    } finally {
      setStallLoading(false);
    }
  };

  const loadMyCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const res = await apiRequest('/api/loyalty/vendor/customers', 'GET', null, token);
      setCustomers(res.customers || []);
    } catch (err) {
      console.log('Failed to load customers:', err.message);
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    loadMyStall();
    loadMyCustomers();
  }, []);

  const handleServe = async () => {
    // ... same as before
    // (your existing handleServe code – unchanged)
  };

  if (stallLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading stall...</Text>
      </View>
    );
  }

  if (!stall) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>No stall found. Set up in Profile first.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Serve Customers</Text>

      {/* Customer List */}
      <Text style={styles.sectionTitle}>My Regular Customers ({customers.length})</Text>
      {loadingCustomers ? (
        <ActivityIndicator />
      ) : customers.length === 0 ? (
        <Text style={styles.smallText}>No customers yet. They will appear after first visit!</Text>
      ) : (
        customers.map((c) => (
          <View key={c.customerId} style={styles.customerItem}>
            <Text style={styles.customerName}>{c.fullName}</Text>
            <Text style={styles.customerPhone}>{c.phone}</Text>
            <Text style={styles.customerPlates}>
              {c.currentPlateCount}/5 plates (Need {c.platesNeeded} more)
            </Text>
          </View>
        ))
      )}

      {/* Serve Form */}
      <View style={styles.card}>
        <Text style={styles.label}>Customer Phone *</Text>
        <TextInput style={styles.input} value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" placeholder="9876543210" />

        <Text style={styles.label}>Plates</Text>
        <TextInput style={styles.input} value={plateCount} onChangeText={setPlateCount} keyboardType="numeric" />

        <Text style={styles.label}>Price Per Plate (₹)</Text>
        <TextInput style={styles.input} value={pricePerPlate} onChangeText={setPricePerPlate} keyboardType="numeric" />

        <TouchableOpacity style={styles.serveButton} onPress={handleServe} disabled={serving}>
          <Text style={styles.serveButtonText}>
            {serving ? 'Recording...' : 'Record Payment & Update Loyalty'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff7e6', padding: 16, paddingTop: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#ff8a00', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#ff8a00', marginVertical: 12 },
  smallText: { fontSize: 12, color: '#777', textAlign: 'center', marginVertical: 10 },
  customerItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ffd9a3',
  },
  customerName: { fontSize: 15, fontWeight: '600', color: '#333' },
  customerPhone: { fontSize: 13, color: '#555' },
  customerPlates: { fontSize: 12, color: '#ff8a00', marginTop: 4, fontWeight: '600' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#ffd9a3', marginTop: 20 },
  label: { fontSize: 12, color: '#888', marginTop: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ffd9a3', borderRadius: 10, padding: 10, marginTop: 4 },
  serveButton: { marginTop: 20, backgroundColor: '#ff8a00', padding: 14, borderRadius: 10, alignItems: 'center' },
  serveButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  error: { color: 'red', textAlign: 'center' },
});

export default VendorServeScreen;