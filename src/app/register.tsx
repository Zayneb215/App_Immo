import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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

const BRAND = 'DariImmo'; // badlou b 'ImmoPlus' ken t7eb
const PRIMARY = '#003B95';
const DARK = '#1A202C';
const GREY = '#718096';

// Email lazem ykoun b forme s7i7a (a@b.tn). El vérification 7a9i9iya tweli bel lien elli yوsel lel email.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function messageFor(code?: string) {
  switch ((code ?? '').replace('auth/', '')) {
    case 'invalid-email':
      return 'Adresse email invalide.';
    case 'email-already-in-use':
      return 'Cet email est déjà utilisé.';
    case 'weak-password':
      return 'Mot de passe trop faible (6 caractères minimum).';
    case 'network-request-failed':
      return 'Pas de connexion internet.';
    case 'too-many-requests':
      return 'Trop de tentatives. Réessayez plus tard.';
    case 'operation-not-allowed':
      return 'L’inscription par email n’est pas activée dans Firebase.';
    default:
      return `Une erreur est survenue (${code ?? 'inconnue'}).`;
  }
}

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
};

export default function RegisterScreen() {
  const { register, resendVerification } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [obscure, setObscure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Ba3d el inscription: écran "Vérifiez votre email"
  const [sent, setSent] = useState<{ email: string; ok: boolean } | null>(null);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const validate = () => {
    const errs: FieldErrors = {};
    if (name.trim().length < 2) errs.name = 'Entrez votre nom';
    if (!EMAIL_RE.test(email.trim())) errs.email = 'Email invalide';
    if (password.length < 6) errs.password = '6 caractères minimum';
    if (confirm !== password) errs.confirm = 'Les mots de passe ne correspondent pas';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError(null);
    try {
      const { emailSent } = await register(name, email, password);
      setSent({ email: email.trim(), ok: emailSent });
    } catch (e: any) {
      setError(messageFor(e?.code));
    } finally {
      setLoading(false);
    }
  };

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
      if (result === 'sent') setSent((s) => (s ? { ...s, ok: true } : s));
    } catch (e: any) {
      Alert.alert('Erreur', messageFor(e?.code));
    } finally {
      setResending(false);
    }
  };

  const onGoogle = () => {
    Alert.alert('Bientôt', 'Connexion Google bech tتzed ba3d (tطlob dev build).');
  };

  // ===== Écran "Vérifiez votre email" =====
  if (sent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.appBar}>
          <TouchableOpacity onPress={goBack} hitSlop={10}>
            <Ionicons name="close" size={26} color={DARK} />
          </TouchableOpacity>
        </View>

        <View style={styles.sentWrap}>
          <View style={styles.sentIcon}>
            <Ionicons name="mail-unread-outline" size={44} color={PRIMARY} />
          </View>
          <Text style={styles.sentTitle}>Vérifiez votre email</Text>
          <Text style={styles.sentText}>
            {sent.ok
              ? `Un lien de vérification a été envoyé à\n${sent.email}\nCliquez dessus pour activer votre compte, puis connectez-vous.`
              : `Votre compte a été créé, mais l'email de vérification n'a pas pu être envoyé à ${sent.email}. Utilisez « Renvoyer l'email » ci-dessous.`}
          </Text>
          <Text style={styles.sentHint}>Pensez à vérifier vos spams.</Text>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.85}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.buttonText}>Aller à la connexion</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resend} onPress={resend} disabled={resending}>
            {resending ? (
              <ActivityIndicator color={PRIMARY} size="small" />
            ) : (
              <Text style={styles.resendText}>Renvoyer l'email</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ===== Formulaire =====
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
            <Text style={styles.subtitle}>Créer un compte</Text>
          </View>

          <Text style={styles.label}>Nom complet</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder="Ahmed Ben Ali"
              placeholderTextColor="#A0AEC0"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />
          </View>
          {!!fieldErrors.name && <Text style={styles.fieldError}>{fieldErrors.name}</Text>}

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
          <Text style={styles.note}>
            Utilisez un email réel: un lien de vérification vous sera envoyé.
          </Text>

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

          <Text style={styles.label}>Confirmer le mot de passe</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#A0AEC0"
              secureTextEntry={obscure}
              autoCapitalize="none"
              value={confirm}
              onChangeText={setConfirm}
            />
          </View>
          {!!fieldErrors.confirm && <Text style={styles.fieldError}>{fieldErrors.confirm}</Text>}

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={submit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>S’inscrire</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={onGoogle}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-google" size={20} color="#EA4335" style={{ marginRight: 10 }} />
            <Text style={styles.googleText}>Continuer avec Google</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => router.replace('/login')}>
              <Text style={styles.footerLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  appBar: { height: 48, justifyContent: 'center', paddingHorizontal: 16 },
  scroll: { paddingHorizontal: 24, paddingBottom: 24 },
  header: { alignItems: 'center', marginTop: 8, marginBottom: 24 },
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
  note: { color: GREY, fontSize: 12, marginTop: 6 },
  error: { color: '#E53E3E', marginTop: 12 },
  button: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    alignSelf: 'stretch',
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

  sentWrap: { flex: 1, alignItems: 'center', paddingHorizontal: 32, paddingTop: 40 },
  sentIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E6EEF9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  sentTitle: { fontSize: 24, fontWeight: '800', color: DARK, marginBottom: 12 },
  sentText: { fontSize: 15, lineHeight: 23, color: '#4A5568', textAlign: 'center' },
  sentHint: { fontSize: 13, color: GREY, marginTop: 12 },
  resend: { marginTop: 20, padding: 8 },
  resendText: { color: PRIMARY, fontWeight: '700', textDecorationLine: 'underline' },
});