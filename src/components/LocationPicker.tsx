import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { buildMapHtml, TUNIS_CENTER } from './mapHtml';

export type LatLng = { latitude: number; longitude: number };

const PRIMARY = '#003B95';
const GREY = '#718096';

// Ken el carte tcrashi, el formulaire yab9a yekhdem (bouton "Ma position" mazel mawjoud)
class MapBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

type Props = {
  value: LatLng | null;
  onChange: (p: LatLng) => void;
};

// = LocationPicker mta3 Flutter: touchi el carte wala "Ma position"
export default function LocationPicker({ value, onChange }: Props) {
  const ref = useRef<WebView>(null);
  const [locating, setLocating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // HTML ytsana3 marra wa7da (ma yetbaddelch ki el user y7arrek el épingle)
  const html = useMemo(
    () =>
      buildMapHtml({
        pick: true,
        center: value ?? TUNIS_CENTER,
        zoom: value ? 15 : 7,
        point: value,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const moveMarker = (p: LatLng, zoom?: number) => {
    ref.current?.injectJavaScript(
      `try { setPos(${p.latitude}, ${p.longitude}, ${zoom ?? 'null'}); } catch (e) {} true;`
    );
  };

  const set = (p: LatLng, zoom?: number) => {
    setMsg(null);
    onChange(p);
    moveMarker(p, zoom);
  };

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (data.error === 'leaflet') {
        setMapError('La carte n\'a pas pu se charger. Vérifiez votre connexion internet.');
      } else if (data.error === 'tiles') {
        setMapError('Les tuiles de la carte ne se chargent pas. Vérifiez votre connexion internet.');
      } else if (typeof data.lat === 'number' && typeof data.lng === 'number') {
        setMsg(null);
        onChange({ latitude: data.lat, longitude: data.lng });
      }
    } catch {}
  };

  const useMyLocation = async () => {
    setLocating(true);
    setMsg(null);
    try {
      if (!(await Location.hasServicesEnabledAsync())) {
        setMsg('Activez la localisation du téléphone.');
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setMsg('Permission de localisation refusée.');
        return;
      }

      let pos: Location.LocationObject | null = null;
      try {
        pos = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
        ]);
      } catch {
        pos = await Location.getLastKnownPositionAsync();
      }
      if (!pos) throw new Error('no-position');

      set({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }, 16);
    } catch {
      setMsg("Position introuvable. Touchez la carte pour placer l'épingle.");
    } finally {
      setLocating(false);
    }
  };

  const fallback = (
    <View style={styles.fallback}>
      <Ionicons name="map-outline" size={32} color="#A0AEC0" />
      <Text style={styles.fallbackText}>
        La carte est indisponible. Utilisez le bouton « Ma position ».
      </Text>
    </View>
  );

  return (
    <View>
      <View style={styles.mapWrap}>
        <MapBoundary fallback={fallback}>
          <WebView
            ref={ref}
            originWhitelist={['*']}
            source={{ html, baseUrl: 'https://dariimmo.app' }}
            javaScriptEnabled
            domStorageEnabled
            nestedScrollEnabled
            mixedContentMode="always"
            onMessage={onMessage}
            onError={() => setMapError('Impossible de charger la carte. Vérifiez votre connexion internet.')}
            onHttpError={() => setMapError('Impossible de charger la carte. Vérifiez votre connexion internet.')}
            style={styles.map}
          />
        </MapBoundary>

        <TouchableOpacity
          style={[styles.myPos, locating && { opacity: 0.8 }]}
          activeOpacity={0.85}
          onPress={useMyLocation}
          disabled={locating}
        >
          {locating ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="locate" size={18} color="#FFFFFF" />
          )}
          <Text style={styles.myPosText}>Ma position</Text>
        </TouchableOpacity>

        {!!mapError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{mapError}</Text>
          </View>
        )}
      </View>

      <Text style={[styles.hint, { color: value ? PRIMARY : GREY }]}>
        {value
          ? `Position choisie ✅  ${value.latitude.toFixed(5)}, ${value.longitude.toFixed(5)}`
          : "Touchez la carte pour placer l'épingle (zoomez pour plus de précision)."}
      </Text>

      {!!msg && <Text style={styles.msg}>{msg}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrap: { height: 260, borderRadius: 20, overflow: 'hidden', backgroundColor: '#E5F1F5' },
  map: { flex: 1, backgroundColor: 'transparent' },
  fallback: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  fallbackText: { color: GREY, textAlign: 'center', marginTop: 8, fontSize: 13 },
  myPos: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 12,
    elevation: 3,
  },
  myPosText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', marginLeft: 8 },
  errorBanner: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    padding: 10,
  },
  errorBannerText: { color: '#E53E3E', fontSize: 12 },
  hint: { fontSize: 13, marginTop: 8 },
  msg: { color: '#E53E3E', fontSize: 13, marginTop: 4 },
});