import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { useAuth } from '../../context/auth';
import { amenityByKey } from '../../constants/amenities';
import { buildMapHtml } from '../../components/mapHtml';
import { toggleFavorite, useFavoriteIds } from '../../services/favorites';
import { startConversation } from '../../services/chat';
import { useListings } from '../../services/listings';
import { formatPrice } from '../../utils/listing';
import { showToast } from '../../utils/toast';

const PRIMARY = '#003B95';
const DARK = '#1A202C';
const GREY = '#718096';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, userName } = useAuth();
  const { listings, loading, error } = useListings();
  const { ids: favoriteIds } = useFavoriteIds();
  const { width } = useWindowDimensions();
  const [activeImage, setActiveImage] = useState(0);
  const [contacting, setContacting] = useState(false);
  const [mapError, setMapError] = useState(false);

  const listing = listings.find((item) => item.id === id);
  const isFavorite = listing ? favoriteIds.has(listing.id) : false;
  const isOwner = !!user && listing?.ownerId === user.uid;
  const amenities = (listing?.amenities ?? [])
    .map((key) => amenityByKey(key))
    .filter((amenity): amenity is NonNullable<typeof amenity> => !!amenity);

  const onToggleFavorite = async () => {
    if (!listing) return;
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const added = await toggleFavorite(user.uid, listing.id);
      showToast(added ? 'Ajouté aux favoris ❤️' : 'Retiré des favoris.');
    } catch {
      showToast('Impossible de modifier les favoris. Réessayez.');
    }
  };

  const onContactSeller = async () => {
    if (!listing) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (isOwner) {
      router.push('/messages');
      return;
    }
    if (contacting) return;

    setContacting(true);
    try {
      const conversationId = await startConversation(listing, {
        uid: user.uid,
        name: userName,
      });
      router.push({ pathname: '/chat/[id]', params: { id: conversationId } });
    } catch (contactError) {
      const code =
        typeof contactError === 'object' &&
        contactError !== null &&
        'code' in contactError &&
        typeof contactError.code === 'string'
          ? contactError.code
          : '';
      const message = code === 'permission-denied'
        ? 'Firestore refuse l’accès aux conversations. Déployez les règles de messagerie du fichier FIRESTORE_MESSAGING_RULES.md.'
        : contactError instanceof Error && contactError.message === 'own-listing'
          ? 'Vous ne pouvez pas contacter votre propre annonce.'
          : contactError instanceof Error
            ? `Impossible d’ouvrir la conversation : ${contactError.message}`
            : 'Impossible d’ouvrir la conversation. Vérifiez votre connexion.';
      Alert.alert('Contact vendeur', message);
    } finally {
      setContacting(false);
    }
  };

  const getSellerPhone = () => {
    const phone = listing?.ownerPhone.replace(/[^\d+]/g, '');
    if (!phone) {
      showToast('Aucun numéro de téléphone n’est disponible.');
      return null;
    }
    return phone;
  };

  const onCallSeller = async () => {
    const phone = getSellerPhone();
    if (!phone) return;

    try {
      await Linking.openURL(`tel:${phone}`);
    } catch {
      showToast('Impossible d’ouvrir l’application téléphone.');
    }
  };

  const onCopySellerPhone = async () => {
    const phone = getSellerPhone();
    if (!phone) return;

    try {
      await Clipboard.setStringAsync(phone);
      showToast('Numéro copié.');
    } catch {
      showToast('Impossible de copier le numéro.');
    }
  };

  const onMapMessage = (event: WebViewMessageEvent) => {
    try {
      const data: unknown = JSON.parse(event.nativeEvent.data);
      if (
        typeof data === 'object' &&
        data !== null &&
        'error' in data
      ) {
        setMapError(true);
      }
    } catch {
      setMapError(true);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </SafeAreaView>
    );
  }

  if (error || !listing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.simpleHeader}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={DARK} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Ionicons name="home-outline" size={48} color="#A0AEC0" />
          <Text style={styles.missingTitle}>
            {error ? 'Impossible de charger cette annonce' : 'Annonce introuvable'}
          </Text>
          {!!error && <Text style={styles.missingDescription}>{error}</Text>}
        </View>
      </SafeAreaView>
    );
  }

  const sale = listing.transaction === 'vente';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.gallery, { width }]}>
          {listing.imageUrls.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                setActiveImage(
                  Math.round(event.nativeEvent.contentOffset.x / width)
                );
              }}
            >
              {listing.imageUrls.map((uri, index) => (
                <Image
                  key={`${uri}-${index}`}
                  source={{ uri }}
                  style={[styles.heroImage, { width }]}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.heroImage, styles.imagePlaceholder, { width }]}>
              <Ionicons name="image-outline" size={56} color="#A0AEC0" />
              <Text style={styles.placeholderText}>Aucune photo disponible</Text>
            </View>
          )}

          <View style={styles.galleryHeader}>
            <TouchableOpacity
              style={styles.roundButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
              accessibilityLabel="Retour"
            >
              <Ionicons name="arrow-back" size={22} color={DARK} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.roundButton}
              onPress={onToggleFavorite}
              activeOpacity={0.8}
              accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite ? '#E5484D' : DARK}
              />
            </TouchableOpacity>
          </View>

          <View style={[styles.transactionBadge, sale ? styles.saleBadge : styles.rentBadge]}>
            <Text style={styles.transactionBadgeText}>{sale ? 'À vendre' : 'À louer'}</Text>
          </View>

          {listing.imageUrls.length > 1 && (
            <View style={styles.imageCounter}>
              <Ionicons name="images-outline" size={14} color="#FFFFFF" />
              <Text style={styles.imageCounterText}>
                {activeImage + 1} / {listing.imageUrls.length}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(listing.price)}</Text>
            {!sale && <Text style={styles.priceSuffix}> / mois</Text>}
          </View>
          <Text style={styles.title}>{listing.title}</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={18} color={PRIMARY} />
            <Text style={styles.address}>
              {[listing.address, listing.city].filter(Boolean).join(', ') || 'Lieu non précisé'}
            </Text>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.stat}>
              <MaterialIcons name="square-foot" size={22} color={PRIMARY} />
              <Text style={styles.statValue}>{listing.surface || '—'} m²</Text>
              <Text style={styles.statLabel}>Surface</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <MaterialCommunityIcons name="bed-outline" size={23} color={PRIMARY} />
              <Text style={styles.statValue}>{listing.rooms}</Text>
              <Text style={styles.statLabel}>Chambres</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <MaterialCommunityIcons name="bathtub-outline" size={22} color={PRIMARY} />
              <Text style={styles.statValue}>{listing.bathrooms}</Text>
              <Text style={styles.statLabel}>Salles de bain</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {listing.description || 'Aucune description disponible pour cette annonce.'}
            </Text>
          </View>

          {amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Équipements</Text>
              <View style={styles.amenities}>
                {amenities.map((amenity) => (
                  <View key={amenity.key} style={styles.amenity}>
                    <MaterialIcons name={amenity.icon} size={19} color={PRIMARY} />
                    <Text style={styles.amenityText}>{amenity.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Localisation</Text>
            <View style={styles.locationCard}>
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={21} color={PRIMARY} />
              </View>
              <View style={styles.locationText}>
                <Text style={styles.locationCity}>{listing.city || 'Ville non précisée'}</Text>
                <Text style={styles.locationAddress}>
                  {listing.address || 'Adresse non précisée'}
                </Text>
              </View>
            </View>
            {Number.isFinite(listing.lat) &&
            Number.isFinite(listing.lng) &&
            listing.lat !== null &&
            listing.lng !== null &&
            listing.lat >= -90 &&
            listing.lat <= 90 &&
            listing.lng >= -180 &&
            listing.lng <= 180 ? (
              <View style={styles.mapWrap}>
                <WebView
                  originWhitelist={['*']}
                  source={{
                    html: buildMapHtml({
                      pick: false,
                      center: {
                        latitude: listing.lat,
                        longitude: listing.lng,
                      },
                      point: {
                        latitude: listing.lat,
                        longitude: listing.lng,
                      },
                      zoom: 15,
                    }),
                    baseUrl: 'https://dariimmo.app',
                  }}
                  javaScriptEnabled
                  domStorageEnabled
                  nestedScrollEnabled
                  mixedContentMode="always"
                  onMessage={onMapMessage}
                  onError={() => setMapError(true)}
                  style={styles.map}
                />
                {mapError && (
                  <View style={styles.mapError}>
                    <Ionicons name="map-outline" size={18} color={GREY} />
                    <Text style={styles.mapErrorText}>
                      Carte indisponible. Consultez l’adresse indiquée ci-dessus.
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.mapPlaceholder}>
                <Ionicons name="map-outline" size={22} color={GREY} />
                <Text style={styles.mapErrorText}>
                  La position précise n’est pas disponible pour cette annonce.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vendeur</Text>
            <View style={styles.sellerCard}>
              <View style={styles.sellerAvatar}>
                <Ionicons name="person" size={22} color={PRIMARY} />
              </View>
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>{listing.ownerName || 'Propriétaire'}</Text>
                <Text style={styles.sellerCaption}>Propriétaire du bien</Text>
              </View>
            </View>
            <View style={styles.sellerActions}>
              <TouchableOpacity
                style={[styles.sellerAction, contacting && styles.contactButtonDisabled]}
                onPress={onContactSeller}
                disabled={contacting}
                accessibilityLabel={isOwner ? 'Ouvrir mes messages' : 'Envoyer un message au vendeur'}
                accessibilityRole="button"
              >
                {contacting ? (
                  <ActivityIndicator size="small" color={PRIMARY} />
                ) : (
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color={PRIMARY} />
                )}
                <Text style={styles.sellerActionText}>{isOwner ? 'Messages' : 'Message'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sellerAction}
                onPress={onCallSeller}
                accessibilityLabel="Appeler le vendeur"
                accessibilityRole="button"
              >
                <Ionicons name="call-outline" size={20} color={PRIMARY} />
                <Text style={styles.sellerActionText}>Appeler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sellerAction}
                onPress={onCopySellerPhone}
                accessibilityLabel="Copier le numéro du vendeur"
                accessibilityRole="button"
              >
                <Ionicons name="copy-outline" size={19} color={PRIMARY} />
                <Text style={styles.sellerActionText}>Copier</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomPrice}>
          <Text style={styles.bottomPriceLabel}>Prix</Text>
          <Text style={styles.bottomPriceValue}>{formatPrice(listing.price)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.contactButton, contacting && styles.contactButtonDisabled]}
          onPress={onContactSeller}
          disabled={contacting}
          activeOpacity={0.85}
        >
          {contacting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name={isOwner ? 'chatbubbles-outline' : 'chatbubble-ellipses-outline'}
                size={19}
                color="#FFFFFF"
              />
              <Text style={styles.contactButtonText}>
                {isOwner ? 'Mes messages' : 'Contacter le vendeur'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  simpleHeader: { paddingHorizontal: 20, paddingVertical: 14 },
  missingTitle: { color: DARK, fontSize: 18, fontWeight: '700', marginTop: 16 },
  missingDescription: { color: GREY, textAlign: 'center', marginTop: 8 },
  scrollContent: { paddingBottom: 24 },
  gallery: { height: 310, backgroundColor: '#E8EDF4' },
  heroImage: { height: 310 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: GREY, marginTop: 8 },
  galleryHeader: {
    position: 'absolute',
    top: 14,
    left: 18,
    right: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roundButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  transactionBadge: {
    position: 'absolute',
    left: 20,
    bottom: 18,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  saleBadge: { backgroundColor: PRIMARY },
  rentBadge: { backgroundColor: '#2F80ED' },
  transactionBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  imageCounter: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  imageCounterText: { color: '#FFFFFF', fontSize: 12, marginLeft: 5 },
  content: { paddingHorizontal: 20, paddingTop: 22 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  price: { color: PRIMARY, fontSize: 25, fontWeight: '800' },
  priceSuffix: { color: GREY, fontSize: 14 },
  title: { color: DARK, fontSize: 21, fontWeight: '700', marginTop: 7 },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 9 },
  address: { color: GREY, fontSize: 14, marginLeft: 5, flex: 1 },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F6F8FC',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 20,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: DARK, fontSize: 15, fontWeight: '700', marginTop: 5 },
  statLabel: { color: GREY, fontSize: 11, marginTop: 3, textAlign: 'center' },
  statDivider: { width: 1, height: 44, backgroundColor: '#DDE4EE' },
  section: { marginTop: 26 },
  sectionTitle: { color: DARK, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  description: { color: '#4A5568', fontSize: 15, lineHeight: 23 },
  amenities: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  amenity: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F8FC',
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 9,
    margin: 5,
  },
  amenityText: { color: DARK, fontSize: 12, marginLeft: 7 },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F8FC',
    borderRadius: 14,
    padding: 14,
  },
  locationIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E4ECFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: { flex: 1, marginLeft: 12 },
  locationCity: { color: DARK, fontSize: 14, fontWeight: '700' },
  locationAddress: { color: GREY, fontSize: 12, marginTop: 3 },
  mapWrap: {
    height: 220,
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#E5F1F5',
  },
  map: { flex: 1, backgroundColor: 'transparent' },
  mapError: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  mapPlaceholder: {
    minHeight: 72,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F6F8FC',
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapErrorText: { color: GREY, fontSize: 13, lineHeight: 19, marginLeft: 8, flex: 1 },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F8FC',
    borderRadius: 14,
    padding: 13,
  },
  sellerActions: { flexDirection: 'row', marginTop: 10 },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E4ECFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerInfo: { flex: 1, marginLeft: 12 },
  sellerName: { color: DARK, fontSize: 14, fontWeight: '700' },
  sellerCaption: { color: GREY, fontSize: 12, marginTop: 3 },
  sellerAction: {
    flex: 1,
    minHeight: 58,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F8FC',
    marginHorizontal: 4,
    flexDirection: 'row',
  },
  sellerActionText: { color: PRIMARY, fontSize: 13, fontWeight: '700', marginLeft: 7 },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8EDF4',
  },
  bottomPrice: { flex: 1 },
  bottomPriceLabel: { color: GREY, fontSize: 11 },
  bottomPriceValue: { color: PRIMARY, fontSize: 16, fontWeight: '800', marginTop: 2 },
  contactButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtonDisabled: { opacity: 0.7 },
  contactButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginLeft: 8 },
});
