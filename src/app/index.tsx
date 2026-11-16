import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomNav from '../components/BottomNav';
import ListingCard from '../components/ListingCard';
import { useAuth } from '../context/auth';
import { db } from '../firebaseConfig';
import { startConversation } from '../services/chat';
import { toggleFavorite, useFavoriteIds } from '../services/favorites';
import { useListings } from '../services/listings';
import type { Listing } from '../utils/listing';
import { showToast } from '../utils/toast';

const PRIMARY = '#003B95';
const GREY = '#718096';

type Filter = 'all' | 'vente' | 'location';

// minuscules + sans accents: "marsa" yلقa "La Marsa"
const normalize = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Bonjour (sbe7 / nhar) w Bonsoir (mel 18h) + icône, w yetbaddel wa7dou
function useGreeting() {
  const compute = () => {
    const h = new Date().getHours();
    return h >= 5 && h < 18
      ? { word: 'Bonjour', icon: '☀️' }
      : { word: 'Bonsoir', icon: '🌙' };
  };
  const [greeting, setGreeting] = useState(compute);

  useEffect(() => {
    const timer = setInterval(() => setGreeting(compute()), 60000);
    return () => clearInterval(timer);
  }, []);

  return greeting;
}

export default function AccueilScreen() {
  const { isLoggedIn, user, userName } = useAuth();
  const { listings, loading, error } = useListings();
  const { ids: favoriteIds } = useFavoriteIds();
  const greeting = useGreeting();

  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [contactingListingId, setContactingListingId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{
    name?: string;
    avatarBase64?: string;
    avatarUrl?: string;
  } | null>(null);

  // Profil (esm + sourat) live mel Firestore
  useEffect(() => {
    if (!user?.uid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfile(null);
      return;
    }
    const unsub = onSnapshot(
      doc(db, 'profiles', user.uid),
      (snap) => setProfile((snap.data() as any) ?? null),
      () => {}
    );
    return unsub;
  }, [user?.uid]);

  const avatarUri = profile?.avatarBase64
    ? `data:image/jpeg;base64,${profile.avatarBase64}`
    : profile?.avatarUrl || user?.photoURL || null;

  const fullName = profile?.name?.trim() || userName;
  const firstName = isLoggedIn ? fullName.trim().split(' ')[0] : '';

  // Filtre (Tous / Vente / Location) + recherche
  const items = useMemo(() => {
    const q = normalize(query.trim());
    return listings.filter((l) => {
      if (filter !== 'all' && l.transaction !== filter) return false;
      if (!q) return true;
      return normalize(`${l.title} ${l.city} ${l.address}`).includes(q);
    });
  }, [listings, filter, query]);

  const reset = () => {
    setFilter('all');
    setQuery('');
  };

  const onToggleFavorite = async (l: Listing) => {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      const isFavorite = await toggleFavorite(user.uid, l.id);
      showToast(isFavorite ? 'Ajouté aux favoris ❤️' : 'Retiré des favoris.');
    } catch {
      showToast('Action impossible. Vérifiez votre connexion.');
    }
  };

  const onContactSeller = async (listing: Listing) => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (listing.ownerId === user.uid) {
      router.push('/messages');
      return;
    }
    if (contactingListingId) return;

    setContactingListingId(listing.id);
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
        ? 'Firestore refuse la création de la conversation. Vérifiez et déployez les règles de messagerie.'
        : contactError instanceof Error
          ? `Impossible de contacter le vendeur : ${contactError.message}`
          : 'Impossible de contacter le vendeur. Vérifiez votre connexion.';
      Alert.alert('Contact vendeur', message);
    } finally {
      setContactingListingId(null);
    }
  };

  const chip = (value: Filter, label: string) => {
    const active = filter === value;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.chip, active && styles.chipActive]}
        activeOpacity={0.85}
        onPress={() => setFilter(value)}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const header = (
    <View style={{ paddingBottom: 14 }}>
      {/* Salutation + avatar */}
      <View style={styles.topRow}>
        <View style={styles.logo}>
          <Ionicons name="home" size={18} color="#123B70" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {greeting.word}
            {firstName ? `, ${firstName}` : ''} {greeting.icon}
          </Text>
          <Text style={styles.subtitle}>Trouvez votre prochaine maison</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push(isLoggedIn ? '/profil' : '/login')}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Ionicons name="person" size={22} color={PRIMARY} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Recherche */}
      <View style={styles.search}>
        <Ionicons name="search" size={22} color="#1A202C" />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une ville, un quartier..."
          placeholderTextColor="#9AA3B2"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={10}>
            <Ionicons name="close" size={20} color="#1A202C" />
          </TouchableOpacity>
        )}
      </View>

      {/* Chips */}
      <View style={styles.chips}>
        {chip('all', 'Tous')}
        {chip('vente', 'Vente')}
        {chip('location', 'Location')}
      </View>

      {/* Titre de section */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Les dernières annonces</Text>
        <TouchableOpacity onPress={reset}>
          <Text style={styles.sectionAction}>Voir tout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const empty = loading ? (
    <View style={styles.emptyBox}>
      <ActivityIndicator color={PRIMARY} />
    </View>
  ) : error ? (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyText}>Impossible de charger les annonces.{'\n'}{error}</Text>
    </View>
  ) : (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyText}>
        {listings.length === 0
          ? 'Aucune annonce pour le moment.'
          : 'Aucune annonce ne correspond à votre recherche.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={loading || error ? [] : items}
        keyExtractor={(l) => l.id}
        renderItem={({ item }) => (
        <ListingCard
          listing={item}
          onPress={() => router.push(`/listing/${item.id}` as any)}
          onContact={() => onContactSeller(item)}
          contacting={contactingListingId === item.id}
          isFavorite={favoriteIds.has(item.id)}
          onToggleFavorite={() => onToggleFavorite(item)}
        />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />

      <BottomNav active="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8FC' },
  list: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },

  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: { fontSize: 22, fontWeight: '800', color: PRIMARY },
  subtitle: { fontSize: 14, color: GREY, marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginLeft: 12 },
  avatarFallback: {
    backgroundColor: '#E6EEF9',
    borderWidth: 1.5,
    borderColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 54,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1A202C', marginLeft: 12, paddingVertical: 0 },

  chips: { flexDirection: 'row', gap: 10, marginTop: 16 },
  chip: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
  },
  chipActive: { backgroundColor: PRIMARY, elevation: 0, shadowOpacity: 0 },
  chipText: { fontSize: 15, fontWeight: '700', color: PRIMARY },
  chipTextActive: { color: '#FFFFFF' },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: PRIMARY },
  sectionAction: { fontSize: 14, fontWeight: '600', color: PRIMARY },

  emptyBox: { paddingVertical: 48, paddingHorizontal: 16, alignItems: 'center' },
  emptyText: { color: GREY, textAlign: 'center' },
});