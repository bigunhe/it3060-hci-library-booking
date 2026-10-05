import type AsyncStorage from '@react-native-async-storage/async-storage';
import 'firebase/auth';
import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(
    storage: typeof AsyncStorage
  ): Persistence;
}
