// CustomerHomeScreen.js
import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';

const CustomerHomeScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiRequest('/api/loyalty/summary', 'GET');
        setSummary(res);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Loading your journey...</Text>
      </View>
    );
  }

  const totalPlates = summary?.totalPlates || 0;
  const freePlates = summary?.totalFreePlates || 0;
  const mostVisited = (summary?.vendorStats || [])
    .sort((a, b) => b.totalPlatesWithVendor - a.totalPlatesWithVendor)
    .slice(0, 1)[0];

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFCF7" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Namaste,</Text>
          <Text style={styles.name}>{user?.fullName || 'Foodie'}!</Text>
          <Text style={styles.subtitle}>Welcome back to Panipuri</Text>
        </View>

        {/* Hero Stats */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Plates Enjoyed</Text>
          <Text style={styles.heroValue}>{totalPlates}</Text>
          <Text style={styles.heroSub}>
            {freePlates > 0 ? `+${freePlates} Free Plates Earned` : 'Eat 5 → Get 1 Free!'}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Vendors')}
          >
            <Text style={styles.actionText}>Find Panipuri Near Me</Text>
          </TouchableOpacity>
        </View>

        {/* Favorite Stall */}
        {mostVisited && (
          <View style={styles.favSection}>
            <Text style={styles.sectionTitle}>Your Favorite Stall</Text>
            <View style={styles.favCard}>
              <Text style={styles.favName}>{mostVisited.vendorName}</Text>
              <Text style={styles.favProgress}>
                {mostVisited.currentPlateCount}/5 plates
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(mostVisited.currentPlateCount / 5) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.favSmall}>
                {mostVisited.platesNeededForNextFree === 0
                  ? 'Next plate is FREE!'
                  : `${mostVisited.platesNeededForNextFree} more for free plate`}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFCF7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFCF7' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  header: { padding: 24, paddingTop: 60 },
  greeting: { fontSize: 18, color: '#666' },
  name: { fontSize: 32, fontWeight: '900', color: '#222', marginTop: 4 },
  subtitle: { fontSize: 16, color: '#FF6B00', marginTop: 6, fontWeight: '600' },
  heroCard: {
    marginHorizontal: 20,
    backgroundColor: '#FF6B00',
    borderRadius: 24,
    padding: 28,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  heroLabel: { color: '#FFF8E1', fontSize: 15, fontWeight: '600' },
  heroValue: { color: '#FFFFFF', fontSize: 56, fontWeight: '900', marginVertical: 8 },
  heroSub: { color: '#FFF0E0', fontSize: 15, fontWeight: '600' },
  actions: { paddingHorizontal: 20, marginTop: 20 },
  actionBtn: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 6,
    borderWidth: 1,
    borderColor: '#FFE0B3',
  },
  actionText: { fontSize: 17, fontWeight: '700', color: '#FF6B00' },
  favSection: { marginHorizontal: 20, marginTop: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 12 },
  favCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#FFE0B3',
  },
  favName: { fontSize: 18, fontWeight: '800', color: '#222' },
  favProgress: { fontSize: 14, color: '#666', marginTop: 8 },
  progressBar: {
    height: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 5,
    marginVertical: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B00',
    borderRadius: 5,
  },
  favSmall: { fontSize: 13, color: '#FF6B00', fontWeight: '600' },
});

export default CustomerHomeScreen;