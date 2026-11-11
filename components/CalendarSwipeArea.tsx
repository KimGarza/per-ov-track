import { useMemo, type ReactNode } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
export function CalendarSwipeArea({ children, onPrevious, onNext }: { children: ReactNode; onPrevious: () => void; onNext: () => void }) {
  const gesture = useMemo(() => Gesture.Pan()
    .activeOffsetX([-24, 24])
    .failOffsetY([-18, 18])
    .runOnJS(true)
    .onEnd(event => {
      if (Math.abs(event.translationX) < 55 || Math.abs(event.translationX) < Math.abs(event.translationY) * 1.5) return;
      if (event.translationX > 0) onPrevious();
      else onNext();
    }), [onPrevious, onNext]);
  return <GestureDetector gesture={gesture}>{children}</GestureDetector>;
}
