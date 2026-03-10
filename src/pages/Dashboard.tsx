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
      const response = await api.fetchFromGoogleSheets();
      if (response.success) {
        // After syncing, we should probably refresh the dashboard data
        // to reflect the new counts.
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
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">แดชบอร์ดสรุปผล</h1>
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
            className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-purple-600 hover:border-purple-200 transition-colors shadow-sm"
            title="รีเฟรช"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">พัสดุทั้งหมดในคลัง</p>
            <h3 className="text-3xl font-bold text-gray-900">{data?.totalItems.toLocaleString()} <span className="text-sm font-normal text-gray-500">รายการ</span></h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">พัสดุต่ำกว่าเกณฑ์</p>
            <h3 className="text-3xl font-bold text-red-600">{data?.lowStockItems} <span className="text-sm font-normal text-gray-500">รายการ</span></h3>
          </div>
        </div>
      </div>

      {/* Low Stock Items List */}
      {data?.lowStockItemsList && data.lowStockItemsList.length > 0 && (
        <div className="bg-red-50/50 rounded-2xl shadow-sm border border-red-100 overflow-hidden">
          <div className="p-4 border-b border-red-100 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            <h2 className="text-lg font-bold text-red-900">รายการพัสดุต่ำกว่าเกณฑ์</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-red-100/50 text-red-800 text-sm border-b border-red-100">
                  <th className="p-4 font-medium">รหัสพัสดุ</th>
                  <th className="p-4 font-medium">ชื่อพัสดุ</th>
                  <th className="p-4 font-medium text-right">คงเหลือ</th>
                  <th className="p-4 font-medium text-right">ขั้นต่ำ</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {data.lowStockItemsList.map((item: any) => (
                  <tr key={item.id} className="border-b border-red-50 hover:bg-red-50 transition-colors">
                    <td className="p-4 text-red-900 font-mono">{item.id}</td>
                    <td className="p-4 font-medium text-red-900">{item.name}</td>
                    <td className="p-4 text-right font-bold text-red-600">{item.current}</td>
                    <td className="p-4 text-right text-red-800">{item.min}</td>
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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-900 mb-4">สถิติการรับเข้า-เบิกออก (7 วันล่าสุด)</h2>
          <div className="h-[300px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip 
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="in" name="รับเข้า" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="out" name="เบิกออก" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                ไม่มีข้อมูลการทำรายการ
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">สัดส่วนสถานะพัสดุ</h2>
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
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#111827', fontWeight: 500 }}
                  />
                  <Legend iconType="circle" verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                ไม่มีข้อมูลพัสดุ
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">รายการเคลื่อนไหวล่าสุด</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-sm border-b border-gray-100">
                <th className="p-4 font-medium">วันที่-เวลา</th>
                <th className="p-4 font-medium">ประเภท</th>
                <th className="p-4 font-medium">รายการพัสดุ</th>
                <th className="p-4 font-medium text-right">จำนวน</th>
                <th className="p-4 font-medium">ผู้ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {data?.recentTransactions.map((tx: any) => (
                <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-gray-500">{tx.date}</td>
                  <td className="p-4">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                      tx.type === 'in' ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                    )}>
                      {tx.type === 'in' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {tx.type === 'in' ? 'รับเข้า' : 'เบิกออก'}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-gray-900">{tx.item}</td>
                  <td className={cn(
                    "p-4 text-right font-bold",
                    tx.type === 'in' ? "text-emerald-600" : "text-orange-600"
                  )}>
                    {tx.type === 'in' ? '+' : '-'}{tx.qty}
                  </td>
                  <td className="p-4 text-gray-600">{tx.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
