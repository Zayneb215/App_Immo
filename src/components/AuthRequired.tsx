import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PRIMARY = '#003B95';
const DARK = '#1A202C';
const GREY = '#718096';

type Props = {
  title: string; // esm el page (Profil, Favoris...)
  heading?: string; // titre gras (ikhtiyari)
  description: string;
  showRegister?: boolean; // "Vous n'avez pas de compte ? S'inscrire"
  children?: React.ReactNode; // 7ajet zeyda ta7t (ex: carte Publier)
};

// Écran "Connectez-vous" elli yban ki el user mouch connecté
export default function AuthRequired({
  title,
  heading,
  description,
  showRegister = false,
  children,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>

      {!!heading && <Text style={styles.heading}>{heading}</Text>}
      <Text style={styles.desc}>{description}</Text>

      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.85}
        onPress={() => router.push('/login')}
      >
        <Text style={styles.buttonText}>Connexion</Text>
      </TouchableOpacity>

      {showRegister && (
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Vous n’avez pas de compte ? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.registerLink}>S’inscrire</Text>
          </TouchableOpacity>
        </View>
      )}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 24, paddingTop: 32 },
  title: { fontSize: 32, fontWeight: '800', color: DARK, marginBottom: 24 },
  heading: { fontSize: 20, fontWeight: '700', color: DARK, marginBottom: 8 },
  desc: { fontSize: 16, lineHeight: 24, color: GREY, marginBottom: 24 },
  button: {
    backgroundColor: PRIMARY,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  registerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  registerText: { fontSize: 15, color: GREY },
  registerLink: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    textDecorationLine: 'underline',
  },
});