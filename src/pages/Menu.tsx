import { Link, useNavigate } from 'react-router-dom';
import { Package, Truck, Wrench, LayoutDashboard, PackagePlus, Users, QrCode, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

interface MenuProps {
  user: any;
  onLogout: () => void;
}

export function Menu({ user, onLogout }: MenuProps) {
  const navigate = useNavigate();
  const navItems = [
    { path: '/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard, roles: ['admin'], color: 'bg-blue-500' },
    { path: '/main', label: 'คลังพัสดุหลัก', icon: Package, roles: ['admin'], color: 'bg-purple-500' },
    { path: '/qr-generator', label: 'สร้าง QR Code', icon: QrCode, roles: ['admin'], color: 'bg-indigo-500' },
    { path: '/vehicle', label: 'คลังพัสดุประจำรถ', icon: Truck, roles: ['admin', 'user'], color: 'bg-emerald-500' },
    { path: '/withdraw-vehicle', label: 'เบิกของเข้ารถ', icon: PackagePlus, roles: ['admin', 'user'], color: 'bg-orange-500' },
    { path: '/tools', label: 'เครื่องมือประจำรถ', icon: Wrench, roles: ['admin', 'user'], color: 'bg-amber-500' },
    { path: '/users', label: 'ตั้งค่าการใช้สิทธิ์', icon: Users, roles: ['admin'], color: 'bg-rose-500' },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role || 'user'));

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-purple-50/30 flex items-center justify-center py-12 px-4">
      <div className="max-w-4xl w-full">
        <div className="flex justify-between items-start mb-12">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PEA BPN Inventory</h1>
          <p className="text-gray-500">เลือกเมนูที่ต้องการดำเนินการ</p>
        </div>
        <button
          onClick={() => {
            onLogout();
            navigate('/login');
          }}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
        >
          <LogOut size={20} />
          <span>ออกจากระบบ</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {filteredNav.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to={item.path}
                className="flex flex-col items-center justify-center p-6 bg-white rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-2xl hover:border-purple-200 transition-all duration-300 group aspect-square relative overflow-hidden"
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity ${item.color}`} />
                <div className={`w-20 h-20 ${item.color} rounded-3xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:rotate-6 transition-transform duration-300`}>
                  <Icon size={40} />
                </div>
                <span className="font-bold text-gray-800 text-lg text-center leading-tight">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  </div>
  );
}
