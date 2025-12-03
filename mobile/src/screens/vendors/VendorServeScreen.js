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
  KeyboardAvoidingView,
  Platform,
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

  const handleServe = async () => {
    if (!customerPhone.trim()) {
      Alert.alert('Error', 'Please enter customer phone number');
      return;
    }
    if (!plateCount || isNaN(plateCount) || plateCount <= 0) {
      Alert.alert('Error', 'Please enter valid number of plates');
      return;
    }
    if (!pricePerPlate || isNaN(pricePerPlate) || pricePerPlate <= 0) {
      Alert.alert('Error', 'Please enter valid price per plate');
      return;
    }

    setServing(true);
    try {
      await apiRequest('/api/loyalty/serve', 'POST', {
        customerPhone: customerPhone.trim(),
        plateCount: parseInt(plateCount),
        pricePerPlate: parseFloat(pricePerPlate),
      }, token);

      Alert.alert('Success', 'Payment recorded and loyalty updated!');
      setCustomerPhone('');
      setPlateCount('1');
      loadMyCustomers(); // Refresh customer list
    } catch (err) {
      Alert.alert('Failed', err.message || 'Could not record serving');
    } finally {
      setServing(false);
    }
  };

  useEffect(() => {
    loadMyStall();
    loadMyCustomers();
  }, []);

  if (stallLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff8a00" />
        <Text style={styles.loadingText}>Loading your stall...</Text>
      </View>
    );
  }

  if (!stall) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>No stall found. Please set up your stall in Profile first.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Serve Customers</Text>

        {/* Regular Customers List */}
        <Text style={styles.sectionTitle}>
          My Regular Customers ({customers.length})
        </Text>

        {loadingCustomers ? (
          <ActivityIndicator style={{ marginVertical: 20 }} color="#ff8a00" />
        ) : customers.length === 0 ? (
          <Text style={styles.smallText}>
            No regular customers yet. They'll appear after their first visit!
          </Text>
        ) : (
          <View style={styles.customerList}>
            {customers.map((c) => (
              <TouchableOpacity
                key={c.customerId}
                style={styles.customerItem}
                onPress={() => setCustomerPhone(c.phone)}
              >
                <Text style={styles.customerName}>{c.fullName}</Text>
                <Text style={styles.customerPhone}>{c.phone}</Text>
                <Text style={styles.customerPlates}>
                  {c.currentPlateCount}/5 plates • Need {c.platesNeeded} more for free
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Serve Form */}
        <View style={styles.formCard}>
          <Text style={styles.label}>Customer Phone *</Text>
          <TextInput
            style={styles.input}
            value={customerPhone}
            onChangeText={setCustomerPhone}
            keyboardType="phone-pad"
            placeholder="Enter 10-digit phone number"
            maxLength={10}
          />

          <Text style={styles.label}>Number of Plates</Text>
          <TextInput
            style={styles.input}
            value={plateCount}
            onChangeText={setPlateCount}
            keyboardType="numeric"
            placeholder="1"
          />

          <Text style={styles.label}>Price Per Plate (₹)</Text>
          <TextInput
            style={styles.input}
            value={pricePerPlate}
            onChangeText={setPricePerPlate}
            keyboardType="numeric"
            placeholder="e.g. 30"
          />

          <TouchableOpacity
            style={[styles.serveButton, serving && styles.serveButtonDisabled]}
            onPress={handleServe}
            disabled={serving}
          >
            <Text style={styles.serveButtonText}>
              {serving ? 'Recording...' : 'Record Payment & Update Loyalty'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Extra bottom space */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#fff7e6',
    padding: 16,
    paddingTop: 40,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff7e6',
    padding: 20,
  },
  loadingText: { marginTop: 10, color: '#ff8a00', fontSize: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#ff8a00', marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#ff8a00', marginTop: 10 },
  smallText: { fontSize: 13, color: '#777', textAlign: 'center', marginVertical: 15 },
  customerList: { marginBottom: 10 },
  customerItem: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#ffd9a3',
    elevation: 2,
  },
  customerName: { fontSize: 16, fontWeight: '600', color: '#333' },
  customerPhone: { fontSize: 14, color: '#555', marginTop: 2 },
  customerPlates: { fontSize: 13, color: '#ff8a00', marginTop: 6, fontWeight: '600' },
  formCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ffd9a3',
    marginTop: 20,
    elevation: 3,
  },
  label: { fontSize: 13, color: '#666', marginTop: 16, marginBottom: 4 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#ffd9a3',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  serveButton: {
    marginTop: 30,
    backgroundColor: '#ff8a00',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
  },
  serveButtonDisabled: { backgroundColor: '#ffab40', opacity: 0.8 },
  serveButtonText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  error: { color: '#d32f2f', textAlign: 'center', fontSize: 16 },
});

export default VendorServeScreen;