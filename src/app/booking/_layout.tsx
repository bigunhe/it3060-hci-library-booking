import { Stack } from 'expo-router';
import { BookingDraftProvider } from '@/features/booking/BookingDraft';

export default function BookingLayout() {
  return <BookingDraftProvider><Stack screenOptions={{ headerShown: false }} /></BookingDraftProvider>;
}
