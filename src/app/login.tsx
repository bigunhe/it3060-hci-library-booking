import { router } from 'expo-router';
import { Button, Text, View } from 'react-native';
import FoundationTest from './foundation-test';

// Temporary sign-in route. M4 replaces this file with login/profile completion.
export default function Login() {
  return (
    <View style={{ flex: 1 }}>
      <FoundationTest />
      <Text style={{ padding: 12 }}>Temporary foundation sign-in screen</Text>
      <Button title="Continue to rooms after signing in" onPress={() => router.replace('/rooms')} />
    </View>
  );
}
