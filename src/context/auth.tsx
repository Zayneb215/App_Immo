import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { auth, db } from '../firebaseConfig';

type AuthType = {
  user: User | null; // = authStateProvider mta3 Flutter
  isLoggedIn: boolean;
  loading: boolean;
  userName: string; // esm el user (wala "Invité" ken ma3andouch login)
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<{ emailSent: boolean }>;
  resendVerification: (email: string, password: string) => Promise<'sent' | 'already'>;
  logout: () => Promise<void>;
  refreshUser: () => void; // n3awdou nrasmou el esm ba3d ma yetbaddel
};

const AuthContext = createContext<AuthType>({
  user: null,
  isLoggedIn: false,
  loading: true,
  userName: 'Invité',
  login: async () => {},
  register: async () => ({ emailSent: false }),
  resendVerification: async () => 'sent',
  logout: async () => {},
  refreshUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

// Compte email/mot de passe elli el email mte3ou mazel ma tvérifach
const isUnverifiedPasswordUser = (u: User) =>
  !u.emailVerified && u.providerData.some((p) => p.providerId === 'password');

const notVerifiedError = () =>
  Object.assign(new Error('email-not-verified'), { code: 'auth/email-not-verified' });

// Nafs el collection "profiles" elli testa3melha el app Flutter
async function createProfile(user: User, name: string) {
  try {
    await setDoc(doc(db, 'profiles', user.uid), {
      name,
      email: user.email ?? '',
      phone: '',
      avatarUrl: user.photoURL ?? '',
      createdAt: serverTimestamp(),
    });
  } catch {
    // ma n9afflouch el inscription ken el profil fshel (kima fi Flutter)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setRefresh] = useState(0); // bech na3mlou re-render ba3d updateProfile

  // = FirebaseAuth.instance.authStateChanges()
  // User elli email mte3ou ma tvérifach yetعamel ka "mouch connecté"
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u && isUnverifiedPasswordUser(u) ? null : u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    try {
      await cred.user.reload(); // nجibou a7sen 7ala mta3 emailVerified
    } catch {}
    if (!cred.user.emailVerified) {
      await signOut(auth);
      throw notVerifiedError();
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const cleanName = name.trim();
    await updateProfile(cred.user, { displayName: cleanName });
    await createProfile(cred.user, cleanName);

    // Nab3thou lien de vérification, w na3mlou déconnexion: ma yodkhel 7ata ykhdem el lien
    let emailSent = true;
    try {
      auth.languageCode = 'fr';
      await sendEmailVerification(cred.user);
    } catch {
      emailSent = false;
    }
    await signOut(auth);
    return { emailSent };
  };

  // Ken el email ma wsel-ch: n3awdou nab3thou (lazem el mot de passe s7i7)
  const resendVerification = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    try {
      await cred.user.reload();
      if (cred.user.emailVerified) return 'already' as const;
      auth.languageCode = 'fr';
      await sendEmailVerification(cred.user);
      return 'sent' as const;
    } finally {
      await signOut(auth);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const refreshUser = () => setRefresh((n) => n + 1);

  // Esm el user (awwel esm): displayName, sinon el partie 9bal "@" mel email
  const userName = user
    ? (user.displayName?.trim() || user.email?.split('@')[0] || 'Utilisateur').split(' ')[0]
    : 'Invité';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        loading,
        userName,
        login,
        register,
        resendVerification,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}