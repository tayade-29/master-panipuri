import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';

const PaymentScreen = ({ route, navigation }) => {
  const { user, token } = useContext(AuthContext);
  const { stall } = route.params; // passed from VendorsScreen

  const [plateCount, setPlateCount] = useState('1');
  const [pricePerPlate, setPricePerPlate] = useState(
    stall?.pricePerPlate ? String(stall.pricePerPlate) : '0'
  );
  const [method, setMethod] = useState('UPI');
  const [loading, setLoading] = useState(false);

  const totalAmount =
    (Number(plateCount) || 0) * (Number(pricePerPlate) || 0);

  const handlePay = async () => {
    const plates = Number(plateCount);
    const price = Number(pricePerPlate);

    if (!plates || plates <= 0) {
      Alert.alert('Validation', 'Please enter valid number of plates');
      return;
    }
    if (!price || price <= 0) {
      Alert.alert('Validation', 'Please enter valid price per plate');
      return;
    }

    try {
      setLoading(true);

      const body = {
        stallId: stall._id,
        vendorId: stall.vendor._id,
        plateCount: plates,
        pricePerPlate: price,
        method,
      };

      const res = await apiRequest('/api/payments', 'POST', body, token);

      const free = res.loyalty.freePlatesEarnedThisPayment;
      const remaining = res.loyalty.platesNeededForNextFree;

      let msg = `Payment recorded: ₹${res.payment.amount}`;
      if (free > 0) {
        msg += `\n🎉 You earned ${free} free plate(s)!`;
      }
      msg += `\nYou now need ${remaining} plate(s) for the next free plate.`;

      Alert.alert('Success', msg, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pay at Stall</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Stall</Text>
        <Text style={styles.value}>{stall.name}</Text>

        <Text style={styles.label}>Vendor</Text>
        <Text style={styles.value}>{stall.vendor?.fullName}</Text>

        <Text style={styles.label}>Customer</Text>
        <Text style={styles.value}>{user?.fullName}</Text>

        <Text style={styles.label}>Plates</Text>
        <TextInput
          style={styles.input}
          value={plateCount}
          onChangeText={setPlateCount}
          keyboardType="numeric"
          placeholder="Number of plates"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Price Per Plate (₹)</Text>
        <TextInput
          style={styles.input}
          value={pricePerPlate}
          onChangeText={setPricePerPlate}
          keyboardType="numeric"
          placeholder="Price per plate"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.methodRow}>
          {['UPI', 'QR', 'CARD', 'CASH'].map((m) => (
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
          Total: <Text style={styles.totalAmount}>₹{totalAmount || 0}</Text>
        </Text>

        <TouchableOpacity
          style={styles.payButton}
          onPress={handlePay}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Confirm Payment</Text>
          )}
        </TouchableOpacity>
      </View>
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
    marginBottom: 16,
    color: '#ff8a00',
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
  payButton: {
    marginTop: 16,
    backgroundColor: '#ff8a00',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default PaymentScreen;
