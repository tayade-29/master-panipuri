// VendorServeScreen.js
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
  StatusBar,
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
      setStall(res.stall || null);
      setPricePerPlate(res.stall?.pricePerPlate ? String(res.stall.pricePerPlate) : '');
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
    if (!customerPhone.trim()) return Alert.alert('Error', 'Customer phone required');
    if (!plateCount || plateCount <= 0) return Alert.alert('Error', 'Enter valid plates');

    try {
      setServing(true);
      await apiRequest('/api/payments/serve', 'POST', {
        customerPhone: customerPhone.trim(),
        plateCount: Number(plateCount),
        pricePerPlate: Number(pricePerPlate) || stall?.pricePerPlate || 0,
        method: 'CASH',
      }, token);

      Alert.alert('Success', 'Payment recorded!');
      setCustomerPhone('');
      setPlateCount('1');
      loadMyCustomers();
    } catch (err) {
      Alert.alert('Failed', err.message || 'Could not record');
    } finally {
      setServing(false);
    }
  };

  if (stallLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Loading stall...</Text>
      </View>
    );
  }

  if (!stall) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No stall found</Text>
        <Text style={styles.errorSub}>Set up your stall in Profile first</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFCF7" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.appName}>Panipuri</Text>
          <Text style={styles.title}>Serve Customer</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Regulars ({customers.length})</Text>
            {loadingCustomers ? (
              <ActivityIndicator color="#FF6B00" />
            ) : customers.length === 0 ? (
              <Text style={styles.emptyText}>No regular customers yet</Text>
            ) : (
              customers.map((c) => (
                <TouchableOpacity
                  key={c.customerId}
                  style={styles.customerCard}
                  onPress={() => setCustomerPhone(c.phone)}
                >
                  <View>
                    <Text style={styles.customerName}>{c.fullName}</Text>
                    <Text style={styles.customerPhone}>{c.phone}</Text>
                  </View>
                  <Text style={styles.loyaltyText}>
                    {c.currentPlateCount}/5 plates
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={styles.formCard}>

            <Text style={styles.label}>Customer Phone</Text>
<TextInput 
  style={styles.input} 
  value={customerPhone} 
  onChangeText={setCustomerPhone} 
  placeholder="9876543210" 
  keyboardType="phone-pad" 
/>

<Text style={styles.label}>Number of Plates</Text>
<TextInput 
  style={styles.input} 
  value={plateCount} 
  onChangeText={setPlateCount} 
  placeholder="1" 
  keyboardType="numeric" 
/>

<Text style={styles.label}>Price per Plate (₹)</Text>
<TextInput 
  style={styles.input} 
  value={pricePerPlate} 
  onChangeText={setPricePerPlate} 
  placeholder={stall?.pricePerPlate ? String(stall.pricePerPlate) : '30'} 
  keyboardType="numeric" 
/>
            
            <TouchableOpacity style={styles.serveBtn} onPress={handleServe} disabled={serving}>
              <Text style={styles.serveBtnText}>
                {serving ? 'Recording...' : 'Record Sale & Update Loyalty'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFCF7', paddingTop: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFCF7' },
  appName: { fontSize: 32, fontWeight: '900', color: '#FF6B00', textAlign: 'center', marginBottom: 10 },
  title: { fontSize: 26, fontWeight: '800', color: '#222', textAlign: 'center', marginBottom: 20 },
  section: { marginHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#FF6B00', marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', paddingVertical: 20 },
  customerCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FFE0B3',
  },
  customerName: { fontSize: 16, fontWeight: '600', color: '#222' },
  customerPhone: { fontSize: 13, color: '#666', marginTop: 2 },
  loyaltyText: { fontSize: 13, color: '#FF6B00', fontWeight: '600' },
  formCard: { marginHorizontal: 20, backgroundColor: '#FFF', borderRadius: 16, padding: 20, elevation: 4 },
  label: { fontSize: 14, color: '#666', marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  serveBtn: {
    backgroundColor: '#FF6B00',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  serveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

export default VendorServeScreen;