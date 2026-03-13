import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Package, Truck, Wrench, LayoutDashboard, LogOut, Menu, X, PackagePlus, Users, QrCode, Grid } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../utils/cn';

interface LayoutProps {
  children: ReactNode;
  user: any;
  onLogout: () => void;
}

export function Layout({ children, user, onLogout }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', label: 'หน้าแรก', icon: Grid, roles: ['admin', 'user'] },
    { path: '/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard, roles: ['admin'] },
    { path: '/main', label: 'คลังพัสดุหลัก', icon: Package, roles: ['admin'] },
    { path: '/qr-generator', label: 'สร้าง QR Code', icon: QrCode, roles: ['admin'] },
    { path: '/vehicle', label: 'คลังพัสดุประจำรถ', icon: Truck, roles: ['admin', 'user'] },
    { path: '/withdraw-vehicle', label: 'เบิกของเข้ารถ', icon: PackagePlus, roles: ['admin', 'user'] },
    { path: '/tools', label: 'เครื่องมือประจำรถ', icon: Wrench, roles: ['admin', 'user'] },
    { path: '/users', label: 'ตั้งค่าการใช้สิทธิ์', icon: Users, roles: ['admin'] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role || 'user'));

  const isMenuPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-black flex flex-col md:flex-row font-sans text-white">
      {/* Mobile Header */}
      <div className={cn(
        "md:hidden bg-black/80 backdrop-blur-md text-white p-4 flex justify-between items-center z-20 shadow-md border-b border-gray-800",
        isMenuPage && "hidden"
      )}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center font-black text-white shadow-lg shadow-purple-500/20">
            PEA
          </div>
          <span className="font-black text-lg tracking-tighter uppercase">BPN Inventory</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-gray-800 rounded-xl transition-all">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      {!isMenuPage && (
        <div className={cn(
          "fixed inset-y-0 left-0 w-64 bg-gray-950 text-white transform transition-transform duration-300 ease-in-out z-30 flex flex-col shadow-2xl border-r border-gray-900",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "md:relative md:flex-shrink-0"
        )}>
          <div className="p-6 hidden md:flex items-center gap-3 border-b border-gray-900">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center font-black text-white shadow-xl shadow-purple-500/30 transform -rotate-6">
              PEA
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter uppercase">BPN Inventory</h1>
              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">ระบบจัดการคลังพัสดุ</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                    isActive 
                      ? "bg-purple-600 text-white shadow-xl shadow-purple-500/20" 
                      : "text-gray-500 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeNav"
                      className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-800 -z-10"
                    />
                  )}
                  <Icon size={20} className={cn("transition-all duration-300", isActive ? "text-white scale-110" : "text-gray-600 group-hover:text-purple-400 group-hover:scale-110")} />
                  <span className={cn("text-sm font-bold tracking-tight", isActive ? "opacity-100" : "opacity-80 group-hover:opacity-100")}>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="p-4 border-t border-gray-900 bg-black/20">
            <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-2xl bg-gray-900/30 border border-gray-800/50 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-full bg-purple-900/50 flex items-center justify-center text-purple-400 font-black border border-purple-500/20 shadow-inner">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white truncate uppercase tracking-tight">{user?.name || 'User'}</p>
                <p className="text-[10px] font-bold text-gray-600 truncate uppercase tracking-widest">{user?.role || 'User'}</p>
              </div>
            </div>
            <button
              onClick={() => {
                onLogout();
                navigate('/login');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500/70 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 font-bold text-xs uppercase tracking-widest group"
            >
              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      )}

      {/* Overlay for mobile */}
      {isMobileMenuOpen && !isMenuPage && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-black">
        <main className={cn(
          "flex-1 overflow-y-auto p-4 md:p-8",
          isMenuPage && "p-0 md:p-0 bg-transparent"
        )}>
          <div className={cn(
            "max-w-6xl mx-auto",
            isMenuPage && "max-w-none"
          )}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
