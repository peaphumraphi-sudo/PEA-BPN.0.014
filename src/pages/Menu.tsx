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
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-4xl w-full relative z-10">
        <div className="flex justify-between items-start mb-16">
          <div className="flex-1">
            <h1 className="text-5xl font-black text-white mb-3 tracking-tighter uppercase">PEA BPN Inventory</h1>
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 bg-purple-600 rounded-full"></div>
              <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-xs">Select Operation Module</p>
            </div>
          </div>
          <button
            onClick={() => {
              onLogout();
              navigate('/login');
            }}
            className="flex items-center gap-2 px-6 py-3 text-red-500/70 hover:bg-red-500/10 hover:text-red-400 rounded-2xl transition-all duration-300 font-black uppercase tracking-widest text-[10px] border border-white/5 hover:border-red-500/20 shadow-xl"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {filteredNav.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.5, ease: "easeOut" }}
                whileHover={{ y: -8 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to={item.path}
                  className="flex flex-col items-center justify-center p-8 bg-gray-900/30 rounded-[2.5rem] border border-white/5 hover:border-purple-500/40 transition-all duration-500 group aspect-square relative overflow-hidden backdrop-blur-2xl shadow-2xl"
                >
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 ${item.color}`} />
                  <div className={`w-24 h-24 ${item.color} rounded-[2rem] flex items-center justify-center text-white mb-8 shadow-2xl group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 border border-white/10`}>
                    <Icon size={44} />
                  </div>
                  <span className="font-black text-white text-base text-center leading-tight group-hover:text-purple-400 transition-colors uppercase tracking-widest">{item.label}</span>
                  
                  {/* Decorative dot */}
                  <div className="absolute bottom-6 w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-purple-500 transition-colors"></div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
