import { useState, useEffect } from 'react';
import { Wrench, CheckCircle2, AlertCircle, Save, User, XCircle, Search, Filter, ArrowUpDown } from 'lucide-react';
import { api } from '../services/api';
import { cn } from '../utils/cn';

interface VehicleToolsProps {
  user: any;
}

export function VehicleTools({ user }: VehicleToolsProps) {
  const [tools, setTools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState(user?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'complete' | 'incomplete' | 'damaged'>('all');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await api.getVehicleTools();
      if (response.success) {
        setTools(response.tools);
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

  const filteredAndSortedTools = [...tools]
    .filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase()) || 
                            tool.id.toLowerCase().includes(search.toLowerCase());
      
      if (filterStatus === 'all') return matchesSearch;
      return matchesSearch && tool.status === filterStatus;
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      
      const { key, direction } = sortConfig;
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });

  const handleStatusChange = (id: string, status: string) => {
    setTools(prev => prev.map(tool => 
      tool.id === id ? { ...tool, status } : tool
    ));
  };

  const handleSubmit = async () => {
    if (!sender || !receiver) {
      alert('กรุณากรอกชื่อผู้ส่งมอบและผู้รับมอบ');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.saveToolChecklist(tools, sender, receiver);
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
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
          <Wrench size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">เครื่องมือประจำรถ</h1>
          <p className="text-sm text-gray-500 mt-1">เช็คลิสต์เครื่องมือประจำรถ</p>
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
            placeholder="ค้นหารหัส หรือ ชื่อเครื่องมือ..." 
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
            <option value="complete">ครบ</option>
            <option value="incomplete">ไม่ครบ</option>
            <option value="damaged">ชำรุด</option>
          </select>
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-gray-900">รายการเครื่องมือ</h2>
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
            {filteredAndSortedTools.length} รายการ
          </span>
        </div>
        
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>
          ) : filteredAndSortedTools.length === 0 ? (
            <div className="p-8 text-center text-gray-500">ไม่พบข้อมูล</div>
          ) : (
            filteredAndSortedTools.map((tool) => (
              <div key={tool.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">{tool.name}</h3>
                  <p className="text-xs text-gray-500 font-mono">{tool.id} • จำนวน: {tool.qty}</p>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleStatusChange(tool.id, 'complete')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                      tool.status === 'complete' 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm" 
                        : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    <CheckCircle2 size={16} className={cn(tool.status === 'complete' ? "text-emerald-500" : "text-gray-400")} /> 
                    ครบ
                  </button>
                  <button
                    onClick={() => handleStatusChange(tool.id, 'incomplete')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                      tool.status === 'incomplete' 
                        ? "bg-orange-50 border-orange-200 text-orange-700 shadow-sm" 
                        : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    <XCircle size={16} className={cn(tool.status === 'incomplete' ? "text-orange-500" : "text-gray-400")} /> 
                    ไม่ครบ
                  </button>
                  <button
                    onClick={() => handleStatusChange(tool.id, 'damaged')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                      tool.status === 'damaged' 
                        ? "bg-red-50 border-red-200 text-red-700 shadow-sm" 
                        : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    <AlertCircle size={16} className={cn(tool.status === 'damaged' ? "text-red-500" : "text-gray-400")} /> 
                    ชำรุด
                  </button>
                </div>
              </div>
            ))
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
