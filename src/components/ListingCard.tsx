import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { formatPrice, Listing } from '../utils/listing';

const PRIMARY = '#003B95';
const LOCATION_COLOR = '#2F80ED';
const HEART = '#E5484D';
const DARK = '#1A202C';
const GREY = '#718096';

type Props = {
  listing: Listing;
  onPress?: () => void;
  onDelete?: () => void; // yban ken fi "Mes annonces"
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onContact?: () => void;
  contacting?: boolean;
};

// Carte annonce (nafs design mta3 Flutter ListingCard)
export default function ListingCard({
  listing,
  onPress,
  onDelete,
  isFavorite,
  onToggleFavorite,
  onContact,
  contacting = false,
}: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const image = listing.imageUrls[0];
  const isVente = listing.transaction === 'vente';

  return (
    <View style={styles.shadow}>
      <View style={styles.card}>
        <TouchableOpacity activeOpacity={onPress ? 0.9 : 1} onPress={onPress} disabled={!onPress}>
          {/* Photo */}
          <View style={styles.imageWrap}>
            {image && !imgFailed ? (
              <Image
                source={{ uri: image }}
                style={styles.image}
                resizeMode="cover"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]}>
                {imgFailed && <Ionicons name="image-outline" size={32} color="#A0AEC0" />}
              </View>
            )}

            <View style={[styles.badge, { backgroundColor: isVente ? PRIMARY : LOCATION_COLOR }]}>
              <Text style={styles.badgeText}>{isVente ? 'Vente' : 'Location'}</Text>
            </View>
          </View>

          {/* Infos */}
          <View style={styles.info}>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatPrice(listing.price)}</Text>
              {!isVente && <Text style={styles.priceSuffix}> / mois</Text>}
            </View>

            <Text style={styles.title} numberOfLines={1}>
              {listing.title}
            </Text>

            {!!listing.city && (
              <View style={styles.cityRow}>
                <Ionicons name="location-outline" size={16} color={GREY} />
                <Text style={styles.city} numberOfLines={1}>
                  {listing.city}
                </Text>
              </View>
            )}

            <View style={styles.stats}>
              {listing.surface > 0 && (
                <View style={styles.stat}>
                  <MaterialIcons name="square-foot" size={20} color={DARK} />
                  <Text style={styles.statText}>{listing.surface} m²</Text>
                </View>
              )}
              <View style={styles.stat}>
                <MaterialCommunityIcons name="bed-outline" size={20} color={DARK} />
                <Text style={styles.statText}>{listing.rooms}</Text>
              </View>
              <View style={styles.stat}>
                <MaterialCommunityIcons name="bathtub-outline" size={20} color={DARK} />
                <Text style={styles.statText}>{listing.bathrooms}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {onContact && (
          <TouchableOpacity
            style={styles.contactButton}
            activeOpacity={0.85}
            onPress={onContact}
            disabled={contacting}
          >
            {contacting ? (
              <ActivityIndicator size="small" color={PRIMARY} />
            ) : (
              <>
                <Ionicons name="chatbubble-ellipses-outline" size={17} color={PRIMARY} />
                <Text style={styles.contactButtonText}>Contacter le vendeur</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Bouton rond (supprimer ken fi Mes annonces, sinon cœur) */}
        {onDelete ? (
          <TouchableOpacity style={styles.circle} activeOpacity={0.85} onPress={onDelete}>
            <Ionicons name="trash-outline" size={22} color="#D64545" />
          </TouchableOpacity>
        ) : onToggleFavorite ? (
          <TouchableOpacity style={styles.circle} activeOpacity={0.85} onPress={onToggleFavorite}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={22} color={HEART} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    marginBottom: 20,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  card: { borderRadius: 22, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  imageWrap: { width: '100%', aspectRatio: 1.6 },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { backgroundColor: '#EFEFEF', justifyContent: 'center', alignItems: 'center' },
  badge: {
    position: 'absolute',
    left: 14,
    bottom: 14,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  badgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  circle: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  info: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 18 },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
    paddingVertical: 13,
  },
  contactButtonText: { color: PRIMARY, fontSize: 14, fontWeight: '700', marginLeft: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  price: { fontSize: 20, fontWeight: '800', color: PRIMARY },
  priceSuffix: { fontSize: 13, color: GREY },
  title: { fontSize: 16, fontWeight: '700', color: PRIMARY, marginTop: 6 },
  cityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  city: { flex: 1, fontSize: 13, color: GREY, marginLeft: 4 },
  stats: { flexDirection: 'row', marginTop: 14 },
  stat: { flexDirection: 'row', alignItems: 'center', marginRight: 22 },
  statText: { fontSize: 14, fontWeight: '600', color: DARK, marginLeft: 6 },
});