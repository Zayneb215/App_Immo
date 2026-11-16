import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DARK = '#1A202C';

type Props = {
  title: string;
  fallback?: string; // win yarja3 ken ma famech page 9bal
};

// Header sghir bel fleche retour, lel pages el fer3iya (Mes annonces, Paramètres...)
export default function ScreenHeader({ title, fallback = '/profil' }: Props) {
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback as any);
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={goBack} hitSlop={10} style={styles.side}>
        <Ionicons name="arrow-back" size={24} color={DARK} />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.side} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
    backgroundColor: '#FFFFFF',
  },
  side: { width: 40 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: DARK },
});