import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';

const VendorDashboardScreen = () => {
  const { user, token } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiRequest('/api/payments/vendor/summary', 'GET', null, token);
      setSummary(res);
    } catch (err) {
      setError(err.message || 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading today&apos;s summary...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Text style={{ marginTop: 4 }}>Make sure you have some payments today.</Text>
      </View>
    );
  }

  const totalAmount = summary?.totalAmount || 0;
  const totalPlates = summary?.totalPlates || 0;
  const totalFreePlates = summary?.totalFreePlates || 0;
  const byMethod = summary?.byMethod || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.title}>Hello, {user?.fullName}</Text>
      <Text style={styles.subtitle}>Today&apos;s Vendor Dashboard</Text>

      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Total Sales (₹)</Text>
          <Text style={styles.cardValue}>₹{totalAmount}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Plates Sold</Text>
          <Text style={styles.cardValue}>{totalPlates}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Free Plates Given</Text>
          <Text style={styles.cardValue}>{totalFreePlates}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Orders Today</Text>
          <Text style={styles.cardValue}>{summary?.count || 0}</Text>
        </View>
      </View>

      <View style={styles.fullCard}>
        <Text style={styles.sectionTitle}>By Payment Method</Text>
        {Object.keys(byMethod).length === 0 ? (
          <Text style={styles.smallText}>No payments yet today.</Text>
        ) : (
          Object.entries(byMethod).map(([method, amount]) => (
            <View key={method} style={styles.methodRow}>
              <Text style={styles.methodLabel}>{method}</Text>
              <Text style={styles.methodAmount}>₹{amount}</Text>
            </View>
          ))
        )}
      </View>

      <Text style={styles.footerText}>
        Data is for today (based on server time). We can later add date filters and full settlements.
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
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ffd9a3',
  },
  fullCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ffd9a3',
    marginTop: 8,
  },
  cardLabel: {
    fontSize: 12,
    color: '#777',
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ff8a00',
    marginBottom: 8,
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  methodLabel: {
    fontSize: 13,
    color: '#555',
  },
  methodAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  smallText: {
    fontSize: 12,
    color: '#777',
  },
  footerText: {
    fontSize: 11,
    color: '#777',
    marginTop: 12,
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
});

export default VendorDashboardScreen;
