// mobile/src/screens/Customers/CustomerOffersScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { apiRequest } from '../../api/client';

const CustomerOffersScreen = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchOffers = async () => {
    try {
      setError('');
      // 👇 IMPORTANT: /api/offers, not /offers
      const data = await apiRequest('/api/offers', 'GET');

      setOffers(data.offers || []);
    } catch (err) {
      console.log('Offers fetch error:', err.message);
      setError(err.message || 'Failed to load offers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOffers();
  };

  const renderOfferItem = ({ item }) => {
    const validFrom = item.validFrom ? item.validFrom.slice(0, 10) : '';
    const validTo = item.validTo ? item.validTo.slice(0, 10) : '';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <MaterialIcons name="local-offer" size={20} color="#ff8a00" />
            <Text style={styles.titleText}>{item.title}</Text>
          </View>
          <View style={styles.codeBadge}>
            <Text style={styles.codeText}>{item.code}</Text>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.descriptionText} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.infoRow}>
          <View style={styles.infoChip}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{item.discountType}</Text>
          </View>
          <View style={styles.infoChip}>
            <Text style={styles.infoLabel}>Value</Text>
            <Text style={styles.infoValue}>{item.discountValue}</Text>
          </View>
          <View style={styles.infoChip}>
            <Text style={styles.infoLabel}>Min Amount</Text>
            <Text style={styles.infoValue}>
              ₹{item.minOrderAmount || 0}
            </Text>
          </View>
        </View>

        <View style={styles.validRow}>
          <Text style={styles.validText}>
            Valid: {validFrom} - {validTo}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerHint}>
            Apply this code on payment to get the offer.
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff8a00" />
        <Text style={{ marginTop: 8, color: '#555' }}>Loading offers...</Text>
      </View>
    );
  }

  if (error && !offers.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText} onPress={fetchOffers}>
          Tap to retry
        </Text>
      </View>
    );
  }

  if (!offers.length) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="card-giftcard" size={40} color="#ffb84d" />
        <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '600' }}>
          No offers right now
        </Text>
        <Text style={{ marginTop: 4, color: '#777', textAlign: 'center' }}>
          Check back later for new deals on your favourite panipuri stalls.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={offers}
        keyExtractor={(item) => item._id}
        renderItem={renderOfferItem}
        contentContainerStyle={styles.listContent}
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
  },
  center: {
    flex: 1,
    backgroundColor: '#fff7e6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffd9a3',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  codeBadge: {
    backgroundColor: '#ff8a00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  codeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  descriptionText: {
    marginTop: 8,
    fontSize: 13,
    color: '#555',
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between',
  },
  infoChip: {
    flex: 1,
    marginRight: 6,
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#fff9ee',
  },
  infoLabel: {
    fontSize: 11,
    color: '#777',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  validRow: {
    marginTop: 8,
  },
  validText: {
    fontSize: 12,
    color: '#777',
  },
  footerRow: {
    marginTop: 6,
  },
  footerHint: {
    fontSize: 11,
    color: '#999',
  },
  errorText: {
    color: '#c0392b',
    fontSize: 14,
    textAlign: 'center',
  },
  retryText: {
    marginTop: 6,
    color: '#ff8a00',
    fontWeight: '600',
  },
});

export default CustomerOffersScreen;
