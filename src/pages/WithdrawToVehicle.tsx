import { useState, useEffect } from 'react';
import { PackagePlus, AlertCircle, QrCode, Search, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { cn } from '../utils/cn';
import { QRScanner } from '../components/QRScanner';

interface WithdrawToVehicleProps {
  user: any;
}

export function WithdrawToVehicle({ user }: WithdrawToVehicleProps) {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Manual withdraw state
  const [withdrawItemCode, setWithdrawItemCode] = useState('');
  const [withdrawQuantity, setWithdrawQuantity] = useState(1);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await api.getVehicleInventory();
      if (response.success) {
        setItems(response.items);
      } else {
        console.error('Failed to load data:', response.message);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Items that need to be restocked (current < min)
  const lowStockItems = items.filter(item => item.current < item.min);

  const handleWithdraw = async (code: string, qty: number, isManual = false) => {
    const cleanCode = code.trim();
    const cleanQty = Number(qty);

    if (!cleanCode || cleanQty <= 0) return;
    
    const originalItems = [...items];
    
    // Optimistic Update: Update vehicle inventory locally
    setItems(prev => {
      const existingItem = prev.find(i => i.id === cleanCode);
      if (existingItem) {
        return prev.map(i => i.id === cleanCode ? { ...i, current: i.current + cleanQty } : i);
      } else {
        return prev;
      }
    });

    if (isManual) {
      setWithdrawItemCode('');
      setWithdrawQuantity(1);
    }

    setIsWithdrawing(true);
    setSuccessMessage(`กำลังเบิกพัสดุ ${cleanCode}...`);

    try {
      const response = await api.withdrawToVehicle(cleanCode, cleanQty, user.name);
      
      if (!response.success) {
        // Revert on failure
        setItems(originalItems);
        setSuccessMessage(`เกิดข้อผิดพลาด: ${response.message}`);
      } else {
        setSuccessMessage(`เบิกพัสดุ ${cleanCode} จำนวน ${cleanQty} ชิ้น สำเร็จแล้ว`);
        console.log('Withdrawal successful');
      }
    } catch (error) {
      console.error(error);
      setItems(originalItems);
      setSuccessMessage('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    setWithdrawItemCode(decodedText);
    setIsScannerOpen(false);
  };

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-purple-900/50 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
          <PackagePlus size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">เบิกของเข้ารถ</h1>
          <p className="text-sm text-gray-400 mt-1">เบิกพัสดุจากคลังหลักเข้าสู่คลังประจำรถ</p>
        </div>
      </div>

      {/* Recommended Items Section */}
      <div className="bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden backdrop-blur-sm">
        <div className="p-4 bg-red-950/20 border-b border-red-900/30 flex items-center gap-2">
          <AlertCircle className="text-red-500" size={20} />
          <h2 className="font-bold text-red-400">รายการที่ควรเบิกเพิ่ม (ต่ำกว่าเกณฑ์)</h2>
          <span className="ml-auto text-[10px] font-bold text-red-400 bg-red-900/40 px-2.5 py-1 rounded-full uppercase tracking-widest border border-red-500/20">
            {lowStockItems.length} รายการ
          </span>
        </div>
        
        <div className="divide-y divide-gray-800">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest">กำลังโหลดข้อมูล...</div>
          ) : lowStockItems.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-emerald-400">
              <CheckCircle2 size={32} className="text-emerald-500" />
              <p className="font-bold uppercase tracking-widest">พัสดุในรถมีจำนวนเพียงพอทั้งหมด</p>
            </div>
          ) : (
            lowStockItems.map((item) => {
              const suggestedQty = item.min - item.current;
              return (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{item.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="text-gray-500 font-mono uppercase tracking-tight">{item.id}</span>
                      <span className="text-gray-700">|</span>
                      <span className="text-red-400 font-bold">มีอยู่: {item.current}</span>
                      <span className="text-gray-700">|</span>
                      <span className="text-gray-400 font-medium">ขั้นต่ำ: {item.min}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <button 
                      onClick={() => handleWithdraw(item.id, suggestedQty)}
                      disabled={isWithdrawing}
                      className="px-4 py-2 bg-purple-900/30 text-purple-400 hover:bg-purple-900/50 font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 border border-purple-500/20 text-sm"
                    >
                      {isWithdrawing && successMessage?.includes(item.id) ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <PackagePlus size={16} />
                      )}
                      เบิกเพิ่ม {suggestedQty} ชิ้น
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Manual Withdraw Section */}
      <div className="bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden backdrop-blur-sm">
        <div className="p-4 bg-black/50 border-b border-gray-800">
          <h2 className="font-bold">เบิกพัสดุอื่นๆ (ระบุเอง)</h2>
        </div>
        <div className="p-6 space-y-4 max-w-xl">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">รหัสพัสดุ (หรือสแกน QR)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={withdrawItemCode}
                onChange={(e) => setWithdrawItemCode(e.target.value)}
                className="flex-1 px-4 py-2 bg-black border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-white text-sm"
                placeholder="กรอกรหัสพัสดุ"
              />
              <button 
                onClick={() => setIsScannerOpen(true)}
                className="p-2 bg-purple-900/30 text-purple-400 rounded-xl hover:bg-purple-900/50 transition-colors shrink-0 border border-purple-500/20"
              >
                <QrCode size={24} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">จำนวนที่เบิก</label>
            <input 
              type="number" 
              min="1"
              value={withdrawQuantity}
              onChange={(e) => setWithdrawQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 bg-black border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-white text-sm font-bold"
            />
          </div>

          <div className="pt-2">
            <button 
              onClick={() => handleWithdraw(withdrawItemCode, withdrawQuantity, true)}
              disabled={!withdrawItemCode.trim() || isWithdrawing}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl transition-all shadow-xl shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 uppercase tracking-widest"
            >
              {isWithdrawing ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <PackagePlus size={20} />
              )}
              {isWithdrawing ? 'กำลังเบิก...' : 'ยืนยันการเบิก'}
            </button>
          </div>
        </div>
      </div>

      {isScannerOpen && (
        <QRScanner 
          onScanSuccess={handleScanSuccess} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={cn(
            "px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-sm",
            successMessage.includes('ผิดพลาด') ? "bg-red-600 text-white border-red-500/20" : 
            successMessage.includes('กำลัง') ? "bg-indigo-600 text-white border-indigo-500/20" :
            "bg-green-600 text-white border-green-500/20"
          )}>
            <div className="bg-white/20 p-1 rounded-full">
              {successMessage.includes('ผิดพลาด') ? <AlertCircle size={18} /> : 
               successMessage.includes('กำลัง') ? <RefreshCw size={18} className="animate-spin" /> :
               <CheckCircle2 size={18} />}
            </div>
            <span className="font-bold text-sm whitespace-nowrap">{successMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
