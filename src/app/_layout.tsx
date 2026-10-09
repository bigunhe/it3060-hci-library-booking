import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack>
    <Stack.Screen name="rooms" options={{ headerShown: false }} />
    <Stack.Screen name="booking" options={{ headerShown: false }} />
  </Stack>;
}
