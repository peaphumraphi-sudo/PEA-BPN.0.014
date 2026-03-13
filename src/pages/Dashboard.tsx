import { useState, useEffect, useMemo } from 'react';
import { Package, AlertTriangle, TrendingDown, TrendingUp, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { cn } from '../utils/cn';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getDashboardData();
      if (res.success) {
        setData(res);
      } else {
        console.error('Failed to load dashboard data:', res.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const chartData = useMemo(() => {
    if (!data?.recentTransactions) return [];
    
    // Group transactions by date (YYYY-MM-DD)
    const grouped = data.recentTransactions.reduce((acc: any, tx: any) => {
      const date = tx.date.split(' ')[0]; // Extract just the date part
      if (!acc[date]) {
        acc[date] = { date, in: 0, out: 0 };
      }
      if (tx.type === 'in') {
        acc[date].in += tx.qty;
      } else if (tx.type === 'out') {
        acc[date].out += tx.qty;
      }
      return acc;
    }, {});

    // Convert to array and sort by date
    return Object.values(grouped).sort((a: any, b: any) => a.date.localeCompare(b.date)).slice(-7); // Last 7 days
  }, [data?.recentTransactions]);

  const pieData = useMemo(() => {
    if (!data) return [];
    const normal = data.totalItems - data.lowStockItems;
    return [
      { name: 'ปกติ', value: normal > 0 ? normal : 0, color: '#10b981' }, // emerald-500
      { name: 'ใกล้หมด', value: data.lowStockItems || 0, color: '#ef4444' } // red-500
    ];
  }, [data]);

  const handleSyncFromSheets = async () => {
    setIsLoading(true);
    try {
      const response = await api.syncAllFromSheets();
      if (response.success) {
        alert('ซิงค์ข้อมูลจาก Google Sheets สำเร็จ');
        await loadData();
      } else {
        alert(`ผิดพลาด: ${response.message}`);
      }
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sheets');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <RefreshCw size={40} className="animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">แดชบอร์ดสรุปผล</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSyncFromSheets}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-sm font-medium"
            title="ดึงข้อมูลจาก Google Sheets"
          >
            <RefreshCw size={18} />
            <span>ซิงค์ข้อมูล</span>
          </button>
          <button 
            onClick={loadData}
            className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-purple-400 hover:border-purple-500/50 transition-colors shadow-sm"
            title="รีเฟรช"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/10">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-purple-400/60 mb-1">พัสดุทั้งหมดในคลัง</p>
            <h3 className="text-3xl font-bold text-white">{data?.totalItems.toLocaleString()} <span className="text-sm font-normal text-purple-400/40">รายการ</span></h3>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 border border-red-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/10">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-purple-400/60 mb-1">พัสดุต่ำกว่าเกณฑ์</p>
            <h3 className="text-3xl font-bold text-red-400">{data?.lowStockItems} <span className="text-sm font-normal text-purple-400/40">รายการ</span></h3>
          </div>
        </div>
      </div>

      {/* Low Stock Items List */}
      {data?.lowStockItemsList && data.lowStockItemsList.length > 0 && (
        <div className="bg-red-500/5 rounded-2xl shadow-2xl border border-red-500/20 overflow-hidden">
          <div className="p-4 border-b border-red-500/20 flex items-center gap-2 bg-red-500/10">
            <AlertTriangle className="text-red-400" size={20} />
            <h2 className="text-lg font-bold text-red-400">รายการพัสดุต่ำกว่าเกณฑ์</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/20 text-red-400/60 text-sm border-b border-red-500/20">
                  <th className="p-4 font-semibold uppercase tracking-wider">รหัสพัสดุ</th>
                  <th className="p-4 font-semibold uppercase tracking-wider">ชื่อพัสดุ</th>
                  <th className="p-4 font-semibold uppercase tracking-wider text-right">คงเหลือ</th>
                  <th className="p-4 font-semibold uppercase tracking-wider text-right">ขั้นต่ำ</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {data.lowStockItemsList.map((item: any) => (
                  <tr key={item.id} className="border-b border-red-500/10 hover:bg-red-500/5 transition-colors">
                    <td className="p-4 text-red-200 font-mono">{item.id}</td>
                    <td className="p-4 font-medium text-red-100">{item.name}</td>
                    <td className="p-4 text-right font-bold text-red-400">{item.current}</td>
                    <td className="p-4 text-right text-red-300/60">{item.min}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/5 lg:col-span-2">
          <h2 className="text-lg font-bold text-white mb-4 tracking-tight">สถิติการรับเข้า-เบิกออก (7 วันล่าสุด)</h2>
          <div className="h-[300px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <Tooltip 
                    cursor={{ fill: '#ffffff05' }}
                    contentStyle={{ backgroundColor: '#111827', borderRadius: '16px', border: '1px solid #ffffff10', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)' }}
                    itemStyle={{ fontWeight: 600 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="in" name="รับเข้า" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="out" name="เบิกออก" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                ไม่มีข้อมูลการทำรายการ
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/5">
          <h2 className="text-lg font-bold text-white mb-4 tracking-tight">สัดส่วนสถานะพัสดุ</h2>
          <div className="h-[300px] w-full flex flex-col items-center justify-center">
            {data?.totalItems > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderRadius: '16px', border: '1px solid #ffffff10', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)' }}
                    itemStyle={{ color: '#fff', fontWeight: 600 }}
                  />
                  <Legend iconType="circle" verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                ไม่มีข้อมูลพัสดุ
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-bold text-white tracking-tight">รายการเคลื่อนไหวล่าสุด</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-purple-300/60 text-sm border-b border-white/5">
                <th className="p-4 font-semibold uppercase tracking-wider">วันที่-เวลา</th>
                <th className="p-4 font-semibold uppercase tracking-wider">ประเภท</th>
                <th className="p-4 font-semibold uppercase tracking-wider">รายการพัสดุ</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-right">จำนวน</th>
                <th className="p-4 font-semibold uppercase tracking-wider">ผู้ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {data?.recentTransactions.map((tx: any) => (
                <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 text-gray-400">{tx.date}</td>
                  <td className="p-4">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                      tx.type === 'in' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                    )}>
                      {tx.type === 'in' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {tx.type === 'in' ? 'รับเข้า' : 'เบิกออก'}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-white">{tx.item}</td>
                  <td className={cn(
                    "p-4 text-right font-bold",
                    tx.type === 'in' ? "text-emerald-400" : "text-orange-400"
                  )}>
                    {tx.type === 'in' ? '+' : '-'}{tx.qty}
                  </td>
                  <td className="p-4 text-gray-300">{tx.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
