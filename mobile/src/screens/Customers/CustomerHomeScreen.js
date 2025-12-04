// CustomerHomeScreen.js
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
  Animated,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
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
  const [offers, setOffers] = useState([]);
  const [error, setError] = useState('');
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
  const [currentVendorIndex, setCurrentVendorIndex] = useState(0);
  const [offerFade] = useState(new Animated.Value(1));

const loadData = async () => {
  const now = new Date();

  try {
    setLoading(true);
    setError('');

    const summaryRes = await apiRequest('/api/loyalty/summary', 'GET', null, token, 3);
    setSummary(summaryRes);

    const offersRes = await apiRequest('/api/offers', 'GET', null, token, 3);

    const today = new Date();

   const validOffers = (offersRes.offers || []).filter(offer => {
  const from = offer.validFrom ? new Date(offer.validFrom) : new Date(0);
  const to = offer.validTo ? new Date(offer.validTo) : new Date('2100-01-01');
  return from <= now && now <= to;
});


    setOffers(validOffers);
  } catch (err) {
    setError(err.message || 'Failed to load data');
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  loadData();  // ✅ Now it exists
}, []);



  

  // Auto-rotate offers if there are multiple
  useEffect(() => {
    if (offers.length > 1) {
      const interval = setInterval(() => {
        Animated.sequence([
          Animated.timing(offerFade, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(offerFade, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();

        setCurrentOfferIndex((prev) => (prev + 1) % offers.length);
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [offers.length]);

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
    .slice(0, 10);

  const handlePrevVendor = () => {
    setCurrentVendorIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNextVendor = () => {
    setCurrentVendorIndex((prev) =>
      (prev < mostVisited.length - 1 ? prev + 1 : prev)
    );
  };

  const currentVendor = mostVisited[currentVendorIndex];
  const currentOffer = offers[currentOfferIndex];

  return (
    
    <View style={{ flex: 1, backgroundColor: '#fff7e6' }}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
    
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greeting}>Hi, {user?.fullName || 'Foodie'}!</Text>
        <Text style={styles.subtitle}>Your Panipuri Loyalty Dashboard</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Single Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Plates Paid</Text>
              <Text style={styles.summaryValue}>{totalPlates - totalFreePlates}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Free Plates</Text>
              <Text style={styles.summaryValue}>{totalFreePlates}</Text>
            </View>
          </View>
        </View>

        {/* Today's Special Offers */}
        <Text style={styles.sectionTitle}>Today's Special Offers</Text>
        {offers.length === 0 ? (
          <View style={styles.offerCard}>
            <Text style={styles.offerTitle}>Stay Tuned!</Text>
            <Text style={styles.offerText}>
              New exciting offers coming soon!
            </Text>
          </View>
        ) : (
          <Animated.View style={[styles.offerCard, { opacity: offerFade }]}>
            <Text style={styles.offerTitle}>{currentOffer?.title || 'Special Offer'}</Text>
            <Text style={styles.offerText}>
              {currentOffer?.description || 'Check back for amazing deals!'}
            </Text>
            {currentOffer?.code && (
              <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>Use Code:</Text>
                <Text style={styles.codeText}>{currentOffer.code}</Text>
              </View>
            )}
            {offers.length > 1 && (
              <View style={styles.offerDots}>
                {offers.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      index === currentOfferIndex && styles.activeDot,
                    ]}
                  />
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {/* Loyalty Progress Carousel */}
        <Text style={styles.sectionTitle}>Your Loyalty Progress</Text>
        {mostVisited.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.noData}>
              Start your journey! Visit a stall to track your progress.
            </Text>
          </View>
        ) : (
          <View style={styles.carouselContainer}>
            <TouchableOpacity
              style={[
                styles.navButton,
                currentVendorIndex === 0 && styles.navButtonDisabled,
              ]}
              onPress={handlePrevVendor}
              disabled={currentVendorIndex === 0}
            >
              <ChevronLeft
                size={24}
                color={currentVendorIndex === 0 ? '#ccc' : '#ff8a00'}
              />
            </TouchableOpacity>

            <View style={styles.vendorCardContainer}>
              <View style={styles.vendorCard}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{currentVendorIndex + 1}</Text>
                </View>
                <Text style={styles.vendorName}>{currentVendor?.vendorName}</Text>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${(currentVendor?.currentPlateCount / 5) * 100}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {currentVendor?.currentPlateCount}/5 plates
                  </Text>
                </View>
                <Text style={styles.progressDetail}>
                  {currentVendor?.platesNeededForNextFree} more for your FREE plate!
                </Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statItemValue}>{currentVendor?.totalPlatesWithVendor}</Text>
                    <Text style={styles.statItemLabel}>Total Plates</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statItemValue}>{currentVendor?.totalFreePlatesWithVendor}</Text>
                    <Text style={styles.statItemLabel}>Free Earned</Text>
                  </View>
                </View>
                <Text style={styles.lastVisit}>
                  Last visit: {formatDate(currentVendor?.lastVisitedAt)}
                </Text>
              </View>
              <View style={styles.carouselDots}>
                {mostVisited.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      index === currentVendorIndex && styles.activeDot,
                    ]}
                  />
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.navButton,
                currentVendorIndex === mostVisited.length - 1 && styles.navButtonDisabled,
              ]}
              onPress={handleNextVendor}
              disabled={currentVendorIndex === mostVisited.length - 1}
            >
              <ChevronRight
                size={24}
                color={currentVendorIndex === mostVisited.length - 1 ? '#ccc' : '#ff8a00'}
              />
            </TouchableOpacity>
          </View>
        )}



        <View style={{ height: 40 }} />
      </ScrollView>
       </KeyboardAvoidingView>

    {/* ✅ ✅ STICKY BUTTON — ALWAYS VISIBLE */}
    <TouchableOpacity
      style={styles.stickyFindButton}
      onPress={() => navigation.navigate('Vendors')}
      activeOpacity={0.9}
    >
      <Text style={styles.findNearMeText}>Find Panipuri Near Me</Text>
    </TouchableOpacity>

  </View>
);


};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#fff7e6',
    padding: 16,
    paddingTop: 40,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff7e6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ff8a00'
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ff8a00'
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 10
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 10
  },
  summaryCard: {
    backgroundColor: '#ffe2b8',
    padding: 24,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#ffd9a3',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryDivider: {
    width: 2,
    height: 50,
    backgroundColor: '#ffd9a3',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#777',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ff6f00',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ff8a00',
    marginBottom: 12,
  },
 offerCard: {
  backgroundColor: '#fff',
  padding: 16,
  borderRadius: 18,
  marginBottom: 18,
  alignItems: 'center',
  borderWidth: 1.5,
  borderColor: '#ff8a00',
  borderLeftWidth: 6,
  borderLeftColor: '#ff6f00',
  minHeight: 100,
  justifyContent: 'center',
},

  offerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ff6f00',
    marginBottom: 8,
  },
  offerText: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    marginBottom: 10,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 8,
  },
  codeLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  codeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff6f00',
  },
  offerDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffd9a3',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#ff6f00',
    width: 24,
  },
  emptyCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ffd9a3',
    alignItems: 'center',
    marginBottom: 24,
  },
  noData: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
  carouselContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  navButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  vendorCardContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  vendorCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ffd9a3',
    minHeight: 240,
  },
  rankBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#ff8a00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  rankText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  vendorName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    paddingRight: 50,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ff8a00',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: '#ff6f00',
    fontWeight: '600',
  },
  progressDetail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statItemValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ff8a00',
  },
  statItemLabel: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  lastVisit: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  findNearMeButton: {
    backgroundColor: '#ff8a00',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#ff8a00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  findNearMeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  stickyFindButton: {
  position: 'absolute',
  bottom: 16,
  left: 16,
  right: 16,
  backgroundColor: '#ff8a00',
  padding: 16,
  borderRadius: 16,
  alignItems: 'center',
  elevation: 8,
},

});

export default CustomerHomeScreen;
