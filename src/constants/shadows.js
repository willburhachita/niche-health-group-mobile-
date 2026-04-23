import { Platform } from 'react-native';

const ios = {
  subtle: { shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  medium: { shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
  strong: { shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24 },
};

const android = {
  subtle: { elevation: 1 },
  medium: { elevation: 5 },
  strong: { elevation: 12 },
};

export const shadows = Platform.OS === 'ios' ? ios : android;
