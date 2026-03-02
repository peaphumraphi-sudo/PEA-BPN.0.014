import { useState, useEffect } from 'react';
import { PackagePlus, AlertCircle, QrCode, Search, CheckCircle2 } from 'lucide-react';
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
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

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

  // Items that need to be restocked (current < min)
  const lowStockItems = items.filter(item => item.current < item.min);

  const handleWithdraw = async (code: string, qty: number, isManual = false) => {
    const cleanCode = code.trim();
    const cleanQty = Number(qty);

    if (!cleanCode || cleanQty <= 0) return;
    
    setIsWithdrawing(true);
    try {
      const response = await api.withdrawToVehicle(cleanCode, cleanQty, user.name);
      
      if (response.success) {
        alert('เบิกของเข้ารถสำเร็จ และตัดยอดในคลังหลักเรียบร้อยแล้ว');
        if (isManual) {
          setWithdrawItemCode('');
          setWithdrawQuantity(1);
        }
        // Reload data to reflect new quantities
        loadData();
      } else {
        alert(`เกิดข้อผิดพลาด: ${response.message}`);
      }
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ');
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
        <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
          <PackagePlus size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">เบิกของเข้ารถ</h1>
          <p className="text-sm text-gray-500 mt-1">เบิกพัสดุจากคลังหลักเข้าสู่คลังประจำรถ</p>
        </div>
      </div>

      {/* Recommended Items Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-red-50/50 border-b border-red-100 flex items-center gap-2">
          <AlertCircle className="text-red-500" size={20} />
          <h2 className="font-bold text-red-900">รายการที่ควรเบิกเพิ่ม (ต่ำกว่าเกณฑ์)</h2>
          <span className="ml-auto text-xs font-medium text-red-700 bg-red-100 px-2.5 py-1 rounded-full">
            {lowStockItems.length} รายการ
          </span>
        </div>
        
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>
          ) : lowStockItems.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-green-600">
              <CheckCircle2 size={32} className="text-green-500" />
              <p className="font-medium">พัสดุในรถมีจำนวนเพียงพอทั้งหมด</p>
            </div>
          ) : (
            lowStockItems.map((item) => {
              const suggestedQty = item.min - item.current;
              return (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm">
                      <span className="text-gray-500 font-mono">{item.id}</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-red-600 font-medium">มีอยู่: {item.current}</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-600">ขั้นต่ำ: {item.min}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <button 
                      onClick={() => handleWithdraw(item.id, suggestedQty)}
                      disabled={isWithdrawing}
                      className="px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <PackagePlus size={16} /> เบิกเพิ่ม {suggestedQty} ชิ้น
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Manual Withdraw Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50/50 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">เบิกพัสดุอื่นๆ (ระบุเอง)</h2>
        </div>
        <div className="p-6 space-y-4 max-w-xl">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">รหัสพัสดุ (หรือสแกน QR)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={withdrawItemCode}
                onChange={(e) => setWithdrawItemCode(e.target.value)}
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                placeholder="กรอกรหัสพัสดุ"
              />
              <button 
                onClick={() => setIsScannerOpen(true)}
                className="p-2 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition-colors shrink-0"
              >
                <QrCode size={24} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">จำนวนที่เบิก</label>
            <input 
              type="number" 
              min="1"
              value={withdrawQuantity}
              onChange={(e) => setWithdrawQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
            />
          </div>

          <div className="pt-2">
            <button 
              onClick={() => handleWithdraw(withdrawItemCode, withdrawQuantity, true)}
              disabled={isWithdrawing || !withdrawItemCode.trim()}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isWithdrawing ? 'กำลังดำเนินการ...' : <><PackagePlus size={20} /> ยืนยันการเบิก</>}
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
    </div>
  );
}
