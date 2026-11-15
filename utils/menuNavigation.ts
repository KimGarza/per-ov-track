import type { PrimaryPanel } from '@/components/PrimaryPanels';

export type MenuState = { open: boolean; pages: PrimaryPanel[] };
export type MenuAction = { type: 'open' | 'back' | 'close' | 'close-panel' } | { type: 'select' | 'navigate'; panel: PrimaryPanel };
export const initialMenuState: MenuState = { open: false, pages: [] };
export function menuReducer(state: MenuState, action: MenuAction): MenuState {
  switch (action.type) {
    case 'open': return { ...state, open: true };
    case 'close': return initialMenuState;
    case 'close-panel': return { open: true, pages: [] };
    case 'back': return state.pages.length ? { open: true, pages: state.pages.slice(0, -1) } : initialMenuState;
    case 'select': return { open: true, pages: state.pages[0] === action.panel ? [] : [action.panel] };
    case 'navigate': return { open: true, pages: [...state.pages, action.panel] };
  }
}
