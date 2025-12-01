// src/screens/VendorProfileScreen.js
import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import { AuthContext } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';

const VendorProfileScreen = () => {
  const { user, logout, token } = useContext(AuthContext);

  const [upiId, setUpiId] = useState('');

  const [stallLoading, setStallLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stall, setStall] = useState(null);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [pricePerPlate, setPricePerPlate] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [currentLatLng, setCurrentLatLng] = useState(null);

  const loadMyStall = async () => {
    
    try {
      setError('');
      setStallLoading(true);
      const res = await apiRequest('/api/stalls/mine', 'GET', null, token);
      const s = res.stall;
      setStall(s);

     if (s) {
  setName(s.name || '');
  setDescription(s.description || '');
  setAddress(s.address || '');
  setPricePerPlate(s.pricePerPlate ? String(s.pricePerPlate) : '');
  setTagsText(s.tags && s.tags.length ? s.tags.join(', ') : '');
  setUpiId(s.upiId || ''); // Load UPI ID

  if (s.location && s.location.coordinates) {
    const [lng, lat] = s.location.coordinates;
    setCurrentLatLng({ lat, lng });
  }
}
    } catch (err) {
      setError(err.message || 'Failed to load stall');
    } finally {
      setStallLoading(false);
    }
  };

  useEffect(() => {
    loadMyStall();
  }, []);

  const handleUseMyLocation = async () => {
    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Location permission is needed to set stall location.'
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setCurrentLatLng({ lat, lng });
      Alert.alert('Location set', 'Stall location updated to your current GPS location.');
    } catch (err) {
      Alert.alert('Error', 'Failed to get your location.');
      console.log('Location error:', err);
    }
  };

  const handleSaveStall = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Stall name is required.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const tags =
        tagsText
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0) || [];

     const body = {
  name: name.trim(),
  description: description.trim(),
  address: address.trim(),
  pricePerPlate: Number(pricePerPlate) || 0,
  tags,
  upiId: upiId.trim(), // Send UPI ID
};

if (currentLatLng) {
  body.lat = currentLatLng.lat;
  body.lng = currentLatLng.lng;
}

      const res = await apiRequest('/api/stalls/mine', 'POST', body, token);
      setStall(res.stall);
      Alert.alert('Success', 'Stall saved successfully.');
    } catch (err) {
      setError(err.message || 'Failed to save stall');
    } finally {
      setSaving(false);
    }
  };

  if (stallLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading stall info...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Vendor Profile</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{user?.fullName}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email}</Text>

        <Text style={styles.label}>Phone</Text>
        <Text style={styles.value}>{user?.phone}</Text>

        <Text style={styles.label}>Vendor Status</Text>
        <Text style={styles.value}>{user?.vendorStatus}</Text>
      </View>

      <Text style={styles.sectionTitle}>My Stall</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      // Inside VendorProfileScreen.js – replace the stall form card content

<View style={styles.card}>
  <Text style={styles.label}>Stall Name *</Text>
  <TextInput
    style={styles.input}
    value={name}
    onChangeText={setName}
    placeholder="e.g. Sharma Ji Panipuri"
    placeholderTextColor="#999"
  />

  <Text style={styles.label}>Description</Text>
  <TextInput
    style={[styles.input, { height: 70 }]}
    value={description}
    onChangeText={setDescription}
    placeholder="Crispy & spicy panipuri..."
    placeholderTextColor="#999"
    multiline
  />

  <Text style={styles.label}>Address</Text>
  <TextInput
    style={styles.input}
    value={address}
    onChangeText={setAddress}
    placeholder="Near City Mall, Main Road..."
    placeholderTextColor="#999"
  />

  <Text style={styles.label}>Price Per Plate (₹)</Text>
  <TextInput
    style={styles.input}
    value={pricePerPlate}
    onChangeText={setPricePerPlate}
    placeholder="30"
    placeholderTextColor="#999"
    keyboardType="numeric"
  />

  <Text style={styles.label}>Tags (comma separated)</Text>
  <TextInput
    style={styles.input}
    value={tagsText}
    onChangeText={setTagsText}
    placeholder="Spicy, Crispy, Sweet"
    placeholderTextColor="#999"
  />

  {/* NEW: UPI ID Field */}
  <Text style={styles.label}>Your UPI ID (for PhonePe/Google Pay)</Text>
  <TextInput
    style={styles.input}
    value={upiId}
    onChangeText={setUpiId}
    placeholder="yourname@oksbi or 123456@ybl"
    placeholderTextColor="#999"
    autoCapitalize="none"
    keyboardType="email-address"
  />
  {upiId ? (
    <Text style={{ color: 'green', fontSize: 12, marginTop: 4 }}>
      UPI ID saved – customers can now pay online!
    </Text>
  ) : (
    <Text style={{ color: '#d9534f', fontSize: 12, marginTop: 4 }}>
      Add UPI ID to accept online payments
    </Text>
  )}

  {/* Optional: QR Image Upload Later */}
  {/* <Text style={styles.label}>OR Upload QR Code (coming soon)</Text> */}

  <Text style={styles.label}>Location</Text>
  {currentLatLng ? (
    <Text style={styles.value}>
      Lat: {currentLatLng.lat.toFixed(5)}, Lng: {currentLatLng.lng.toFixed(5)}
    </Text>
  ) : (
    <Text style={styles.value}>No location set yet.</Text>
  )}

  <TouchableOpacity
    style={styles.secondaryButton}
    onPress={handleUseMyLocation}
  >
    <Text style={styles.secondaryButtonText}>Use My Current Location</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.button}
    onPress={handleSaveStall}
    disabled={saving}
  >
    {saving ? (
      <ActivityIndicator color="#fff" />
    ) : (
      <Text style={styles.buttonText}>Save Stall</Text>
    )}
  </TouchableOpacity>
</View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
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
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
    color: '#ff8a00',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#ff8a00',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffd9a3',
    marginBottom: 24,
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
  button: {
    marginTop: 16,
    backgroundColor: '#ff8a00',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 12,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff8a00',
  },
  secondaryButtonText: {
    color: '#ff8a00',
    fontWeight: '600',
  },
  logoutButton: {
    alignSelf: 'center',
    marginTop: 8,
  },
  logoutText: {
    color: '#d9534f',
    fontWeight: '600',
  },
  error: {
    color: 'red',
    marginBottom: 8,
  },
});

export default VendorProfileScreen;
