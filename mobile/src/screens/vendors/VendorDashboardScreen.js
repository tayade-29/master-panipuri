// src/screens/Vendor/VendorDashboardScreen.js
import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';

const VendorDashboardScreen = () => {
  const { user, token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [filter, setFilter] = useState('today'); // today, yesterday, all

  const fetchSummary = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setRefreshing(true);

      let url = '/api/payments/vendor/summary';
      if (filter === 'yesterday') url += '?period=yesterday';
      if (filter === 'all') url += '?period=all';

      const res = await apiRequest(url, 'GET', null, token);
      setSummary(res);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load data. Check internet or server.');
    } finally {
      setLoading(false);     // YE GALTI THI PEHLE
      setRefreshing(false);  // YE GALTI THI PEHLE
    }
  };

  const onRefresh = useCallback(() => {
    fetchSummary(false);
  }, [filter]);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(() => {
      fetchSummary(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [filter]);

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff8a00" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading live data...</Text>
      </View>
    );
  }

  const totalAmount = summary?.totalAmount || 0;
  const totalPlates = summary?.totalPlates || 0;
  const totalFreePlates = summary?.totalFreePlates || 0;
  const count = summary?.count || 0;
  const byMethod = summary?.byMethod || {};

  const getTitle = () => {
    if (filter === 'today') return "Today's Sales";
    if (filter === 'yesterday') return "Yesterday's Sales";
    return 'All Time Sales';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff8a00']} />
      }
    >
      <Text style={styles.title}>Hello, {user?.fullName || 'Vendor'}!</Text>

      <View style={styles.filterRow}>
        {['today', 'yesterday', 'all'].map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.filterBtn, filter === item && styles.filterBtnActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
              {item === 'today' ? 'Today' : item === 'yesterday' ? 'Yesterday' : 'All Time'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.subtitle}>{getTitle()}</Text>

      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Total Earnings</Text>
          <Text style={styles.cardValue}>₹{totalAmount.toFixed(0)}</Text>
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
          <Text style={styles.cardLabel}>Total Orders</Text>
          <Text style={styles.cardValue}>{count}</Text>
        </View>
      </View>

      <View style={styles.fullCard}>
        <Text style={styles.sectionTitle}>Payment Methods</Text>
        {Object.keys(byMethod).length === 0 ? (
          <Text style={styles.smallText}>No sales in this period</Text>
        ) : (
          Object.entries(byMethod).map(([method, amount]) => (
            <View key={method} style={styles.methodRow}>
              <Text style={styles.methodLabel}>
                {method === 'ONLINE' ? 'UPI/Online' : 'Cash'}
              </Text>
              <Text style={styles.methodAmount}>₹{amount}</Text>
            </View>
          ))
        )}
      </View>

      <Text style={styles.footerText}>
        Pull down to refresh • Auto-updates every 15 seconds
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff7e6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff7e6' },
  title: { fontSize: 24, fontWeight: '800', color: '#ff8a00', padding: 16, paddingTop: 50 },
  subtitle: { fontSize: 18, fontWeight: '700', color: '#333', paddingHorizontal: 16, marginBottom: 10 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 12, backgroundColor: '#fff', margin: 12, borderRadius: 12 },
  filterBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 30, backgroundColor: '#f0f0f0' },
  filterBtnActive: { backgroundColor: '#ff8a00' },
  filterText: { fontSize: 14, fontWeight: '600', color: '#555' },
  filterTextActive: { color: '#fff' },
  row: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 12 },
  card: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#ffd9a3', elevation: 3 },
  cardLabel: { fontSize: 13, color: '#777', marginBottom: 6 },
  cardValue: { fontSize: 26, fontWeight: '900', color: '#ff6b74d' },
  fullCard: { margin: 16, marginTop: 8, backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#ffd9a3' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#ff8a00', marginBottom: 10 },
  methodRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  methodLabel: { fontSize: 15, color: '#444' },
  methodAmount: { fontSize: 15, fontWeight: '700', color: '#333' },
  smallText: { color: '#888', fontStyle: 'italic', textAlign: 'center', marginTop: 10 },
  footerText: { textAlign: 'center', color: '#999', fontSize: 12, marginVertical: 20 },
});

export default VendorDashboardScreen;