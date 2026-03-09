import { useState, useEffect, useRef } from 'react';
import { QrCode, Search, Printer, CheckSquare, Square, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';

export function QRGenerator() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const response = await api.getMainInventory();
        if (response.success) {
          setItems(response.items);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.id.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(item => item.id));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header - Hidden on print */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <QrCode size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">สร้าง QR Code พัสดุ</h1>
            <p className="text-sm text-gray-500 mt-1">เลือกรายการพัสดุเพื่อสร้างและพิมพ์รหัส QR</p>
          </div>
        </div>

        <button 
          onClick={handlePrint}
          disabled={selectedIds.length === 0}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Printer size={20} /> พิมพ์ QR Code ({selectedIds.length})
        </button>
      </div>

      {/* Search and Selection - Hidden on print */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-4 print:hidden">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="ค้นหารหัส หรือ ชื่อพัสดุ..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
          />
        </div>
        
        <button 
          onClick={selectAll}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors shrink-0"
        >
          {selectedIds.length === filteredItems.length ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} />}
          เลือกทั้งหมด
        </button>
      </div>

      {/* Item List - Hidden on print */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:hidden">
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500">ไม่พบข้อมูล</div>
          ) : (
            filteredItems.map((item) => (
              <div 
                key={item.id} 
                onClick={() => toggleSelect(item.id)}
                className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${selectedIds.includes(item.id) ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}
              >
                <div className={`shrink-0 ${selectedIds.includes(item.id) ? 'text-indigo-600' : 'text-gray-300'}`}>
                  {selectedIds.includes(item.id) ? <CheckSquare size={24} /> : <Square size={24} />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{item.name}</h3>
                  <p className="text-xs text-gray-500 font-mono">{item.id}</p>
                </div>
                <div className="shrink-0 p-2 bg-white border border-gray-100 rounded-lg shadow-sm">
                  <QRCodeSVG value={item.id} size={40} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Print View - Only visible on print */}
      <div className="hidden print:block">
        <div className="grid grid-cols-3 gap-8 p-4">
          {items.filter(item => selectedIds.includes(item.id)).map(item => (
            <div key={item.id} className="border border-gray-300 p-4 flex flex-col items-center justify-center text-center space-y-2 break-inside-avoid">
              <QRCodeSVG value={item.id} size={120} level="H" />
              <div className="space-y-1">
                <p className="text-xs font-bold font-mono uppercase tracking-wider">{item.id}</p>
                <p className="text-[10px] text-gray-600 leading-tight max-w-[150px]">{item.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 1cm; }
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}} />
    </div>
  );
}
