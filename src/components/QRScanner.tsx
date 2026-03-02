import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!scannerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear();
        onScanSuccess(decodedText);
      },
      (errorMessage) => {
        // Ignore normal scan errors (not finding a QR code in the frame)
        if (!errorMessage.includes('NotFound')) {
          console.warn(errorMessage);
        }
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
          <h3 className="font-bold">สแกน QR Code</h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          <div id="qr-reader" ref={scannerRef} className="w-full overflow-hidden rounded-xl border-2 border-dashed border-gray-300"></div>
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
          <p className="text-sm text-gray-500 text-center mt-4">
            หันกล้องไปที่ QR Code ของพัสดุ
          </p>
        </div>
      </div>
    </div>
  );
}
