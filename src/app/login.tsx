import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/auth';
import { auth } from '../firebaseConfig';

const BRAND = 'DariImmo'; // badlou b 'ImmoPlus' ken t7eb
const PRIMARY = '#003B95';
const DARK = '#1A202C';
const GREY = '#718096';

function messageFor(code?: string) {
  switch ((code ?? '').replace('auth/', '')) {
    case 'email-not-verified':
      return "Votre email n'est pas encore vérifié. Cliquez sur le lien reçu par email (vérifiez aussi vos spams).";
    case 'invalid-email':
      return 'Adresse email invalide.';
    case 'user-not-found':
    case 'wrong-password':
    case 'invalid-credential':
      return 'Email ou mot de passe incorrect.';
    case 'network-request-failed':
      return 'Pas de connexion internet.';
    case 'too-many-requests':
      return 'Trop de tentatives. Réessayez plus tard.';
    default:
      return `Une erreur est survenue (${code ?? 'inconnue'}).`;
  }
}

type FieldErrors = { email?: string; password?: string };

export default function LoginScreen() {
  const { login, resendVerification } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [obscure, setObscure] = useState(true);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const validate = () => {
    const errs: FieldErrors = {};
    if (!email.includes('@')) errs.email = 'Email invalide';
    if (password.length < 6) errs.password = '6 caractères minimum';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError(null);
    setNeedsVerification(false);
    try {
      await login(email, password);
      goBack();
    } catch (e: any) {
      setError(messageFor(e?.code));
      setNeedsVerification(e?.code === 'auth/email-not-verified');
    } finally {
      setLoading(false);
    }
  };

  // N3awdou nab3thou el email de vérification
  const resend = async () => {
    setResending(true);
    try {
      const result = await resendVerification(email, password);
      Alert.alert(
        result === 'sent' ? 'Email envoyé' : 'Email déjà vérifié',
        result === 'sent'
          ? 'Un nouveau lien de vérification a été envoyé. Vérifiez aussi vos spams.'
          : 'Votre email est déjà vérifié. Vous pouvez vous connecter.'
      );
      if (result === 'already') {
        setError(null);
        setNeedsVerification(false);
      }
    } catch (e: any) {
      setError(messageFor(e?.code));
    } finally {
      setResending(false);
    }
  };

  const openForgot = () => {
    setForgotEmail(email.trim());
    setForgotVisible(true);
  };

  const sendReset = async () => {
    const mail = forgotEmail.trim();
    if (!mail) return;
    setForgotVisible(false);
    try {
      auth.languageCode = 'fr';
      await sendPasswordResetEmail(auth, mail);
      Alert.alert(
        'Email envoyé',
        'Si ce compte existe, un email a été envoyé. Vérifiez aussi vos spams.'
      );
    } catch (e: any) {
      setError(messageFor(e?.code));
    }
  };

  const onGoogle = () => {
    Alert.alert('Bientôt', 'Connexion Google bech tتzed ba3d (tطlob dev build).');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appBar}>
        <TouchableOpacity onPress={goBack} hitSlop={10}>
          <Ionicons name="close" size={26} color={DARK} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Ionicons name="home" size={56} color={PRIMARY} />
            <Text style={styles.brand}>{BRAND}</Text>
            <Text style={styles.subtitle}>Se connecter</Text>
          </View>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder="exemple@mail.com"
              placeholderTextColor="#A0AEC0"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>
          {!!fieldErrors.email && <Text style={styles.fieldError}>{fieldErrors.email}</Text>}

          <Text style={styles.label}>Mot de passe</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#A0AEC0"
              secureTextEntry={obscure}
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setObscure(!obscure)}>
              <Ionicons name={obscure ? 'eye-outline' : 'eye-off-outline'} size={20} color={GREY} />
            </TouchableOpacity>
          </View>
          {!!fieldErrors.password && <Text style={styles.fieldError}>{fieldErrors.password}</Text>}

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRemember(!remember)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                {remember && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.rememberText}>Se souvenir de moi</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={openForgot}>
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          {needsVerification && (
            <TouchableOpacity style={styles.resendBtn} onPress={resend} disabled={resending}>
              {resending ? (
                <ActivityIndicator color={PRIMARY} size="small" />
              ) : (
                <Text style={styles.resendText}>Renvoyer l'email de vérification</Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={submit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleButton} onPress={onGoogle} activeOpacity={0.8}>
            <Ionicons name="logo-google" size={20} color="#EA4335" style={{ marginRight: 10 }} />
            <Text style={styles.googleText}>Continuer avec Google</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => router.replace('/register')}>
              <Text style={styles.footerLink}>S’inscrire</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Dialog: Mot de passe oublié */}
      <Modal
        visible={forgotVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setForgotVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Mot de passe oublié</Text>
            <Text style={styles.modalText}>
              Entrez votre email. Nous vous enverrons un lien pour créer un nouveau mot de passe.
            </Text>
            <View style={[styles.inputBox, { marginTop: 12 }]}>
              <TextInput
                style={styles.input}
                placeholder="exemple@mail.com"
                placeholderTextColor="#A0AEC0"
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
                value={forgotEmail}
                onChangeText={setForgotEmail}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setForgotVisible(false)}>
                <Text style={styles.modalBtn}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={sendReset}>
                <Text style={styles.modalBtn}>Envoyer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  appBar: { height: 48, justifyContent: 'center', paddingHorizontal: 16 },
  scroll: { paddingHorizontal: 24, paddingBottom: 24 },
  header: { alignItems: 'center', marginTop: 8, marginBottom: 32 },
  brand: { fontSize: 26, fontWeight: '800', color: PRIMARY, marginTop: 8 },
  subtitle: { fontSize: 14, color: GREY, marginTop: 4 },
  label: { fontSize: 14, fontWeight: '600', color: DARK, marginBottom: 6, marginTop: 16 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  input: { flex: 1, fontSize: 15, color: '#2D3748' },
  fieldError: { color: '#E53E3E', fontSize: 12, marginTop: 4 },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  rememberText: { fontSize: 13, color: '#4A5568' },
  forgotText: { fontSize: 13, color: PRIMARY },
  error: { color: '#E53E3E', marginTop: 12, lineHeight: 20 },
  resendBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 6,
  },
  resendText: { color: PRIMARY, fontWeight: '700', textDecorationLine: 'underline' },
  button: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { marginHorizontal: 12, color: GREY },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  googleText: { fontSize: 15, fontWeight: '600', color: DARK },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: { color: GREY, fontSize: 14 },
  footerLink: { color: PRIMARY, fontSize: 14, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: DARK, marginBottom: 8 },
  modalText: { fontSize: 14, color: '#4A5568' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 24,
    marginTop: 16,
  },
  modalBtn: { fontSize: 15, fontWeight: '600', color: PRIMARY },
});