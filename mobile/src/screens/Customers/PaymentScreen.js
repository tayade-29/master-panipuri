// src/screens/Customers/PaymentScreen.js
import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';

const PaymentScreen = ({ route, navigation }) => {
  const { user, token } = useContext(AuthContext);
  const { stall } = route.params;

  const [plateCount, setPlateCount] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState('ONLINE'); // Default UPI
  const [loading, setLoading] = useState(false);

  // Price comes from stall (vendor sets it once)
  const pricePerPlate = stall?.pricePerPlate || 0;
  const totalAmount = (Number(plateCount) || 0) * pricePerPlate;

  const openUpiApp = async () => {
    if (!stall.upiId || stall.upiId.trim() === '') {
      Alert.alert('UPI Not Available', 'This vendor has not added UPI ID yet.');
      return false;
    }
    if (totalAmount <= 0) {
      Alert.alert('Invalid Amount', 'Total must be greater than ₹0');
      return false;
    }

    const upiUrl = `upi://pay?pa=${encodeURIComponent(stall.upiId)}&pn=${encodeURIComponent(stall.name)}&am=${totalAmount}&cu=INR&tn=Panipuri`;

    try {
      await Linking.openURL(upiUrl);
      return true;
    } catch (err) {
      Alert.alert('No UPI App', 'Please install Google Pay, PhonePe, or BHIM');
      return false;
    }
  };

  const handlePay = async () => {
    const plates = Number(plateCount);
    if (!plates || plates < 1) {
      Alert.alert('Error', 'Please enter valid number of plates');
      return;
    }

    let proceed = true;
    if (paymentMethod === 'ONLINE') {
      proceed = await openUpiApp();
    }
    if (!proceed) return;

    try {
      setLoading(true);

      const body = {
  stallId: stall._id,
  vendorId: stall.vendor._id,
  plateCount: parseInt(plateCount) || 1,        // ← YE ADD KARO     // ← YE BHI
  method: paymentMethod,
};

      const res = await apiRequest('/api/payments', 'POST', body, token);

      const free = res.loyalty?.freePlatesEarnedThisPayment || 0;
      let msg = 'Payment request sent! Waiting for vendor to confirm.';
      if (free > 0) {
        msg += `\nYou earned ${free} free plate(s) once confirmed!`;
      }

      Alert.alert('Success', msg, [
        { text: 'OK', onPress: () => navigation.goBack() }
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
          placeholder="Enter number of plates"
        />

        <Text style={styles.label}>Price Per Plate</Text>
        <Text style={styles.inputStatic}>₹{pricePerPlate}</Text>

        <Text style={styles.totalText}>
          Total: <Text style={styles.totalAmount}>₹{totalAmount}</Text>
        </Text>

        {/* Payment Method Selector */}
        <View style={styles.methodRow}>
          <TouchableOpacity
            style={[styles.methodBtn, paymentMethod === 'ONLINE' && styles.active]}
            onPress={() => setPaymentMethod('ONLINE')}
          >
            <Text style={[styles.methodText, paymentMethod === 'ONLINE' && styles.activeText]}>UPI</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodBtn, paymentMethod === 'CASH' && styles.active]}
            onPress={() => setPaymentMethod('CASH')}
          >
            <Text style={[styles.methodText, paymentMethod === 'CASH' && styles.activeText]}>Cash</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.payButton,
            loading && { opacity: 0.7 },
            paymentMethod === 'ONLINE' && !stall.upiId && { backgroundColor: '#ccc' }
          ]}
          onPress={handlePay}
          disabled={loading || (paymentMethod === 'ONLINE' && !stall.upiId)}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>
              {paymentMethod === 'ONLINE'
                ? stall.upiId ? 'Pay with UPI' : 'UPI Not Set'
                : 'Pay with Cash (Vendor Confirms)'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff7e6', padding: 16, paddingTop: 40 },
  title: { fontSize: 22, fontWeight: '800', color: '#ff8a00', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#ffd9a3' },
  label: { fontSize: 12, color: '#888', marginTop: 12 },
  value: { fontSize: 14, color: '#333' },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#ffd9a3', marginTop: 6 },
  inputStatic: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 10, marginTop: 6, color: '#333' },
  totalText: { fontSize: 16, fontWeight: '600', marginTop: 16, color: '#444' },
  totalAmount: { color: '#ff8a00', fontWeight: '800' },
  methodRow: { flexDirection: 'row', justifyContent: 'center', marginVertical: 20, gap: 20 },
  methodBtn: { paddingVertical: 10, paddingHorizontal: 30, borderRadius: 30, borderWidth: 2, borderColor: '#ff8a00' },
  active: { backgroundColor: '#ff8a00' },
  methodText: { color: '#ff8a00', fontWeight: '600' },
  activeText: { color: '#fff' },
  payButton: { marginTop: 10, backgroundColor: '#ff8a00', padding: 14, borderRadius: 12, alignItems: 'center' },
  payButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default PaymentScreen;