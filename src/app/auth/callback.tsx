import { ActivityIndicator, Text, View } from 'react-native';
export default function AuthCallback() {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
    <ActivityIndicator />
    <Text>Finishing sign in…</Text>
  </View>;
}
