import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '../context/auth';

type Tab = 'home' | 'favoris' | 'messages' | 'profil';

type Props = {
  active: Tab;
  messagesCount?: number; // badge ahmar 3la Messages (0 = mafamech)
  favDot?: boolean; // nokta zarqa 3la Favoris
};

const ACTIVE = '#2563EB';
const GREY = '#64748B';
const DARK_BLUE = '#123B70';

// Bottom bar wa7da lel pages kol. Pages Favoris / Messages / Profil
// yتفta7ou dima, w houma ybayyenou "Connexion" ken el user mouch connecté.
export default function BottomNav({ active, messagesCount = 0, favDot = false }: Props) {
  const { isLoggedIn } = useAuth();

  const go = (route: string, tab: Tab) => {
    if (tab === active) return;
    router.replace(route as any);
  };

  // Publier annonce lazem connexion
  const onAdd = () => {
    if (isLoggedIn) {
      router.push('/ajouter-annonce' as any);
    } else {
      router.push('/login');
    }
  };

  const color = (tab: Tab) => (tab === active ? ACTIVE : GREY);

  return (
    <View style={styles.bar}>
      <TouchableOpacity style={styles.item} activeOpacity={0.7} onPress={() => go('/', 'home')}>
        <Ionicons name="home-outline" size={22} color={color('home')} />
        <Text style={[styles.label, active === 'home' && styles.labelActive]}>Accueil</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        activeOpacity={0.7}
        onPress={() => go('/favoris', 'favoris')}
      >
        <View>
          <Ionicons name="heart-outline" size={22} color={color('favoris')} />
          {favDot && <View style={styles.dot} />}
        </View>
        <Text style={[styles.label, active === 'favoris' && styles.labelActive]}>Favoris</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.addButton} activeOpacity={0.9} onPress={onAdd}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        activeOpacity={0.7}
        onPress={() => go('/messages', 'messages')}
      >
        <View>
          <Ionicons name="chatbubble-outline" size={22} color={color('messages')} />
          {messagesCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{messagesCount}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.label, active === 'messages' && styles.labelActive]}>Messages</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        activeOpacity={0.7}
        onPress={() => go('/profil', 'profil')}
      >
        <Ionicons name="person-outline" size={22} color={color('profil')} />
        <Text style={[styles.label, active === 'profil' && styles.labelActive]}>Profil</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    paddingBottom: 10,
    minHeight: 64,
  },
  item: { alignItems: 'center', minWidth: 60 },
  label: { fontSize: 11, color: GREY, marginTop: 2 },
  labelActive: { color: ACTIVE, fontWeight: '700' },
  addButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: DARK_BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -28,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  dot: {
    position: 'absolute',
    top: -1,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACTIVE,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
});