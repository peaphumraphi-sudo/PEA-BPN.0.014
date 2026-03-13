import { useState, useEffect } from 'react';
import { Truck, CheckCircle2, AlertCircle, Save, User, Search, Filter, ArrowUpDown, Plus, Minus, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { cn } from '../utils/cn';

interface VehicleInventoryProps {
  user: any;
}

export function VehicleInventory({ user }: VehicleInventoryProps) {
  const [items, setItems] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState(user?.name || '');
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'normal' | 'low'>('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [inventoryRes, usersRes] = await Promise.all([
        api.getVehicleInventory(),
        api.getUsers()
      ]);

      if (inventoryRes.success) {
        setItems(inventoryRes.items);
      }
      
      if (usersRes.success) {
        setUsers(usersRes.users);
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
      const isLowStock = item.current < item.min;
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

  const handleQuantityChange = (id: string, value: number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, current: Math.max(0, value) } : item
    ));
  };

  const handleSubmit = async () => {
    if (!sender || !receiver) {
      setSuccessMessage('กรุณากรอกชื่อผู้ส่งมอบและผู้รับมอบ');
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('กำลังบันทึกข้อมูล... กรุณารอสักครู่');
    
    try {
      const response = await api.saveVehicleChecklist(items, sender, receiver);
      if (response.success) {
        setSuccessMessage('บันทึกข้อมูลเช็คลิสต์พัสดุสำเร็จแล้ว');
      } else {
        setSuccessMessage(`เกิดข้อผิดพลาด: ${response.message}`);
        loadData();
      }
    } catch (error) {
      console.error(error);
      setSuccessMessage('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ');
      loadData();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/10">
            <Truck size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">คลังพัสดุประจำรถ</h1>
            <p className="text-sm text-purple-400/60 mt-1 font-medium">เช็คลิสต์วัสดุอุปกรณ์ประจำรถ</p>
          </div>
        </div>
        <button 
          onClick={handleSyncFromSheets}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 text-sm font-bold uppercase tracking-wider"
        >
          <RefreshCw size={18} className={cn(isSyncing && "animate-spin")} />
          {isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูล'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/5 space-y-2">
          <label className="text-sm font-semibold text-gray-400 flex items-center gap-2 ml-1">
            <User size={16} className="text-purple-400/60" /> ผู้ส่งมอบ (ชื่อ-นามสกุล)
          </label>
          <input 
            type="text" 
            list="user-list"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            className="w-full px-4 py-2 bg-black border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm placeholder:text-gray-700"
            placeholder="พิมพ์หรือเลือกชื่อผู้ส่งมอบ"
          />
        </div>
        <div className="bg-white/5 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/5 space-y-2">
          <label className="text-sm font-semibold text-gray-400 flex items-center gap-2 ml-1">
            <User size={16} className="text-purple-400/60" /> ผู้รับมอบ (ชื่อ-นามสกุล)
          </label>
          <input 
            type="text" 
            list="user-list"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            className="w-full px-4 py-2 bg-black border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm placeholder:text-gray-700"
            placeholder="พิมพ์หรือเลือกชื่อผู้รับมอบ"
          />
        </div>
      </div>

      <datalist id="user-list">
        {users.map((u: any) => (
          <option key={u.username} value={u.name} />
        ))}
      </datalist>

      <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="ค้นหารหัส หรือ ชื่อพัสดุ..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm shadow-sm placeholder:text-gray-700"
          />
        </div>
        
        <div className="relative w-full sm:w-48">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="w-full appearance-none pl-10 pr-8 py-2 bg-black border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm shadow-sm text-gray-300"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="normal">ปกติ</option>
            <option value="low">ต่ำกว่าเกณฑ์</option>
          </select>
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/5 overflow-hidden">
        <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-white tracking-tight">รายการวัสดุอุปกรณ์</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => handleSort('id')}
                className={cn("text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-all font-bold uppercase tracking-wider", sortConfig?.key === 'id' ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "hover:bg-white/5 text-gray-500 border border-transparent")}
              >
                รหัส <ArrowUpDown size={12} />
              </button>
              <button 
                onClick={() => handleSort('name')}
                className={cn("text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-all font-bold uppercase tracking-wider", sortConfig?.key === 'name' ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "hover:bg-white/5 text-gray-500 border border-transparent")}
              >
                ชื่อ <ArrowUpDown size={12} />
              </button>
            </div>
          </div>
          <span className="text-xs font-bold text-purple-400/60 bg-purple-500/10 px-3 py-1 rounded-full uppercase tracking-widest border border-purple-500/10">
            {filteredAndSortedItems.length} รายการ
          </span>
        </div>
        
        <div className="divide-y divide-white/5">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>
          ) : filteredAndSortedItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500">ไม่พบข้อมูล</div>
          ) : (
            <div className="grid grid-cols-1 gap-0">
              {filteredAndSortedItems.map((item) => {
                const isLowStock = item.current < item.min;
                return (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-0">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                        isLowStock ? "bg-red-500/20 text-red-400 border border-red-500/20" : "bg-purple-500/20 text-purple-400 border border-purple-500/20"
                      )}>
                        <Truck size={20} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <h3 className="font-bold text-white tracking-tight">{item.name}</h3>
                          {isLowStock && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wider">
                              <AlertCircle size={10} /> ต่ำกว่าเกณฑ์
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-tight">{item.id}</p>
                          <span className="text-[10px] text-gray-700">•</span>
                          <span className="text-[10px] text-purple-400/60 font-bold uppercase tracking-wider">เกณฑ์ขั้นต่ำ: {item.min}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-3 bg-black/40 sm:bg-transparent px-3 py-2 sm:p-0 rounded-xl border border-white/5 sm:border-0">
                      <span className="text-xs font-bold text-gray-500 sm:hidden uppercase tracking-wider">จำนวนปัจจุบัน:</span>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleQuantityChange(item.id, item.current - 1)}
                          className="w-9 h-9 flex items-center justify-center bg-black border border-white/10 rounded-lg text-gray-400 hover:bg-white/5 hover:border-purple-500/50 active:scale-95 transition-all shadow-sm"
                        >
                          <Minus size={16} />
                        </button>
                        <input 
                          type="number" 
                          min="0"
                          value={item.current}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                          className={cn(
                            "w-14 text-center h-9 bg-black border rounded-lg focus:outline-none focus:ring-2 transition-all font-bold text-sm",
                            isLowStock 
                              ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30 text-red-400" 
                              : "border-white/10 focus:border-purple-500 focus:ring-purple-500/30 text-white"
                          )}
                        />
                        <button 
                          onClick={() => handleQuantityChange(item.id, item.current + 1)}
                          className="w-9 h-9 flex items-center justify-center bg-black border border-white/10 rounded-lg text-gray-400 hover:bg-white/5 hover:border-purple-500/50 active:scale-95 transition-all shadow-sm"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pb-8">
        <button 
          onClick={handleSubmit}
          disabled={isLoading || isSubmitting}
          className="w-full sm:w-auto px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] uppercase tracking-widest"
        >
          {isSubmitting ? (
            <RefreshCw size={20} className="animate-spin" />
          ) : (
            <Save size={20} />
          )}
          {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกผลการตรวจเช็ค'}
        </button>
      </div>

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={cn(
            "px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md",
            successMessage.includes('ผิดพลาด') ? "bg-red-600/90 text-white border-red-500/20" : 
            successMessage.includes('กำลังบันทึก') ? "bg-purple-600/90 text-white border-purple-500/20" :
            "bg-emerald-600/90 text-white border-emerald-500/20"
          )}>
            <div className="bg-white/20 p-1 rounded-full">
              {successMessage.includes('ผิดพลาด') ? <AlertCircle size={18} /> : 
               successMessage.includes('กำลังบันทึก') ? <RefreshCw size={18} className="animate-spin" /> :
               <CheckCircle2 size={18} />}
            </div>
            <span className="font-bold text-sm whitespace-nowrap tracking-tight">{successMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
