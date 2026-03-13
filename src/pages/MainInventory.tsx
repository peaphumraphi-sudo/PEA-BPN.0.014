import { useState, useEffect } from 'react';
import { Search, Plus, Minus, AlertCircle, QrCode, X, ArrowUpDown, Filter, Printer, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { cn } from '../utils/cn';
import { QRScanner } from '../components/QRScanner';
import { QRCodeSVG } from 'qrcode.react';

interface MainInventoryProps {
  user: any;
}

export function MainInventory({ user }: MainInventoryProps) {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [transactionType, setTransactionType] = useState<'in' | 'out'>('out');
  const [quantity, setQuantity] = useState(1);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [qrViewItem, setQrViewItem] = useState<any>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'normal' | 'low'>('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const isAdmin = user?.role === 'admin';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await api.getMainInventory();
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

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedItems = [...items]
    .filter(item => {
      const searchLower = (search || '').toLowerCase();
      const itemNameLower = (item.name || '').toLowerCase();
      const itemIdLower = (item.id || '').toLowerCase();
      
      const matchesSearch = itemNameLower.includes(searchLower) || 
                            itemIdLower.includes(searchLower);
      
      if (filterStatus === 'all') return matchesSearch;
      const isLowStock = item.current <= item.min;
      if (filterStatus === 'low') return matchesSearch && isLowStock;
      if (filterStatus === 'normal') return matchesSearch && !isLowStock;
      return matchesSearch;
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      
      const { key, direction } = sortConfig;
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });

  const handleTransaction = (item: any, type: 'in' | 'out') => {
    setSelectedItem(item);
    setTransactionType(type);
    setQuantity(1);
    setIsModalOpen(true);
  };

  const submitTransaction = async () => {
    const originalItems = [...items];
    const newQuantity = transactionType === 'in' ? selectedItem.current + quantity : selectedItem.current - quantity;
    
    setIsSubmitting(true);
    setSuccessMessage(`กำลัง${transactionType === 'in' ? 'รับเข้า' : 'เบิกออก'}...`);
    
    // Optimistic Update
    setItems(prev => prev.map(item => {
      if (item.id === selectedItem.id) {
        return { ...item, current: newQuantity };
      }
      return item;
    }));
    
    setIsModalOpen(false);
    
    try {
      const response = await api.transaction(transactionType, selectedItem.id, quantity, user.name);
      
      if (!response.success) {
        // Revert on failure
        setItems(originalItems);
        setSuccessMessage(`เกิดข้อผิดพลาด: ${response.message}`);
      } else {
        setSuccessMessage(`${transactionType === 'in' ? 'รับเข้า' : 'เบิกออก'} ${selectedItem.name} จำนวน ${quantity} ชิ้น สำเร็จแล้ว`);
      }
    } catch (error) {
      console.error(error);
      setItems(originalItems);
      setSuccessMessage('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    setIsScannerOpen(false);
    
    // Find item by code
    const item = items.find(i => i.id === decodedText);
    
    if (item) {
      // Open withdrawal modal for this item
      handleTransaction(item, 'out');
    } else {
      alert(`ไม่พบพัสดุรหัส ${decodedText} ในคลังหลัก`);
      // Optionally, set the search text to the scanned code
      setSearch(decodedText);
    }
  };

  const handleSyncFromSheets = async () => {
    setIsSyncing(true);
    setSuccessMessage('กำลังซิงค์ข้อมูลจาก Google Sheets...');
    try {
      const response = await api.syncAllFromSheets();
      if (response.success) {
        await loadData();
        setSuccessMessage('ซิงค์ข้อมูลจาก Google Sheets สำเร็จ');
      } else {
        setSuccessMessage(`ผิดพลาด: ${response.message}`);
      }
    } catch (error) {
      console.error(error);
      setSuccessMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sheets');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">คลังพัสดุหลัก</h1>
          <p className="text-sm text-gray-400 mt-1">จัดการและเบิกจ่ายพัสดุ</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="ค้นหารหัส หรือ ชื่อพัสดุ..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm shadow-sm text-white"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full appearance-none pl-10 pr-8 py-2 bg-black border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm shadow-sm text-white"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="normal">ปกติ</option>
                <option value="low">ใกล้หมด</option>
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            </div>
            
            <button 
              onClick={() => setIsScannerOpen(true)}
              className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-md shadow-purple-500/20 shrink-0"
              title="สแกน QR Code"
            >
              <QrCode size={20} />
            </button>

            <button 
              onClick={handleSyncFromSheets}
              disabled={isSyncing}
              className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-500/20 shrink-0 disabled:opacity-50"
              title="ดึงข้อมูลจาก Google Sheets"
            >
              <RefreshCw size={20} className={cn(isSyncing && "animate-spin")} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 rounded-2xl shadow-sm border border-gray-800 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/50 text-gray-400 text-xs font-bold uppercase tracking-widest border-b border-gray-800">
                <th className="p-4 font-medium cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleSort('id')}>
                  <div className="flex items-center gap-1">รหัสพัสดุ <ArrowUpDown size={14} className={cn("text-gray-500", sortConfig?.key === 'id' && "text-purple-400")} /></div>
                </th>
                <th className="p-4 font-medium cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">รายการ <ArrowUpDown size={14} className={cn("text-gray-500", sortConfig?.key === 'name' && "text-purple-400")} /></div>
                </th>
                <th className="p-4 font-medium text-right cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleSort('current')}>
                  <div className="flex items-center justify-end gap-1">คงเหลือ <ArrowUpDown size={14} className={cn("text-gray-500", sortConfig?.key === 'current' && "text-purple-400")} /></div>
                </th>
                <th className="p-4 font-medium text-center">สถานะ</th>
                <th className="p-4 font-medium text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</td>
                </tr>
              ) : filteredAndSortedItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">ไม่พบข้อมูลพัสดุ</td>
                </tr>
              ) : (
                filteredAndSortedItems.map((item) => {
                  const isLowStock = item.current <= item.min;
                  return (
                    <tr key={item.id} className="border-b border-gray-800 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono text-xs text-purple-400">{item.id}</td>
                      <td className="p-4 font-medium">{item.name}</td>
                      <td className="p-4 text-right font-black">{item.current}</td>
                      <td className="p-4 text-center">
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                            <AlertCircle size={12} /> ใกล้หมด
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ปกติ
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setQrViewItem(item)}
                            className="p-1.5 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                            title="ดู QR Code"
                          >
                            <QrCode size={18} />
                          </button>
                          <button 
                            onClick={() => handleTransaction(item, 'in')}
                            className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors text-xs font-bold flex items-center gap-1 border border-emerald-500/20"
                            title="รับเข้า"
                          >
                            <Plus size={14} /> รับเข้า
                          </button>
                          <button 
                            onClick={() => handleTransaction(item, 'out')}
                            className="px-3 py-1.5 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 rounded-lg transition-colors text-xs font-bold flex items-center gap-1 border border-orange-500/20"
                            title="เบิกออก"
                          >
                            <Minus size={14} /> เบิกออก
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-gray-800">
            <div className={cn(
              "p-6 text-white flex justify-between items-start",
              transactionType === 'in' ? "bg-gradient-to-br from-emerald-600 to-emerald-700" : "bg-gradient-to-br from-orange-600 to-orange-700"
            )}>
              <div>
                <h3 className="text-xl font-bold mb-1">
                  {transactionType === 'in' ? 'รับเข้าพัสดุ' : 'เบิกออกพัสดุ'}
                </h3>
                <p className="text-white/80 text-sm">{selectedItem.name} ({selectedItem.id})</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center p-4 bg-black rounded-2xl border border-gray-800">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">คงเหลือปัจจุบัน</span>
                <span className="text-2xl font-black text-white">{selectedItem.current}</span>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">จำนวนที่ต้องการ{transactionType === 'in' ? 'รับเข้า' : 'เบิก'}</label>
                <div className="flex items-center gap-4">
                  <button 
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 rounded-xl border border-gray-800 flex items-center justify-center text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    <Minus size={20} />
                  </button>
                  <input 
                    type="number" 
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="flex-1 h-12 text-center text-xl font-black bg-black border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-white"
                  />
                  <button 
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 rounded-xl border border-gray-800 flex items-center justify-center text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={submitTransaction}
                  disabled={transactionType === 'out' && quantity > selectedItem.current}
                  className={cn(
                    "w-full py-4 rounded-xl font-black text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm",
                    transactionType === 'in' 
                      ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25" 
                      : "bg-orange-600 hover:bg-orange-500 shadow-orange-500/25"
                  )}
                >
                  ยืนยันรายการ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {isScannerOpen && (
        <QRScanner 
          onScanSuccess={handleScanSuccess} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}

      {/* QR Code View Modal */}
      {qrViewItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xs overflow-hidden transform transition-all p-8 flex flex-col items-center space-y-6">
            <div className="flex justify-between items-center w-full">
              <h3 className="font-bold text-gray-900">QR Code พัสดุ</h3>
              <button onClick={() => setQrViewItem(null)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            <div className="p-4 bg-white border-4 border-gray-50 rounded-2xl shadow-inner">
              <QRCodeSVG value={qrViewItem.id} size={200} level="H" />
            </div>
            
            <div className="text-center space-y-1">
              <p className="text-sm font-bold font-mono text-gray-500 uppercase tracking-widest">{qrViewItem.id}</p>
              <p className="text-base font-bold text-gray-900 leading-tight">{qrViewItem.name}</p>
            </div>
            
            <button 
              onClick={() => window.print()}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
            >
              <Printer size={20} /> พิมพ์รหัสนี้
            </button>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={cn(
            "px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-sm",
            successMessage.includes('ผิดพลาด') ? "bg-red-600 text-white border-red-500/20" : 
            successMessage.includes('กำลัง') ? "bg-purple-600 text-white border-purple-500/20" :
            "bg-emerald-600 text-white border-emerald-500/20"
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
