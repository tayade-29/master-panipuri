// src/screens/vendors/VendorProfileScreen.js
import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
voluntary,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import * as Location from 'expo-location';
import { AuthContext } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';

const VendorProfileScreen = () => {
  const { user, logout, token, updateUser } = useContext(AuthContext);

  const [stall, setStall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [pricePerPlate, setPricePerPlate] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [upiId, setUpiId] = useState('');
  const [location, setLocation] = useState(null);

  // Load stall data
  const loadStall = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/stalls/mine', 'GET', null, token);
      const s = res.stall;

      setStall(s);
      if (s) {
        setName(s.name || '');
        setDescription(s.description || '');
        setAddress(s.address || '');
        setPricePerPlate(s.pricePerPlate ? String(s.pricePerPlate) : '');
        setTagsText(s.tags?.join(', ') || '');
        setUpiId(s.upiId || '');
        if (s.location?.coordinates) {
          const [lng, lat] = s.location.coordinates;
          setLocation({ lat, lng });
        }
      }
    } catch (err) {
      console.log('Load stall error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStall();
  }, []);

  // Request edit permission from admin
  const requestEditPermission = async () => {
    try {
      await apiRequest('/api/stalls/request-edit', 'POST', {}, token);
      Alert.alert(
        'Request Sent',
        'Your request to edit stall details has been sent to admin. You will be able to edit once approved.',
        [{ text: 'OK', onPress: () => {
          // Optionally refresh user to show PENDING status
          updateUser?.();
        }}]
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to send request');
    }
  };

  // Handle Edit button press
  const handleEditPress = () => {
    const status = user?.editRequestStatus || 'NONE';

    if (status === 'APPROVED') {
      setEditMode(true);
    } else if (status === 'PENDING') {
      Alert.alert(
        'Request Pending',
        'Your edit request is already pending with the admin. Please wait for approval.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Admin Approval Required',
        'You need permission from the admin to edit your stall details.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Request Permission',
            onPress: requestEditPermission,
          },
        ]
      );
    }
  };

  // Use current location
  const handleUseLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required.');
      return;
    }

    try {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      });
      Alert.alert('Location Updated', 'Your current location has been set.');
    } catch (err) {
      Alert.alert('Error', 'Could not get location.');
    }
  };

  // Save stall changes
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Stall name is required.');
      return;
    }

    try {
      setSaving(true);
      const body = {
        name: name.trim(),
        description: description.trim(),
        address: address.trim(),
        pricePerPlate: Number(pricePerPlate) || 0,
        tags: tagsText.split(',').map(t => t.trim()).filter(Boolean),
        upiId: upiId.trim(),
        ...(location && { lat: location.lat, lng: location.lng }),
      };

      await apiRequest('/api/stalls/mine', 'POST', body, token);

      Alert.alert('Success', 'Stall updated successfully!', [
        { text: 'OK', onPress: () => {
          setEditMode(false);
          loadStall();
          updateUser?.(); // Refresh user to reset editRequestStatus
        }}
      ]);
    } catch (err) {
      const msg = err.message || 'Failed to save';
      if (msg.includes('Edit permission required') || msg.includes('403')) {
        Alert.alert('Permission Denied', 'You do not have permission to edit. Please request approval from admin.');
        setEditMode(false);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading stall...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFCF7" />
      <ScrollView style={styles.container}>
        <Text style={styles.title}>My Profile</Text>

        {/* Account Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Details</Text>
          <Text style={styles.info}>Name: {user?.fullName}</Text>
          <Text style={styles.info}>Phone: {user?.phone}</Text>
          <Text style={styles.info}>Email: {user?.email}</Text>
          {user?.editRequestStatus && user.editRequestStatus !== 'NONE' && (
            <Text style={styles.statusText}>
              Edit Status: <Text style={{ fontWeight: 'bold', color: '#FF6B00' }}>
                {user.editRequestStatus}
              </Text>
            </Text>
          )}
        </View>

        {/* Stall Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>My Stall</Text>
            <TouchableOpacity onPress={handleEditPress}>
              <Text style={styles.editBtn}>
                {editMode ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          {editMode ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Stall Name *"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={styles.input}
                placeholder="Description"
                value={description}
                onChangeText={setDescription}
                multiline
              />
              <TextInput
                style={styles.input}
                placeholder="Address"
                value={address}
                onChangeText={setAddress}
              />
              <TextInput
                style={styles.input}
                placeholder="Price per plate (₹)"
                value={pricePerPlate}
                onChangeText={setPricePerPlate}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Tags (e.g. veg, spicy, fast)"
                value={tagsText}
                onChangeText={setTagsText}
              />
              <TextInput
                style={styles.input}
                placeholder="UPI ID (for payments)"
                value={upiId}
                onChangeText={setUpiId}
              />

              <TouchableOpacity style={styles.locationBtn} onPress={handleUseLocation}>
                <Text style={styles.locationBtnText}>Use Current Location</Text>
              </TouchableOpacity>

              {location && (
                <Text style={{ color: 'green', marginBottom: 10, textAlign: 'center' }}>
                  Location Set
                </Text>
              )}

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.info}><Text style={styles.bold}>Name:</Text> {name || 'Not set'}</Text>
              <Text style={styles.info}><Text style={styles.bold}>Price:</Text> ₹{pricePerPlate || '—'} per plate</Text>
              <Text style={styles.info}><Text style={styles.bold}>UPI ID:</Text> {upiId || 'Not added'}</Text>
              <Text style={styles.info}><Text style={styles.bold}>Location:</Text> {location ? 'Set' : 'Not set'}</Text>
              <Text style={styles.info}><Text style={styles.bold}>Status:</Text> {stall?.isOpen ? 'Open' : 'Closed'}</Text>
            </>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7e6',
    paddingTop: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFCF7',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#222',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FF6B00',
  },
  editBtn: {
    color: '#FF6B00',
    fontWeight: '600',
    fontSize: 16,
  },
  info: {
    fontSize: 15.5,
    color: '#444',
    marginBottom: 8,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
    color: '#222',
  },
  statusText: {
    marginTop: 10,
    fontSize: 15,
    color: '#666',
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 15,
  },
  locationBtn: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#FF6B00',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  locationBtnText: {
    color: '#FF6B00',
    fontWeight: '600',
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: '#FF6B00',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  logoutBtn: {
    marginHorizontal: 20,
    backgroundColor: '#E53935',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
  },
  logoutBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default VendorProfileScreen;