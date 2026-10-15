import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useAppTheme } from './ThemeProvider';
export type AnchorRect = { x: number; y: number; width: number; height: number };
export function OptionPopover({ anchor, onClose, children, embedded = false }: { anchor: AnchorRect; onClose: () => void; children: ReactNode; embedded?: boolean }) {
  const { theme, styles: g } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const menuWidth = Math.min(250, width - 24);
  const rightFits = anchor.x + anchor.width + menuWidth + 8 <= width;
  const left = rightFits ? anchor.x + anchor.width + 6 : Math.max(12, Math.min(anchor.x + 10, width - menuWidth - 12));
  const top = Math.max(12, Math.min(anchor.y + anchor.height + 6, height - 310));
  const content = <View style={StyleSheet.absoluteFill} onAccessibilityEscape={onClose}>
    <Pressable accessibilityRole="button" accessibilityLabel="Dismiss options" onPress={onClose} style={StyleSheet.absoluteFill} />
    <View accessibilityViewIsModal style={[g.card, { position: 'absolute', left, top, width: menuWidth, maxHeight: Math.min(290, height - 24), padding: theme.spacing.sm, borderRadius: theme.radius.sm }]}>{children}</View>
  </View>;
  return embedded ? content : <Modal visible transparent animationType="fade" onRequestClose={onClose}>{content}</Modal>;
}
