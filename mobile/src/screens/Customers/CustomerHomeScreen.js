import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';
import { Droplet, Award, Gift, Sparkles } from 'lucide-react-native';

const CustomerHomeScreen = ({ navigation }) => {
  const { user, token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  const loadData = async () => {
    const now = new Date();

    try {
      setLoading(true);
      setError('');

      const summaryRes = await apiRequest('/api/loyalty/summary', 'GET', null, token, 3);
      setSummary(summaryRes);

      await apiRequest('/api/offers', 'GET', null, token, 3);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f0' }}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greeting}>Hi, {user?.fullName || 'foodie'}!</Text>
        <Text style={styles.subtitle}>Your Panipuri Loyalty Dashboard</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.platesCard}>
          <Text style={styles.platesLabel}>Plates Enjoyed !</Text>
          <Text style={styles.platesNumber}>{totalPlates}</Text>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>Eat 5</Text>
            <View style={styles.arrow}>
              <View style={styles.arrowLine} />
              <View style={styles.arrowHead} />
            </View>
            <Text style={styles.progressText}>Get 1 Free</Text>
          </View>
        </View>

        <View style={styles.whySection}>
          <Text style={styles.whySectionTitle}>
            <Text style={styles.whyText}>Why </Text>
            <Text style={styles.panipuriText}>Panipuri </Text>
            <Text style={styles.enjoyText}>Enjoy !</Text>
          </Text>

          <View style={styles.iconsRow}>
            <View style={styles.iconItem}>
              <View style={styles.iconCircle}>
                <Sparkles size={28} color="#ff8a00" strokeWidth={2} />
              </View>
              <Text style={styles.iconLabel}>Hygiene Hands</Text>
            </View>

            <View style={styles.iconItem}>
              <View style={styles.iconCircle}>
                <Droplet size={28} color="#ff8a00" strokeWidth={2} />
              </View>
              <Text style={styles.iconLabel}>Mineral Water</Text>
            </View>

            <View style={styles.iconItem}>
              <View style={styles.iconCircle}>
                <Gift size={28} color="#ff8a00" strokeWidth={2} />
              </View>
              <Text style={styles.iconLabel}>Best Offer</Text>
            </View>

            <View style={styles.iconItem}>
              <View style={styles.iconCircle}>
                <Award size={28} color="#ff8a00" strokeWidth={2} />
              </View>
              <Text style={styles.iconLabel}>Clean Panipuri</Text>
            </View>
          </View>
        </View>

        <View style={styles.dealSection}>
          <Text style={styles.dealTitle}>
            <Text style={styles.todayText}>Today's </Text>
            <Text style={styles.loyaltyText}>Loyalty </Text>
            <Text style={styles.dealText}>Deal</Text>
          </Text>
          <Text style={styles.dealDescription}>
            Buy 5 plates at any stall -- Get 1 FREE next time!
          </Text>
          <TouchableOpacity
            style={styles.findButton}
            onPress={() => navigation.navigate('Vendors')}
            activeOpacity={0.8}
          >
            <Text style={styles.findButtonText}>Find Panipuri Near Me</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#f5f5f0',
    padding: 16,
    paddingTop: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f0',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ff8a00',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c2c2c',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  platesCard: {
    backgroundColor: '#ff8a00',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  platesLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  platesNumber: {
    fontSize: 80,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 90,
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  arrow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  arrowLine: {
    width: 40,
    height: 3,
    backgroundColor: '#fff',
  },
  arrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderLeftColor: '#fff',
    borderTopWidth: 6,
    borderTopColor: 'transparent',
    borderBottomWidth: 6,
    borderBottomColor: 'transparent',
  },
  whySection: {
    backgroundColor: '#fef3e0',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  whySectionTitle: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 20,
    fontWeight: '700',
  },
  whyText: {
    color: '#2c2c2c',
  },
  panipuriText: {
    color: '#ff8a00',
  },
  enjoyText: {
    color: '#ff8a00',
  },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  iconItem: {
    alignItems: 'center',
    width: '22%',
    marginBottom: 10,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#ff8a00',
  },
  iconLabel: {
    fontSize: 11,
    color: '#2c2c2c',
    textAlign: 'center',
    fontWeight: '600',
  },
  dealSection: {
    backgroundColor: '#fef3e0',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  dealTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  todayText: {
    color: '#2c2c2c',
  },
  loyaltyText: {
    color: '#ff8a00',
  },
  dealText: {
    color: '#ff8a00',
  },
  dealDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  findButton: {
    backgroundColor: '#ff8a00',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    shadowColor: '#ff8a00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  findButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CustomerHomeScreen;
