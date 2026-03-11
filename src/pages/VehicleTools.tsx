import { useState, useEffect } from 'react';
import { Wrench, CheckCircle2, AlertCircle, Save, User, XCircle, Search, Filter, ArrowUpDown, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { cn } from '../utils/cn';

interface VehicleToolsProps {
  user: any;
}

export function VehicleTools({ user }: VehicleToolsProps) {
  const [tools, setTools] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState(user?.name || '');
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'complete' | 'incomplete' | 'damaged'>('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [toolsRes, usersRes] = await Promise.all([
        api.getVehicleTools(),
        api.getUsers()
      ]);

      if (toolsRes.success) {
        setTools(toolsRes.tools);
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

  const filteredAndSortedTools = [...tools]
    .filter(tool => {
      const searchLower = (search || '').toLowerCase();
      const toolNameLower = (tool.name || '').toLowerCase();
      const toolIdLower = (tool.id || '').toLowerCase();
      
      const matchesSearch = toolNameLower.includes(searchLower) || 
                            toolIdLower.includes(searchLower);
      
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
      setSuccessMessage('กรุณากรอกชื่อผู้ส่งมอบและผู้รับมอบ');
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('กำลังบันทึกข้อมูลเครื่องมือ... กรุณารอสักครู่');
    
    try {
      const response = await api.saveToolChecklist(tools, sender, receiver);
      if (response.success) {
        setSuccessMessage('บันทึกข้อมูลเช็คลิสต์เครื่องมือสำเร็จแล้ว');
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
            <User size={16} className="text-gray-400" /> ผู้ส่งมอบ (ชื่อ-นามสกุล)
          </label>
          <input 
            type="text" 
            list="user-list"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm"
            placeholder="พิมพ์หรือเลือกชื่อผู้ส่งมอบ"
          />
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <User size={16} className="text-gray-400" /> ผู้รับมอบ (ชื่อ-นามสกุล)
          </label>
          <input 
            type="text" 
            list="user-list"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm"
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
            <div className="grid grid-cols-1 gap-0">
              {filteredAndSortedTools.map((tool) => (
                <div key={tool.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Wrench size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-0.5">{tool.name}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-tight">{tool.id}</p>
                        <span className="text-[10px] text-gray-400">•</span>
                        <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded">จำนวน: {tool.qty}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1.5 shrink-0 bg-gray-50 sm:bg-transparent p-1.5 sm:p-0 rounded-xl border border-gray-100 sm:border-0">
                    <button
                      onClick={() => handleStatusChange(tool.id, 'complete')}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg text-[10px] font-bold transition-all border",
                        tool.status === 'complete' 
                          ? "bg-emerald-500 border-emerald-600 text-white shadow-sm" 
                          : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50"
                      )}
                    >
                      <CheckCircle2 size={16} /> 
                      <span>ครบ</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange(tool.id, 'incomplete')}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg text-[10px] font-bold transition-all border",
                        tool.status === 'incomplete' 
                          ? "bg-orange-500 border-orange-600 text-white shadow-sm" 
                          : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50"
                      )}
                    >
                      <XCircle size={16} /> 
                      <span>ไม่ครบ</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange(tool.id, 'damaged')}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg text-[10px] font-bold transition-all border",
                        tool.status === 'damaged' 
                          ? "bg-red-500 border-red-600 text-white shadow-sm" 
                          : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50"
                      )}
                    >
                      <AlertCircle size={16} /> 
                      <span>ชำรุด</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pb-8">
        <button 
          onClick={handleSubmit}
          disabled={isLoading || isSubmitting}
          className="w-full sm:w-auto px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
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
            "px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-sm",
            successMessage.includes('ผิดพลาด') ? "bg-red-600 text-white border-red-500/20" : 
            successMessage.includes('กำลังบันทึก') ? "bg-indigo-600 text-white border-indigo-500/20" :
            "bg-green-600 text-white border-green-500/20"
          )}>
            <div className="bg-white/20 p-1 rounded-full">
              {successMessage.includes('ผิดพลาด') ? <AlertCircle size={18} /> : 
               successMessage.includes('กำลังบันทึก') ? <RefreshCw size={18} className="animate-spin" /> :
               <CheckCircle2 size={18} />}
            </div>
            <span className="font-bold text-sm whitespace-nowrap">{successMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
