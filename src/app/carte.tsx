import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { buildMapHtml } from '../components/mapHtml';
import ScreenHeader from '../components/ScreenHeader';

const PRIMARY = '#003B95';

// = FullscreenMapScreen mta3 Flutter
// Esti3mel: router.push({ pathname: '/carte', params: { lat: 36.8, lng: 10.18, title: 'Villa Azur' } })
export default function CarteScreen() {
  const { lat, lng, title } = useLocalSearchParams<{ lat?: string; lng?: string; title?: string }>();

  const point = useMemo(() => {
    const la = Number(lat);
    const ln = Number(lng);
    return Number.isFinite(la) && Number.isFinite(ln) && lat && lng
      ? { latitude: la, longitude: ln }
      : null;
  }, [lat, lng]);

  const [error, setError] = useState(false);

  const html = useMemo(
    () =>
      point
        ? buildMapHtml({ pick: false, center: point, zoom: 16, point, minZoom: 3, maxZoom: 19 })
        : '',
    [point]
  );

  const openMaps = async () => {
    if (!point) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${point.latitude},${point.longitude}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Erreur', "Impossible d'ouvrir l'application de cartes.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={title || 'Localisation'} fallback="/" />

      {point ? (
        <View style={{ flex: 1 }}>
          <WebView
            originWhitelist={['*']}
            source={{ html, baseUrl: 'https://dariimmo.app' }}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            onError={() => setError(true)}
            onHttpError={() => setError(true)}
            style={{ flex: 1 }}
          />

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>Impossible de charger la carte. Vérifiez votre connexion.</Text>
            </View>
          )}

          <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={openMaps}>
            <Ionicons name="navigate" size={20} color="#FFFFFF" />
            <Text style={styles.fabText}>Itinéraire</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.center}>
          <Ionicons name="location-outline" size={48} color="#CBD5E0" />
          <Text style={styles.noPoint}>Aucune position disponible pour cette annonce.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  noPoint: { color: '#718096', textAlign: 'center', marginTop: 12 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    height: 52,
    borderRadius: 26,
    elevation: 6,
  },
  fabText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginLeft: 8 },
  errorBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    padding: 10,
  },
  errorText: { color: '#E53E3E', fontSize: 13 },
});