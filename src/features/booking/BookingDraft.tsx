import { createContext, useContext, useState, type ReactNode } from 'react';
import type { GroupMember } from '@/types/models';

export type BookingDraft = { bookingId: string; groupName: string; members: GroupMember[]; purpose: string };
const DraftContext = createContext<{
  draft: BookingDraft | null;
  setDraft: (draft: BookingDraft | null) => void;
} | null>(null);

// Keeps the editable roster between Group and Review without putting names in URLs.
export function BookingDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  return <DraftContext.Provider value={{ draft, setDraft }}>{children}</DraftContext.Provider>;
}
export function useBookingDraft() {
  const context = useContext(DraftContext);
  if (!context) throw new Error('BookingDraftProvider is missing.');
  return context;
}
