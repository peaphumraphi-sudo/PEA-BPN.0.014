import { useState, useEffect } from 'react';
import { Truck, CheckCircle2, AlertCircle, Save, User, Search, Filter, ArrowUpDown, Plus, Minus } from 'lucide-react';
import { api } from '../services/api';
import { cn } from '../utils/cn';

interface VehicleInventoryProps {
  user: any;
}

export function VehicleInventory({ user }: VehicleInventoryProps) {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState(user?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'normal' | 'low'>('all');

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

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedItems = [...items]
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                            item.id.toLowerCase().includes(search.toLowerCase());
      
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

  const handleQuantityChange = (id: string, value: number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, current: Math.max(0, value) } : item
    ));
  };

  const handleSubmit = async () => {
    if (!sender || !receiver) {
      alert('กรุณากรอกชื่อผู้ส่งมอบและผู้รับมอบ');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.saveVehicleChecklist(items, sender, receiver);
      if (response.success) {
        alert('บันทึกข้อมูลลง Google Sheet สำเร็จ');
      } else {
        alert(`เกิดข้อผิดพลาด: ${response.message}`);
      }
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Truck size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">คลังพัสดุประจำรถ</h1>
            <p className="text-sm text-gray-500 mt-1">เช็คลิสต์วัสดุอุปกรณ์ประจำรถ</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <User size={16} className="text-gray-400" /> ผู้ส่งมอบ
          </label>
          <input 
            type="text" 
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm"
            placeholder="ชื่อผู้ส่งมอบ"
          />
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <User size={16} className="text-gray-400" /> ผู้รับมอบ
          </label>
          <input 
            type="text" 
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm"
            placeholder="ชื่อผู้รับมอบ"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="ค้นหารหัส หรือ ชื่อพัสดุ..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm shadow-sm"
          />
        </div>
        
        <div className="relative w-full sm:w-48">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="w-full appearance-none pl-10 pr-8 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm shadow-sm text-gray-700"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="normal">ปกติ</option>
            <option value="low">ต่ำกว่าเกณฑ์</option>
          </select>
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-gray-900">รายการวัสดุอุปกรณ์</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => handleSort('id')}
                className={cn("text-xs flex items-center gap-1 px-2 py-1 rounded-md transition-colors", sortConfig?.key === 'id' ? "bg-purple-100 text-purple-700" : "hover:bg-gray-200 text-gray-600")}
              >
                รหัส <ArrowUpDown size={12} />
              </button>
              <button 
                onClick={() => handleSort('name')}
                className={cn("text-xs flex items-center gap-1 px-2 py-1 rounded-md transition-colors", sortConfig?.key === 'name' ? "bg-purple-100 text-purple-700" : "hover:bg-gray-200 text-gray-600")}
              >
                ชื่อ <ArrowUpDown size={12} />
              </button>
            </div>
          </div>
          <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2.5 py-1 rounded-full">
            {filteredAndSortedItems.length} รายการ
          </span>
        </div>
        
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>
          ) : filteredAndSortedItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500">ไม่พบข้อมูล</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-0 sm:gap-4 lg:gap-0 p-0 sm:p-4 lg:p-0">
              {filteredAndSortedItems.map((item) => {
                const isLowStock = item.current < item.min;
                return (
                  <div key={item.id} className="p-4 sm:p-5 sm:bg-white sm:rounded-2xl sm:border sm:border-gray-100 lg:border-0 lg:border-b lg:rounded-none lg:bg-transparent flex flex-col sm:flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 text-lg lg:text-base">{item.name}</h3>
                        {isLowStock && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">
                            <AlertCircle size={10} /> ต่ำกว่าเกณฑ์ ({item.min})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-mono bg-gray-100 inline-block px-2 py-0.5 rounded-md">{item.id}</p>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-start gap-4 shrink-0 bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
                      <span className="text-sm font-bold text-gray-600 sm:hidden">จำนวนคงเหลือ:</span>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleQuantityChange(item.id, item.current - 1)}
                          className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 active:scale-95 transition-all shadow-sm"
                        >
                          <Minus size={18} />
                        </button>
                        <input 
                          type="number" 
                          min="0"
                          value={item.current}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                          className={cn(
                            "w-16 text-center h-10 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all font-bold text-lg",
                            isLowStock 
                              ? "border-red-300 focus:border-red-500 focus:ring-red-500/50 text-red-600" 
                              : "border-gray-200 focus:border-purple-500 focus:ring-purple-500/50 text-gray-900"
                          )}
                        />
                        <button 
                          onClick={() => handleQuantityChange(item.id, item.current + 1)}
                          className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 active:scale-95 transition-all shadow-sm"
                        >
                          <Plus size={18} />
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

      <div className="flex justify-end">
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting || isLoading}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            'กำลังบันทึก...'
          ) : (
            <>
              <Save size={20} /> บันทึกผลการตรวจเช็ค
            </>
          )}
        </button>
      </div>
    </div>
  );
}
