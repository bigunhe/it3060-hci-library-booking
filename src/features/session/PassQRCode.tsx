import { useMemo } from 'react';
import { View } from 'react-native';
import createQRCode from 'qrcode-generator';
import { createPassPayload } from '@/lib/bookingPass';

// Real, locally generated QR. Four quiet modules surround the code for scanning.
// Native Views avoid any SVG/camera dependency or external QR service.
export function PassQRCode({ bookingId }: { bookingId: string }) {
  const rows = useMemo(() => {
    const code = createQRCode(0, 'M');
    code.addData(createPassPayload(bookingId), 'Byte');
    code.make();
    return Array.from({ length: code.getModuleCount() }, (_, row) =>
      Array.from({ length: code.getModuleCount() }, (_, column) => code.isDark(row, column)));
  }, [bookingId]);
  return <View style={{ alignItems: 'center', paddingVertical: 12 }}>
    <View accessible accessibilityLabel="Library check-in QR code" style={{ backgroundColor: '#FFFFFF', padding: 24, alignSelf: 'center' }}>
      {rows.map((row, rowIndex) => <View key={rowIndex} style={{ flexDirection: 'row' }}>
        {row.map((dark, columnIndex) => <View key={columnIndex} style={{ width: 6, height: 6, backgroundColor: dark ? '#0B2545' : '#FFFFFF' }} />)}
      </View>)}
    </View>
  </View>;
}
