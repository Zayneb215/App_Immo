import { Platform, ToastAndroid } from 'react-native';

// Message sghir (kima SnackBar fi Flutter). Fi Android ken.
export function showToast(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
}