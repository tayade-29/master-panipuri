import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { apiRequest } from '../../api/client';

const formatDate = (isoStr) => {
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString();
};

const OffersScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offers, setOffers] = useState([]);
  const [error, setError] = useState('');

  const loadOffers = async (opts = { refresh: false }) => {
    try {
      if (opts.refresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      const res = await apiRequest('/api/offers', 'GET');
      setOffers(res.offers || []);
    } catch (err) {
      setError(err.message || 'Failed to load offers');
      setOffers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const onRefresh = () => {
    loadOffers({ refresh: true });
  };

  const renderItem = ({ item }) => {
    let discountText = '';
    if (item.discountType === 'PERCENT') {
      discountText = `${item.discountValue}% off`;
    } else if (item.discountType === 'FLAT') {
      discountText = `Flat ₹${item.discountValue} off`;
    } else if (item.discountType === 'FREE_PLATE') {
      discountText = `${item.discountValue || 1} free plate(s)`;
    } else if (item.discountType === 'CASHBACK') {
      discountText = `₹${item.discountValue} cashback`;
    }

    const minText =
      item.minOrderAmount && item.minOrderAmount > 0
        ? `On orders above ₹${item.minOrderAmount}`
        : 'No minimum order';

    return (
      <View style={styles.card}>
        <Text style={styles.code}>{item.code}</Text>
        <Text style={styles.title}>{item.title}</Text>
        {item.description ? (
          <Text style={styles.desc}>{item.description}</Text>
        ) : null}
        <Text style={styles.discount}>{discountText}</Text>
        <Text style={styles.min}>{minText}</Text>
        <Text style={styles.validity}>
          Valid: {formatDate(item.validFrom)} - {formatDate(item.validTo)}
        </Text>

        <TouchableOpacity style={styles.applyBtn}>
          <Text style={styles.applyText}>Apply at checkout</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading offers...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.reloadBtn} onPress={onRefresh}>
          <Text style={styles.reloadText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!offers.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No active offers right now.</Text>
        <TouchableOpacity style={styles.reloadBtn} onPress={onRefresh}>
          <Text style={styles.reloadText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={offers}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffd9a3',
    marginBottom: 12,
  },
  code: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ff8a00',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 4,
  },
  desc: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },
  discount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ff8a00',
    marginTop: 8,
  },
  min: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  validity: {
    fontSize: 11,
    color: '#777',
    marginTop: 4,
  },
  applyBtn: {
    marginTop: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ff8a00',
    paddingVertical: 8,
    alignItems: 'center',
  },
  applyText: {
    color: '#ff8a00',
    fontWeight: '600',
    fontSize: 13,
  },
  error: {
    color: 'red',
    marginBottom: 8,
  },
  empty: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
  },
  reloadBtn: {
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ff8a00',
  },
  reloadText: {
    color: '#ff8a00',
    fontWeight: '600',
  },
});

export default OffersScreen;
