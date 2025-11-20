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
  const [stallError, setStallError] = useState('');

  const [customerPhone, setCustomerPhone] = useState('');
  const [plateCount, setPlateCount] = useState('1');
  const [pricePerPlate, setPricePerPlate] = useState('');
  const [method, setMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);

  const loadMyStall = async () => {
    try {
      setStallLoading(true);
      setStallError('');
      const res = await apiRequest('/api/stalls/mine', 'GET', null, token);
      if (!res.stall) {
        setStall(null);
        setStallError(
          'No stall found. Please set up your stall in the Profile tab first.'
        );
        return;
      }
      setStall(res.stall);
      setPricePerPlate(
        res.stall.pricePerPlate ? String(res.stall.pricePerPlate) : ''
      );
    } catch (err) {
      setStallError(err.message || 'Failed to load stall');
      setStall(null);
    } finally {
      setStallLoading(false);
    }
  };

  useEffect(() => {
    loadMyStall();
  }, []);

  const handleServe = async () => {
    if (!stall || !stall._id) {
      Alert.alert(
        'No Stall',
        'You must configure your stall in Vendor Profile before serving customers.'
      );
      return;
    }

    if (!customerPhone.trim()) {
      Alert.alert('Validation', 'Customer phone is required.');
      return;
    }

    const plates = Number(plateCount);
    const price = Number(pricePerPlate);

    if (!plates || plates <= 0) {
      Alert.alert('Validation', 'Please enter a valid number of plates.');
      return;
    }
    if (!price || price <= 0) {
      Alert.alert('Validation', 'Please enter a valid price per plate.');
      return;
    }

    try {
      setLoading(true);

      const body = {
        customerPhone: customerPhone.trim(),
        stallId: stall._id,
        plateCount: plates,
        pricePerPlate: price,
        method,
      };

      const res = await apiRequest(
        '/api/payments/vendor/serve',
        'POST',
        body,
        token
      );

      const free = res.loyalty.freePlatesEarnedThisPayment;
      const remaining = res.loyalty.platesNeededForNextFree;
      const customerName = res.customer?.fullName || res.customer?.phone;

      let msg = `Payment recorded for ${customerName}\nAmount: ₹${res.payment.amount}`;
      if (free > 0) {
        msg += `\n🎉 Customer earned ${free} free plate(s)!`;
      }
      msg += `\nThey now need ${remaining} plate(s) for the next free plate.`;

      Alert.alert('Success', msg);

      // reset only plates
      setPlateCount('1');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  if (stallLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading your stall...</Text>
      </View>
    );
  }

  if (stallError) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{stallError}</Text>
        <Text style={{ marginTop: 4, textAlign: 'center' }}>
          Go to Vendor Profile tab, set up stall name, price, and location.
        </Text>
      </View>
    );
  }

  const totalAmount =
    (Number(plateCount) || 0) * (Number(pricePerPlate) || 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <Text style={styles.title}>Serve Customers</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Stall</Text>
        <Text style={styles.value}>{stall?.name}</Text>

        <Text style={styles.label}>Customer Phone *</Text>
        <TextInput
          style={styles.input}
          value={customerPhone}
          onChangeText={setCustomerPhone}
          keyboardType="phone-pad"
          placeholder="e.g. 9876543210"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Number of Plates *</Text>
        <TextInput
          style={styles.input}
          value={plateCount}
          onChangeText={setPlateCount}
          keyboardType="numeric"
          placeholder="e.g. 2"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Price Per Plate (₹) *</Text>
        <TextInput
          style={styles.input}
          value={pricePerPlate}
          onChangeText={setPricePerPlate}
          keyboardType="numeric"
          placeholder="e.g. 30"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.methodRow}>
          {['CASH', 'UPI', 'QR', 'CARD'].map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.methodButton,
                method === m && styles.methodButtonActive,
              ]}
              onPress={() => setMethod(m)}
            >
              <Text
                style={[
                  styles.methodText,
                  method === m && styles.methodTextActive,
                ]}
              >
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.totalText}>
          Total:{' '}
          <Text style={styles.totalAmount}>₹{totalAmount || 0}</Text>
        </Text>

        <TouchableOpacity
          style={styles.serveButton}
          onPress={handleServe}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.serveButtonText}>Record Payment & Loyalty</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.infoText}>
        Note: This flow works when the customer has an account in the app and you
        know their phone number. We can later add support for anonymous walk-in
        customers without loyalty.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7e6',
    padding: 16,
    paddingTop: 40,
  },
  center: {
    flex: 1,
    backgroundColor: '#fff7e6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ff8a00',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffd9a3',
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  value: {
    fontSize: 14,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ffd9a3',
    marginTop: 4,
  },
  methodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  methodButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ffd9a3',
    marginRight: 8,
    marginTop: 6,
  },
  methodButtonActive: {
    borderColor: '#ff8a00',
    backgroundColor: '#ffecd1',
  },
  methodText: {
    fontSize: 12,
    color: '#555',
  },
  methodTextActive: {
    color: '#ff8a00',
    fontWeight: '600',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    color: '#444',
  },
  totalAmount: {
    color: '#ff8a00',
  },
  serveButton: {
    marginTop: 16,
    backgroundColor: '#ff8a00',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  serveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#777',
    marginTop: 12,
  },
});

export default VendorServeScreen;
