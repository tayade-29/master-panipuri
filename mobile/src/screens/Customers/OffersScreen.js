import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
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
      const data = await apiRequest('/api/offers', 'GET');
      const now = new Date();
      const activeOffers = (data.offers || []).filter(offer => {
        const from = offer.validFrom ? new Date(offer.validFrom) : new Date(0);
        const to = offer.validTo ? new Date(offer.validTo) : new Date('2100-01-01');
        return from <= now && now <= to;
      });
      setOffers(activeOffers);
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

  const getColorScheme = (index) => {
    const schemes = [
      { bg: '#1ABC9C', light: '#16A085', accent: '#0D5D4B' },
      { bg: '#F39C12', light: '#E67E22', accent: '#C86812' },
      { bg: '#9B59B6', light: '#8E44AD', accent: '#6C3483' },
      { bg: '#E74C3C', light: '#C0392B', accent: '#A93226' },
      { bg: '#3498DB', light: '#2980B9', accent: '#1F618D' },
      { bg: '#16A085', light: '#138D75', accent: '#0B5345' },
    ];
    return schemes[index % schemes.length];
  };

  const renderOfferItem = ({ item, index }) => {
    const validTo = item.validTo ? item.validTo.slice(0, 10) : '';
    const colors = getColorScheme(index);

    return (
      <View style={[styles.card, { backgroundColor: colors.bg }]}>
        <View style={styles.cardContent}>
          <View style={styles.leftSection}>
            <View>
              <Text style={styles.mainOffer}>
                {item.discountType === 'percentage'
                  ? `${item.discountValue}% OFF`
                  : `₹${item.discountValue} OFF`}
              </Text>
              <Text style={styles.offerTitle}>{item.title}</Text>
              {item.description && (
                <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
              )}
              <TouchableOpacity style={styles.useNowBtn}>
                <Text style={styles.useNowText}>Use Now</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.rightSection}>
            <View style={[styles.codeBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.codeLabel}>CODE</Text>
              <Text style={styles.codeText}>{item.code}</Text>
            </View>
            <View style={styles.infoStack}>
              <View style={styles.infoPill}>
                <MaterialIcons name="shopping-cart" size={12} color={colors.bg} />
                <Text style={[styles.infoPillText, { color: colors.bg }]}>
                  Min ₹{item.minOrderAmount || 0}
                </Text>
              </View>
              <View style={styles.infoPill}>
                <MaterialIcons name="schedule" size={12} color={colors.bg} />
                <Text style={[styles.infoPillText, { color: colors.bg }]}>
                  {validTo}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1ABC9C" />
        <Text style={{ marginTop: 8, color: '#1ABC9C', fontWeight: '600' }}>
          Loading offers...
        </Text>
      </View>
    );
  }

  if (error && !offers.length) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="error-outline" size={40} color="#E74C3C" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchOffers}>
          <Text style={styles.retryText}>Tap to retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!offers.length) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="card-giftcard" size={48} color="#1ABC9C" />
        <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '700', color: '#2C3E50' }}>
          No offers right now
        </Text>
        <Text style={{ marginTop: 4, color: '#7F8C8D', textAlign: 'center', fontSize: 13 }}>
          Check back later for amazing deals on your favourite panipuri stalls.
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1ABC9C']} />
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
    borderRadius: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftSection: {
    flex: 1,
    marginRight: 12,
  },
  mainOffer: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  offerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 10,
    fontWeight: '500',
  },
  useNowBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  useNowText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C3E50',
  },
  rightSection: {
    alignItems: 'center',
    gap: 10,
  },
  codeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 70,
  },
  codeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  codeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  infoStack: {
    gap: 6,
  },
  infoPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
  },
  retryText: {
    marginTop: 12,
    color: '#E74C3C',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default CustomerOffersScreen;
