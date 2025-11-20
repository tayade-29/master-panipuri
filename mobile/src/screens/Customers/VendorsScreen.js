import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import { apiRequest } from '../../api/client';

// Haversine distance in km
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const VendorsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stalls, setStalls] = useState([]);
  const [error, setError] = useState('');

  const [useLocation, setUseLocation] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // Load stalls WITHOUT location (show everything)
  const loadAllStalls = async (opts = { refresh: false }) => {
    try {
      if (opts.refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      setUseLocation(false);
      setUserLocation(null);

      const res = await apiRequest('/api/stalls', 'GET');
      setStalls(res.stalls || []);
    } catch (err) {
      console.log('loadAllStalls error:', err);
      setError(err.message || 'Failed to load stalls');
      setStalls([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load stalls NEAR current location
  const loadStallsNearMe = async (opts = { refresh: false }) => {
    try {
      if (opts.refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      // 1) ask for permission
      const { status } =
        await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError(
          'Location permission denied. Showing all stalls instead.'
        );
        setUseLocation(false);
        await loadAllStalls({ refresh: true });
        return;
      }

      // 2) get location
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userLat = loc.coords.latitude;
      const userLng = loc.coords.longitude;
      setUserLocation({ lat: userLat, lng: userLng });
      setUseLocation(true);

      // 3) call backend with lat/lng
      const res = await apiRequest(
        `/api/stalls?lat=${userLat}&lng=${userLng}&radius=3000`,
        'GET'
      );

      let stallsWithDistance = (res.stalls || []).map((s) => {
        let distanceKm = null;
        if (s.location && s.location.coordinates) {
          const [stallLng, stallLat] = s.location.coordinates;
          distanceKm = getDistanceKm(userLat, userLng, stallLat, stallLng);
        }
        return { ...s, distanceKm };
      });

      // sort by distance
      stallsWithDistance.sort((a, b) => {
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });

      setStalls(stallsWithDistance);
    } catch (err) {
      console.log('loadStallsNearMe error:', err);
      setError(err.message || 'Failed to load nearby stalls');
      setStalls([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load: show all stalls (no location filter)
  useEffect(() => {
    loadAllStalls();
  }, []);

  const onRefresh = () => {
    if (useLocation) {
      loadStallsNearMe({ refresh: true });
    } else {
      loadAllStalls({ refresh: true });
    }
  };

  const renderItem = ({ item }) => {
    const vendorName = item.vendor?.fullName || 'Vendor';
    const price = item.pricePerPlate
      ? `₹${item.pricePerPlate}/plate`
      : 'Price N/A';
    const tags =
      item.tags && item.tags.length ? item.tags.join(', ') : 'No tags';

    let distanceText = '';
    if (useLocation && item.distanceKm != null) {
      if (item.distanceKm < 1) {
        distanceText = `${Math.round(item.distanceKm * 1000)} m away`;
      } else {
        distanceText = `${item.distanceKm.toFixed(1)} km away`;
      }
    }

    return (
      <View style={styles.card}>
        <Text style={styles.stallName}>{item.name}</Text>
        <Text style={styles.vendorName}>By {vendorName}</Text>

        {item.address ? (
          <Text style={styles.address}>{item.address}</Text>
        ) : null}

        <Text style={styles.info}>{price}</Text>
        <Text style={styles.info}>Tags: {tags}</Text>
        {distanceText ? (
          <Text style={styles.distance}>{distanceText}</Text>
        ) : null}

        <View style={styles.actionsRow}>
          <TouchableOpacity
  style={styles.button}
  onPress={() => navigation.navigate('Payment', { stall: item })}
>
  <Text style={styles.buttonText}>Pay</Text>
</TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.buttonOutline]}>
            <Text style={[styles.buttonText, styles.buttonTextOutline]}>
              Visit
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading stalls...</Text>
      </View>
    );
  }

  const noStallsText = useLocation
    ? 'No stalls found near your location.'
    : 'No stalls found. Vendors may not have set up stalls yet.';

  return (
    <View style={styles.container}>
      {/* Top bar: mode & buttons */}
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.modeText}>
            {useLocation
              ? 'Showing stalls near your location'
              : 'Showing all open stalls'}
          </Text>
          {userLocation && useLocation ? (
            <Text style={styles.coordText}>
              lat {userLocation.lat.toFixed(4)}, lng{' '}
              {userLocation.lng.toFixed(4)}
            </Text>
          ) : null}
        </View>
        <View style={styles.buttonsRight}>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={loadAllStalls}
          >
            <Text style={styles.smallButtonText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={loadStallsNearMe}
          >
            <Text style={styles.smallButtonText}>Near Me</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {stalls.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.noData}>{noStallsText}</Text>
          <TouchableOpacity style={styles.reloadBtn} onPress={onRefresh}>
            <Text style={styles.reloadText}>Reload</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={stalls}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
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
  topRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  modeText: {
    fontSize: 13,
    color: '#555',
  },
  coordText: {
    fontSize: 11,
    color: '#777',
  },
  buttonsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ff8a00',
    marginLeft: 6,
  },
  smallButtonText: {
    fontSize: 12,
    color: '#ff8a00',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffd9a3',
    marginBottom: 12,
  },
  stallName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ff8a00',
  },
  vendorName: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: '#444',
    marginBottom: 4,
  },
  info: {
    fontSize: 13,
    color: '#555',
  },
  distance: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#ff8a00',
  },
  buttonOutline: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff8a00',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonTextOutline: {
    color: '#ff8a00',
  },
  error: {
    color: 'red',
    marginBottom: 8,
  },
  noData: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    marginBottom: 8,
  },
  reloadBtn: {
    marginTop: 8,
    paddingVertical: 10,
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

export default VendorsScreen;
