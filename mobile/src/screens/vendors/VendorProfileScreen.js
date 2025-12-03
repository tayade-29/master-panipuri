// VendorProfileScreen.js
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
  StatusBar,
} from 'react-native';
import * as Location from 'expo-location';
import { AuthContext } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';

const VendorProfileScreen = () => {
  const { user, logout, token } = useContext(AuthContext);
  const [stall, setStall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [pricePerPlate, setPricePerPlate] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [upiId, setUpiId] = useState('');
  const [location, setLocation] = useState(null);

  const loadStall = async () => {
    try {
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
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStall();
  }, []);

  const handleUseLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission denied');

    const loc = await Location.getCurrentPositionAsync({});
    setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    Alert.alert('Location updated!');
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Name required');

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
      Alert.alert('Saved!', 'Your stall is updated.');
      setEditMode(false);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFCF7" />
      <ScrollView style={styles.container}>
        <Text style={styles.title}>My Profile</Text>

        {/* User Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <Text style={styles.info}>{user?.fullName}</Text>
          <Text style={styles.info}>{user?.phone}</Text>
          <Text style={styles.info}>{user?.email}</Text>
        </View>

        {/* Stall Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>My Stall</Text>
            <TouchableOpacity onPress={() => setEditMode(!editMode)}>
              <Text style={styles.editBtn}>{editMode ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          {editMode ? (
            <>
              <TextInput style={styles.input} placeholder="Stall Name" value={name} onChangeText={setName} />
              <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} />
              <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} />
              <TextInput style={styles.input} placeholder="Price per plate" value={pricePerPlate} onChangeText={setPricePerPlate} keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Tags (comma separated)" value={tagsText} onChangeText={setTagsText} />
              <TextInput style={styles.input} placeholder="UPI ID" value={upiId} onChangeText={setUpiId} />

              <TouchableOpacity style={styles.locationBtn} onPress={handleUseLocation}>
                <Text style={styles.locationBtnText}>Use Current Location</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.info}><Text style={styles.bold}>Name:</Text> {name || 'Not set'}</Text>
              <Text style={styles.info}><Text style={styles.bold}>Price:</Text> ₹{pricePerPlate || '—'} per plate</Text>
              <Text style={styles.info}><Text style={styles.bold}>UPI:</Text> {upiId || 'Not added'}</Text>
              <Text style={styles.info}><Text style={styles.bold}>Location:</Text> {location ? 'Set' : 'Not set'}</Text>
            </>
          )}
        </View>
<TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFCF7', paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFCF7' },
  title: { fontSize: 26, fontWeight: '800', color: '#222', textAlign: 'center', marginBottom: 20 },
  card: { marginHorizontal: 20, backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 20, elevation: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#FF6B00' },
  editBtn: { color: '#FF6B00', fontWeight: '600' },
  info: { fontSize: 15, color: '#444', marginBottom: 8 },
  bold: { fontWeight: '600', color: '#222' },
  input: { backgroundColor: '#F9F9F9', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  locationBtn: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FF6B00', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  locationBtnText: { color: '#FF6B00', fontWeight: '600' },
  saveBtn: { backgroundColor: '#FF6B00', padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  logoutBtn: { alignSelf: 'center', padding: 16 },
  logoutText: { color: '#E53935', fontWeight: '600', fontSize: 16 },
  logoutBtn: {
    marginHorizontal: 20,
    backgroundColor: '#E53935',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    elevation: 4,
  },
  logoutBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default VendorProfileScreen;