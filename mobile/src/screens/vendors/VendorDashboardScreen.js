// VendorDashboardScreen.js
import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native';
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
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Unable to load data</Text>
        <Text style={styles.errorSub}>{error}</Text>
      </View>
    );
  }

  const totalAmount = summary?.totalAmount || 0;
  const totalPlates = summary?.totalPlates || 0;
  const totalFreePlates = summary?.totalFreePlates || 0;
  const byMethod = summary?.byMethod || {};

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFCF7" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.appName}>Panipuri</Text>
          <Text style={styles.greeting}>Namaste, {user?.fullName}!</Text>
          <Text style={styles.subtitle}>Your business summary for today</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Today's Earnings</Text>
          <Text style={styles.heroAmount}>₹{totalAmount.toLocaleString('en-IN')}</Text>
          <Text style={styles.heroSub}>from {summary?.count || 0} orders</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Plates Sold</Text>
            <Text style={styles.statValue}>{totalPlates}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Free Plates</Text>
            <Text style={styles.statValue}>{totalFreePlates}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          {Object.keys(byMethod).length === 0 ? (
            <Text style={styles.emptyText}>No payments recorded today</Text>
          ) : (
            <View style={styles.methodList}>
              {Object.entries(byMethod).map(([method, amount]) => (
                <View key={method} style={styles.methodRow}>
                  <Text style={styles.methodName}>
                    {method === 'cash' ? 'Cash' : method === 'upi' ? 'UPI' : method.toUpperCase()}
                  </Text>
                  <Text style={styles.methodAmount}>₹{amount.toLocaleString('en-IN')}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFCF7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFCF7' },
  header: { padding: 24, paddingTop: 60 },
  appName: { fontSize: 32, fontWeight: '900', color: '#FF6B00', marginBottom: 8 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#222' },
  subtitle: { fontSize: 15, color: '#777', marginTop: 6 },
  heroCard: {
    marginHorizontal: 20,
    backgroundColor: '#FF6B00',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    elevation: 8,
  },
  heroLabel: { color: '#FFF8E1', fontSize: 14, fontWeight: '600' },
  heroAmount: { color: '#FFFFFF', fontSize: 40, fontWeight: '900', marginVertical: 8 },
  heroSub: { color: '#FFF0E0', fontSize: 14 },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 20, gap: 16, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#FFE0B3',
  },
  statLabel: { fontSize: 13, color: '#888', fontWeight: '600' },
  statValue: { fontSize: 28, fontWeight: '800', color: '#222', marginTop: 6 },
  section: { marginHorizontal: 20, backgroundColor: '#FFF', borderRadius: 16, padding: 20, elevation: 4, marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#FF6B00', marginBottom: 16 },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', paddingVertical: 20 },
  methodList: { borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12 },
  methodRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  methodName: { fontSize: 15, color: '#444', fontWeight: '600', textTransform: 'capitalize' },
  methodAmount: { fontSize: 16, fontWeight: '700', color: '#222' },
});

export default VendorDashboardScreen;