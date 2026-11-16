// Google Sign-In (native) = GoogleSignIn.instance.authenticate() mta3 Flutter.
// ⚠️ Yخdem ken fi "development build" (npx expo run:android), mouch fi Expo Go.
// Ken el package mouch installé wala fi Expo Go, el bouton yوrri message w el app ma tkassarch.

// Web client ID: Firebase Console → Authentication → Sign-in method → Google → Web SDK configuration
const WEB_CLIENT_ID = 'COLLE_ICI_TON_WEB_CLIENT_ID.apps.googleusercontent.com';

let configured = false;

// Yرجa3 idToken mta3 Google, wala null ken el user a9fal el fenêtre
export async function getGoogleIdToken(): Promise<string | null> {
  let mod: any;
  try {
    mod = require('@react-native-google-signin/google-signin');
  } catch {
    throw Object.assign(new Error('google-unavailable'), { code: 'google/unavailable' });
  }

  const { GoogleSignin, isErrorWithCode, statusCodes } = mod;
  if (!GoogleSignin) {
    throw Object.assign(new Error('google-unavailable'), { code: 'google/unavailable' });
  }

  if (!configured) {
    GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
    configured = true;
  }

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (response?.type === 'cancelled') return null;

    const idToken = response?.data?.idToken ?? response?.idToken;
    if (!idToken) {
      throw Object.assign(new Error('no-id-token'), { code: 'google/no-id-token' });
    }
    return idToken as string;
  } catch (e: any) {
    if (
      isErrorWithCode?.(e) &&
      (e.code === statusCodes.SIGN_IN_CANCELLED || e.code === statusCodes.IN_PROGRESS)
    ) {
      return null;
    }
    throw e;
  }
}

export async function googleSignOut() {
  try {
    const mod = require('@react-native-google-signin/google-signin');
    await mod.GoogleSignin.signOut();
  } catch {}
}