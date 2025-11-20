import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { AuthContext } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';

const CustomerReferralScreen = () => {
  const { user, token } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiRequest(
        '/api/referrals/summary',
        'GET',
        null,
        token
      );
      setSummary(res);
    } catch (err) {
      setError(err.message || 'Failed to load referral info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleCopy = async () => {
    if (!summary?.referralCode) return;
    await Clipboard.setStringAsync(summary.referralCode);
    // No toast built in; we can just log or ignore
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading your referral info...</Text>
      </View>
    );
  }

  const referralCode = summary?.referralCode || 'N/A';
  const totalReferred = summary?.totalReferred || 0;
  const referredUsers = summary?.referredUsers || [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Referral & Earn</Text>
      <Text style={styles.subtitle}>
        Share your code with friends. When they register using it, they are linked to you.
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.label}>Your Referral Code</Text>
        <Text style={styles.code}>{referralCode}</Text>

        <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
          <Text style={styles.copyText}>Copy Code</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Friends Referred</Text>
        <Text style={styles.bigNumber}>{totalReferred}</Text>
      </View>

      {referredUsers.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.label}>Who you referred</Text>
          <FlatList
            data={referredUsers}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.friendRow}>
                <Text style={styles.friendName}>{item.fullName}</Text>
                <Text style={styles.friendInfo}>{item.phone}</Text>
              </View>
            )}
          />
        </View>
      )}
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
  center: {
    flex: 1,
    backgroundColor: '#fff7e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ff8a00',
  },
  subtitle: {
    fontSize: 13,
    color: '#555',
    marginBottom: 12,
  },
  error: {
    color: 'red',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffd9a3',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#777',
  },
  code: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ff8a00',
    marginTop: 6,
  },
  copyBtn: {
    marginTop: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ff8a00',
    paddingVertical: 8,
    alignItems: 'center',
  },
  copyText: {
    color: '#ff8a00',
    fontWeight: '600',
    fontSize: 13,
  },
  bigNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
    marginTop: 6,
  },
  friendRow: {
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderColor: '#eee',
  },
  friendName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  friendInfo: {
    fontSize: 12,
    color: '#777',
  },
});

export default CustomerReferralScreen;
