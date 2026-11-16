import { Stack } from 'expo-router';
import React from 'react';
import { AuthProvider } from '../context/auth';

export const unstable_settings = { initialRouteName: 'index' };

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="explore" />
        <Stack.Screen name="login" options={{ presentation: 'modal' }} />
        <Stack.Screen name="register" options={{ presentation: 'modal' }} />
        <Stack.Screen name="profil" />
        <Stack.Screen name="favoris"  />
        <Stack.Screen name="messages" />
        <Stack.Screen name="ajouter-annonce" />
        <Stack.Screen name="mes-annonces" />
        <Stack.Screen name="parametres" />
        <Stack.Screen name="carte" />

      </Stack>
    </AuthProvider>
  );
}
      