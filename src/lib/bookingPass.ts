const PASS_PREFIX = 'SLIIT-LIBRARY:1:';

function validateBookingId(bookingId: string): void {
  if (!/^[A-Za-z0-9]{20}$/.test(bookingId)) {
    throw new Error('Invalid booking reference.');
  }
}

export function createPassPayload(bookingId: string): string {
  validateBookingId(bookingId);
  return `${PASS_PREFIX}${bookingId}`;
}

export function readPassPayload(payload: string): string {
  const text = payload.trim();

  if (!text.startsWith(PASS_PREFIX)) {
    throw new Error('This is not a supported library pass.');
  }

  const bookingId = text.slice(PASS_PREFIX.length);
  validateBookingId(bookingId);

  return bookingId;
}