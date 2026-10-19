import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from './ThemeProvider';

export function EditSheet({ title, onClose, busy, footer, children, primary = false, embedded = false }: PropsWithChildren<{ title: string; onClose: () => void; busy?: boolean; footer?: ReactNode; primary?: boolean; embedded?: boolean }>) {
  const { theme, styles: g } = useAppTheme();
  const content = <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.overlay }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center', padding: theme.spacing.sm }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close editor" disabled={busy} onPress={onClose} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal onAccessibilityEscape={() => { if (!busy) onClose(); }} style={[g.card, { width: '100%', maxWidth: theme.layout.maxWidth, alignSelf: 'center', maxHeight: '95%', minHeight: primary ? '80%' : undefined, padding: theme.spacing.md }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
            <Text accessibilityRole="header" style={[g.heading, { flex: 1, fontSize: 30 }]}>{title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close editor" disabled={busy} onPress={onClose} style={g.outlineButton}><Text style={{ color: theme.colors.text, fontSize: 20 }}>×</Text></Pressable>
          </View>
          <ScrollView style={{ flexShrink: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: theme.spacing.sm }}>{children}</ScrollView>
          {footer && <View style={{ marginTop: theme.spacing.sm }}>{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>;
  return embedded ? content : <Modal visible transparent animationType="fade" onRequestClose={() => { if (!busy) onClose(); }}>{content}</Modal>;
}
