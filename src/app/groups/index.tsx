import { router } from 'expo-router';
import { Button, Text, View } from 'react-native';

// Route placeholder only. Assigned member replaces this screen.
export default function Screen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Saved groups</Text>
      <Text>This screen has not been implemented yet.</Text>
      <Button title="Return to rooms" onPress={() => router.replace('/rooms')} />
    </View>
  );
}
