// src/screens/CustomerHomeScreen.js
import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';

const formatDate = (isoStr) => {
  if (!isoStr) return 'Never';
  const d = new Date(isoStr);
  return isNaN(d.getTime()) ? 'Never' : d.toLocaleDateString('en-IN');
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
      const res = await apiRequest('/api/loyalty/summary', 'GET', null, token);
      setSummary(res);
    } catch (err) {
      setError(err.message || 'Failed to load your stats');
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
        <ActivityIndicator size="large" color="#ff8a00" />
        <Text style={styles.loadingText}>Loading your Panipuri journey...</Text>
      </View>
    );
  }

  const totalPlates = summary?.totalPlates || 0;
  const totalFreePlates = summary?.totalFreePlates || 0;
  const totalAmountSpent = summary?.totalAmountSpent || 0;
  const vendorStats = summary?.vendorStats || [];

  const mostVisited = [...vendorStats]
    .sort((a, b) => b.totalPlatesWithVendor - a.totalPlatesWithVendor)
    .slice(0, 5); // Show top 5

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greeting}>Hi, {user?.fullName || 'Foodie'}!</Text>
        <Text style={styles.subtitle}>Your Panipuri Loyalty Dashboard</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Plates Eaten</Text>
            <Text style={styles.statValue}>{totalPlates}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Free Plates Earned</Text>
            <Text style={styles.statValue}>{totalFreePlates}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Spent</Text>
            <Text style={styles.statValue}>₹{totalAmountSpent}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Stalls Visited</Text>
            <Text style={styles.statValue}>{vendorStats.length}</Text>
          </View>
        </View>

        {/* Today’s Offer */}
        <View style={styles.offerCard}>
          <Text style={styles.offerTitle}>Today’s Loyalty Deal</Text>
          <Text style={styles.offerText}>
            Buy 5 plates at any stall → Get 1 FREE next time!
          </Text>
          <TouchableOpacity
            style={styles.findButton}
            onPress={() => navigation.navigate('Vendors')}
          >
            <Text style={styles.findButtonText}>Find Panipuri Near Me</Text>
          </TouchableOpacity>
        </View>

        {/* Top Stalls */}
        <Text style={styles.sectionTitle}>Your Favorite Stalls</Text>
        {mostVisited.length === 0 ? (
          <Text style={styles.noData}>You haven't eaten anywhere yet. Time to start!</Text>
        ) : (
          mostVisited.map((v, i) => (
            <View key={v.vendorId} style={styles.stallCard}>
              <View style={styles.rankRow}>
                <Text style={styles.rank}>#{i + 1}</Text>
                <Text style={styles.stallName}>{v.vendorName}</Text>
              </View>
              <Text style={styles.progress}>
                {v.currentPlateCount}/5 plates • {v.platesNeededForNextFree} more for FREE!
              </Text>
              <Text style={styles.details}>
                Total: {v.totalPlatesWithVendor} plates • Free earned: {v.totalFreePlatesWithVendor}
              </Text>
              <Text style={styles.lastVisit}>Last visit: {formatDate(v.lastVisitedAt)}</Text>
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#fff7e6',
    padding: 16,
    paddingTop: 40,
    paddingBottom: 60,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff7e6',
  },
  loadingText: { marginTop: 12, fontSize: 16, color: '#ff8a00' },
  greeting: { fontSize: 28, fontWeight: '800', color: '#ff8a00' },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 16 },
  errorText: { color: '#d32f2f', textAlign: 'center', marginBottom: 10 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ffd9a3',
    alignItems: 'center',
  },
  statLabel: { fontSize: 13, color: '#777' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#333', marginTop: 6 },
  offerCard: {
    backgroundColor: '#ffe2b8',
    padding: 20,
    borderRadius: 20,
    marginVertical: 20,
    alignItems: 'center',
  },
  offerTitle: { fontSize: 18, fontWeight: '700', color: '#ff6f00' },
  offerText: { fontSize: 14, color: '#444', marginVertical: 8, textAlign: 'center' },
  findButton: {
    marginTop: 10,
    backgroundColor: '#ff8a00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  findButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#ff8a00', marginTop: 10 },
  noData: { fontSize: 14, color: '#777', textAlign: 'center', marginVertical: 20 },
  stallCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ffd9a3',
    marginBottom: 12,
  },
  rankRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  rank: { fontSize: 22, fontWeight: '800', color: '#ff8a00', marginRight: 10 },
  stallName: { fontSize: 17, fontWeight: '700', color: '#333' },
  progress: { fontSize: 15, color: '#ff6f00', fontWeight: '600', marginTop: 4 },
  details: { fontSize: 13, color: '#555', marginTop: 4 },
  lastVisit: { fontSize: 12, color: '#888', marginTop: 6 },
});

export default CustomerHomeScreen;