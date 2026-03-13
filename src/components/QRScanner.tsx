import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, ExternalLink, CameraOff, Keyboard, QrCode, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>('');
  const [manualId, setManualId] = useState<string>('');
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    setIsInIframe(window.self !== window.top);

    if (!scannerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 350, height: 350 },
        aspectRatio: 1.0,
        videoConstraints: {
          facingMode: "environment"
        }
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear().catch(console.error);
        onScanSuccess(decodedText);
      },
      (errorMessage) => {
        if (!errorMessage.includes('NotFound')) {
          console.warn(errorMessage);
          if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
            setError('ไม่ได้รับอนุญาตให้เข้าถึงกล้อง กรุณาตรวจสอบการตั้งค่าสิทธิ์ หรือลองเปิดแอปในหน้าต่างใหม่');
          }
        }
      }
    );

    return () => {
      scanner.clear().catch(err => {
        // Ignore errors during cleanup if scanner wasn't fully started
        console.log("Scanner cleanup:", err);
      });
    };
  }, [onScanSuccess]);

  const openInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-[#0A0A0A] rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] border border-white/10">
        <div className="p-4 bg-black/50 backdrop-blur-md border-b border-white/10 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
              <QrCode size={18} />
            </div>
            <h3 className="font-bold tracking-tight">สแกน QR Code</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div 
            id="qr-reader" 
            ref={scannerRef} 
            className="w-full overflow-hidden rounded-2xl border-2 border-dashed border-white/10 bg-black aspect-square flex items-center justify-center relative"
          >
            {!error && (
              <div className="text-center p-8 text-gray-600">
                <div className="animate-pulse flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                    <CameraOff size={28} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest">กำลังเรียกใช้งานกล้อง...</p>
                </div>
              </div>
            )}
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 text-red-400 text-sm rounded-2xl border border-red-500/20 backdrop-blur-md">
              <div className="flex gap-3">
                <AlertCircle className="shrink-0" size={18} />
                <div className="space-y-2">
                  <p className="font-bold tracking-tight">พบปัญหาการเข้าถึงกล้อง</p>
                  <p className="text-xs leading-relaxed opacity-80">{error}</p>
                  {isInIframe && (
                    <button 
                      onClick={openInNewTab}
                      className="flex items-center gap-1.5 text-xs font-bold underline hover:text-red-300 transition-colors"
                    >
                      <ExternalLink size={14} /> เปิดในหน้าต่างใหม่เพื่อใช้กล้อง
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/5"></span>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                <span className="bg-[#0A0A0A] px-3 text-gray-600 font-bold">หรือกรอกรหัสด้วยตนเอง</span>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                <input
                  type="text"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="กรอกรหัสพัสดุที่นี่..."
                  className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm font-bold placeholder:text-gray-800"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && manualId.trim()) {
                      onScanSuccess(manualId.trim());
                    }
                  }}
                />
              </div>
              <button
                onClick={() => manualId.trim() && onScanSuccess(manualId.trim())}
                className="px-6 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-all text-sm font-bold shadow-lg shadow-purple-500/20 active:scale-95 uppercase tracking-widest"
              >
                ตกลง
              </button>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-gray-600">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping"></div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-purple-400/40">
              System Ready for Scanning
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
