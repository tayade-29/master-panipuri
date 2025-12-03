// VendorSettlementsScreen.js
import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';

const formatDate = (date) => new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

const VendorSettlementsScreen = () => {
  const { token } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setRefreshing(isRefresh);

      const res = await apiRequest('/api/payments/vendor/list', 'GET', null, token);
      setData(res);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  const payments = data?.payments || [];

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFCF7" />
      <View style={styles.container}>
        <Text style={styles.title}>Recent Sales</Text>

        <View style={styles.summary}>
          <Text style={styles.summaryText}>₹{data?.totalAmount || 0} • {data?.count || 0} orders • {data?.totalPlates || 0} plates</Text>
        </View>

        <FlatList
          data={payments}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
          ListEmptyComponent={<Text style={styles.empty}>No sales yet</Text>}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={styles.itemHeader}>
                <Text style={styles.amount}>₹{item.amount}</Text>
                <Text style={styles.method}>{item.method}</Text>
              </View>
              <Text style={styles.plates}>{item.plateCount} plates {item.freePlatesGiven > 0 && `(Free: ${item.freePlatesGiven})`}</Text>
              <Text style={styles.customer}>{item.customer?.fullName || 'Walk-in'}</Text>
              <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
            </View>
          )}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFCF7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFCF7' },
  title: { fontSize: 26, fontWeight: '800', color: '#222', textAlign: 'center', paddingTop: 50, paddingBottom: 10 },
  summary: { paddingHorizontal: 20, paddingBottom: 16 },
  summaryText: { fontSize: 16, fontWeight: '600', color: '#444', textAlign: 'center' },
  item: { backgroundColor: '#FFF', marginHorizontal: 20, marginBottom: 12, padding: 16, borderRadius: 16, elevation: 3 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 20, fontWeight: '800', color: '#222' },
  method: { fontSize: 13, color: '#FF6B00', fontWeight: '600', textTransform: 'uppercase' },
  plates: { fontSize: 14, color: '#666', marginTop: 4 },
  customer: { fontSize: 15, fontWeight: '600', color: '#222', marginTop: 6 },
  date: { fontSize: 12, color: '#999', marginTop: 8 },
  empty: { textAlign: 'center', padding: 40, fontSize: 16, color: '#999' },
});

export default VendorSettlementsScreen;