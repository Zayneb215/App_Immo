import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/auth';
import { auth } from '../firebaseConfig';

const PRIMARY = '#003B95';
const DARK = '#1A202C';
const GREY = '#718096';

// = VerifyEmailScreen mta3 Flutter
export default function VerifyEmailScreen() {
  type VerifyEmailAuthContext = {
    user: any;
    loading: boolean;
    checkVerified: () => Promise<boolean>;
    sendVerification: () => Promise<void>;
    logout: () => Promise<void>;
  };

  const authContext = useAuth() as unknown as VerifyEmailAuthContext;
  const { user, loading, checkVerified, sendVerification, logout } = authContext;

  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const email = auth.currentUser?.email ?? user?.email ?? '';

  // Kol 3 secondes nchoufou ken el user 3mal klik 3la el lien
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        if (await checkVerified()) router.replace('/');
      } catch {}
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Déjà vérifié → l'accueil. Mouch connecté bel marra → login.
  useEffect(() => {
    if (loading) return;
    if (user) router.replace('/');
    else if (!auth.currentUser) router.replace('/login');
  }, [user, loading]);

  // Compte à rebours mta3 "Renvoyer l'email"
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const onCheck = async () => {
    setChecking(true);
    setMessage(null);
    try {
      if (await checkVerified()) {
        router.replace('/');
      } else {
        setMessage('Email pas encore vérifié. Ouvrez le lien reçu, puis réessayez.');
      }
    } catch {
      setMessage('Vérification impossible. Vérifiez votre connexion.');
    } finally {
      setChecking(false);
    }
  };

  const resend = async () => {
    if (sending || cooldown > 0) return;
    setSending(true);
    setMessage(null);
    try {
      await sendVerification();
      setMessage('Email envoyé. Vérifiez aussi vos spams.');
      setCooldown(60);
    } catch (e: any) {
      setMessage(
        e?.code === 'auth/too-many-requests'
          ? 'Trop de demandes. Réessayez dans quelques minutes.'
          : `Envoi impossible (${e?.code ?? 'erreur'}).`
      );
    } finally {
      setSending(false);
    }
  };

  const useOtherEmail = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => router.replace('/')} hitSlop={10}>
          <Ionicons name="close" size={26} color={DARK} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Ionicons name="mail-unread-outline" size={80} color={PRIMARY} />
        <Text style={styles.title}>Vérifiez votre email</Text>
        <Text style={styles.text}>
          Nous avons envoyé un lien de confirmation à{'\n'}
          {email}
          {'\n\n'}Cliquez sur le lien, puis revenez ici.
        </Text>

        <TouchableOpacity
          style={[styles.button, checking && { opacity: 0.7 }]}
          activeOpacity={0.85}
          onPress={onCheck}
          disabled={checking}
        >
          {checking ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>J’ai vérifié mon email</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.textBtn}
          onPress={resend}
          disabled={sending || cooldown > 0}
        >
          <Text style={[styles.textBtnLabel, (sending || cooldown > 0) && { opacity: 0.5 }]}>
            {cooldown > 0 ? `Renvoyer l’email (${cooldown} s)` : 'Renvoyer l’email'}
          </Text>
        </TouchableOpacity>

        {!!message && <Text style={styles.message}>{message}</Text>}

        <TouchableOpacity style={[styles.textBtn, { marginTop: 16 }]} onPress={useOtherEmail}>
          <Text style={[styles.textBtnLabel, { color: GREY, fontWeight: '500' }]}>
            Utiliser un autre email
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  appBar: { height: 48, justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 16 },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
  title: { fontSize: 24, fontWeight: '800', color: DARK, marginTop: 24 },
  text: { fontSize: 15, lineHeight: 22, color: GREY, textAlign: 'center', marginTop: 12 },
  button: {
    alignSelf: 'stretch',
    height: 52,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  textBtn: { marginTop: 8, padding: 10 },
  textBtnLabel: { color: PRIMARY, fontSize: 15, fontWeight: '600' },
  message: { color: PRIMARY, textAlign: 'center', marginTop: 8 },
});