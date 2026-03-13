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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/10">
          <PackagePlus size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">เบิกของเข้ารถ</h1>
          <p className="text-sm text-purple-400/60 mt-1 font-medium">เบิกพัสดุจากคลังหลักเข้าสู่คลังประจำรถ</p>
        </div>
      </div>

      {/* Recommended Items Section */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/5 overflow-hidden">
        <div className="p-4 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2">
          <AlertCircle className="text-red-400" size={20} />
          <h2 className="font-bold text-red-400 tracking-tight">รายการที่ควรเบิกเพิ่ม (ต่ำกว่าเกณฑ์)</h2>
          <span className="ml-auto text-xs font-bold text-red-400 bg-red-500/20 px-3 py-1 rounded-full border border-red-500/20 uppercase tracking-widest">
            {lowStockItems.length} รายการ
          </span>
        </div>
        
        <div className="divide-y divide-white/5">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>
          ) : lowStockItems.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3 text-emerald-400/60">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                <CheckCircle2 size={40} className="text-emerald-500" />
              </div>
              <p className="font-bold text-lg text-emerald-400 tracking-tight">พัสดุในรถมีจำนวนเพียงพอทั้งหมด</p>
            </div>
          ) : (
            lowStockItems.map((item) => {
              const suggestedQty = item.min - item.current;
              return (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex-1">
                    <h3 className="font-bold text-white tracking-tight">{item.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="text-gray-500 font-mono uppercase tracking-wider">{item.id}</span>
                      <span className="text-gray-700">|</span>
                      <span className="text-red-400 font-bold uppercase tracking-wider">มีอยู่: {item.current}</span>
                      <span className="text-gray-700">|</span>
                      <span className="text-purple-400/60 font-bold uppercase tracking-wider">ขั้นต่ำ: {item.min}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <button 
                      onClick={() => handleWithdraw(item.id, suggestedQty)}
                      disabled={isWithdrawing}
                      className="px-4 py-2 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 border border-purple-500/20 uppercase tracking-widest text-xs"
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
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/5 overflow-hidden">
        <div className="p-4 bg-white/5 border-b border-white/5">
          <h2 className="font-bold text-white tracking-tight">เบิกพัสดุอื่นๆ (ระบุเอง)</h2>
        </div>
        <div className="p-6 space-y-5 max-w-xl">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-400 ml-1">รหัสพัสดุ (หรือสแกน QR)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={withdrawItemCode}
                onChange={(e) => setWithdrawItemCode(e.target.value)}
                className="flex-1 px-4 py-3 bg-black border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all placeholder:text-gray-700"
                placeholder="กรอกรหัสพัสดุ"
              />
              <button 
                onClick={() => setIsScannerOpen(true)}
                className="p-3 bg-purple-500/10 text-purple-400 rounded-xl hover:bg-purple-500/20 transition-all shrink-0 border border-purple-500/20 shadow-lg shadow-purple-500/10"
              >
                <QrCode size={24} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-400 ml-1">จำนวนที่เบิก</label>
            <input 
              type="number" 
              min="1"
              value={withdrawQuantity}
              onChange={(e) => setWithdrawQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-3 bg-black border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-bold"
            />
          </div>

          <div className="pt-2">
            <button 
              onClick={() => handleWithdraw(withdrawItemCode, withdrawQuantity, true)}
              disabled={!withdrawItemCode.trim() || isWithdrawing}
              className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 uppercase tracking-widest"
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
            "px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md",
            successMessage.includes('ผิดพลาด') ? "bg-red-600/90 text-white border-red-500/20" : 
            successMessage.includes('กำลัง') ? "bg-purple-600/90 text-white border-purple-500/20" :
            "bg-emerald-600/90 text-white border-emerald-500/20"
          )}>
            <div className="bg-white/20 p-1 rounded-full">
              {successMessage.includes('ผิดพลาด') ? <AlertCircle size={18} /> : 
               successMessage.includes('กำลัง') ? <RefreshCw size={18} className="animate-spin" /> :
               <CheckCircle2 size={18} />}
            </div>
            <span className="font-bold text-sm whitespace-nowrap tracking-tight">{successMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
