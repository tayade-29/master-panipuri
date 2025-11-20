import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';

const formatDateTime = (isoStr) => {
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return isoStr;
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

const VendorSettlementsScreen = () => {
  const { token } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const loadPayments = async (opts = { refresh: false }) => {
    try {
      if (opts.refresh) setRefreshing(true);
      else setLoading(true);

      setError('');

      // For now, we use default last 7 days (no query params)
      const res = await apiRequest(
        '/api/payments/vendor/list',
        'GET',
        null,
        token
      );

      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load settlements');
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const onRefresh = () => {
    loadPayments({ refresh: true });
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.itemCard}>
        <Text style={styles.itemStall}>
          {item.stall?.name || 'Stall'}
        </Text>
        <Text style={styles.itemLine}>
          <Text style={styles.itemLabel}>Customer: </Text>
          {item.customer?.fullName || 'Customer'}
        </Text>
        <Text style={styles.itemLine}>
          <Text style={styles.itemLabel}>Plates: </Text>
          {item.plateCount} (Free: {item.freePlatesGiven})
        </Text>
        <Text style={styles.itemLine}>
          <Text style={styles.itemLabel}>Amount: </Text>₹{item.amount}
        </Text>
        <Text style={styles.itemLine}>
          <Text style={styles.itemLabel}>Method: </Text>
          {item.method}
        </Text>
        <Text style={styles.itemDate}>{formatDateTime(item.createdAt)}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading settlements...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  const totalAmount = data?.totalAmount || 0;
  const totalPlates = data?.totalPlates || 0;
  const totalFreePlates = data?.totalFreePlates || 0;
  const count = data?.count || 0;
  const payments = data?.payments || [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settlements (Last 7 Days)</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Amount</Text>
          <Text style={styles.summaryValue}>₹{totalAmount}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Orders</Text>
          <Text style={styles.summaryValue}>{count}</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Plates Sold</Text>
          <Text style={styles.summaryValue}>{totalPlates}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Free Plates</Text>
          <Text style={styles.summaryValue}>{totalFreePlates}</Text>
        </View>
      </View>

      {payments.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.noData}>No payments in this period.</Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          style={{ marginTop: 8 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7e6',
    padding: 16,
    paddingTop: 16,
  },
  center: {
    flex: 1,
    backgroundColor: '#fff7e6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ff8a00',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ffd9a3',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#777',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 3,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ffd9a3',
    marginBottom: 8,
  },
  itemStall: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ff8a00',
    marginBottom: 2,
  },
  itemLine: {
    fontSize: 13,
    color: '#555',
  },
  itemLabel: {
    fontWeight: '600',
  },
  itemDate: {
    fontSize: 11,
    color: '#777',
    marginTop: 4,
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
  noData: {
    fontSize: 14,
    color: '#444',
  },
});

export default VendorSettlementsScreen;
