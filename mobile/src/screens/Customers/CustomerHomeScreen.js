import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';

const formatDate = (isoStr) => {
  if (!isoStr) return 'No visits yet';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return 'No visits yet';
  return d.toLocaleDateString();
};

const CustomerHomeScreen = ({ navigation }) => {
  const { user, token } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  const loadLoyaltySummary = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiRequest(
        '/api/loyalty/summary',
        'GET',
        null,
        token
      );
      setSummary(res);
    } catch (err) {
      setError(err.message || 'Failed to load loyalty summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoyaltySummary();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading your stats...</Text>
      </View>
    );
  }

  const totalPlates = summary?.totalPlates || 0;
  const totalFreePlates = summary?.totalFreePlates || 0;
  const totalAmountSpent = summary?.totalAmountSpent || 0;
  const vendorStats = summary?.vendorStats || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <Text style={styles.greeting}>
        Hi, {user?.fullName || 'Foodie'} 👋
      </Text>
      <Text style={styles.subtitle}>Your Panipuri Journey</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Quick stats */}
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Plates Eaten</Text>
          <Text style={styles.cardValue}>{totalPlates}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Free Plates</Text>
          <Text style={styles.cardValue}>{totalFreePlates}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Total Spent</Text>
          <Text style={styles.cardValue}>₹{totalAmountSpent}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Vendors Visited</Text>
          <Text style={styles.cardValue}>{vendorStats.length}</Text>
        </View>
      </View>

      {/* Today’s Special / CTA */}
      <View style={styles.specialCard}>
        <Text style={styles.specialTitle}>Today&apos;s Special</Text>
        <Text style={styles.specialText}>
          Eat 5 plates at any stall and get 1 free! Keep munching 😋
        </Text>
        <TouchableOpacity
          style={styles.specialButton}
          onPress={() => navigation.navigate('Vendors')}
        >
          <Text style={styles.specialButtonText}>Find Panipuri Near Me</Text>
        </TouchableOpacity>
      </View>

      {/* Loyalty by vendor */}
      <Text style={styles.sectionTitle}>My Loyalty by Stall</Text>

      {vendorStats.length === 0 ? (
        <Text style={styles.smallText}>
          You haven&apos;t eaten at any stall yet. Visit a vendor and start
          your loyalty journey!
        </Text>
      ) : (
        vendorStats.map((v) => {
          const progressText = `${v.currentPlateCount}/5 plates`;
          const remainingText = `${v.platesNeededForNextFree} more for a free plate`;

          return (
            <View key={v.vendorId} style={styles.loyaltyCard}>
              <Text style={styles.vendorName}>{v.vendorName}</Text>
              <Text style={styles.loyaltyLine}>{progressText}</Text>
              <Text style={styles.loyaltyLine}>{remainingText}</Text>

              <Text style={styles.loyaltySmall}>
                Total plates here: {v.totalPlatesWithVendor} | Free plates:{' '}
                {v.totalFreePlatesWithVendor}
              </Text>
              <Text style={styles.loyaltySmall}>
                Last visit: {formatDate(v.lastVisitedAt)}
              </Text>
            </View>
          );
        })
      )}
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
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ff8a00',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
  },
  error: {
    color: 'red',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ffd9a3',
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
  specialCard: {
    backgroundColor: '#ffe2b8',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  specialTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff8a00',
  },
  specialText: {
    fontSize: 13,
    color: '#444',
    marginVertical: 6,
  },
  specialButton: {
    marginTop: 8,
    backgroundColor: '#ff8a00',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  specialButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff8a00',
    marginTop: 8,
    marginBottom: 6,
  },
  smallText: {
    fontSize: 12,
    color: '#777',
  },
  loyaltyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ffd9a3',
    marginBottom: 8,
  },
  vendorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ff8a00',
    marginBottom: 2,
  },
  loyaltyLine: {
    fontSize: 13,
    color: '#555',
  },
  loyaltySmall: {
    fontSize: 11,
    color: '#777',
    marginTop: 2,
  },
});

export default CustomerHomeScreen;
