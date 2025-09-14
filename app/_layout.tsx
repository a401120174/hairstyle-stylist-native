import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContextAnonymous';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="credits-store" />
      </Stack>
    </AuthProvider>
  );
}