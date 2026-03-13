import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../services/api';

interface LoginProps {
  onLogin: (user: any) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.login(username.trim(), pin.trim());
      
      if (response.success) {
        onLogin(response.user);
        navigate(response.user.role === 'admin' ? '/' : '/vehicle');
      } else {
        setError(response.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/30 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-800/20 blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md bg-black/60 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/5 p-10 z-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
        
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-purple-900 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-2xl shadow-purple-500/40 transform -rotate-12 hover:rotate-0 transition-all duration-500 border border-white/10">
            <span className="text-4xl font-black text-white tracking-tighter">PEA</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-3 tracking-tighter uppercase">BPN Inventory</h1>
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-purple-500/30"></div>
            <p className="text-purple-400/80 text-[10px] font-black uppercase tracking-[0.3em]">ระบบจัดการคลังพัสดุ</p>
            <div className="h-px w-8 bg-purple-500/30"></div>
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 backdrop-blur-sm"
          >
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">ชื่อผู้ใช้</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className="text-gray-600 group-focus-within:text-purple-500 transition-colors" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/40 border border-white/5 text-white rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all placeholder:text-gray-700 font-bold text-sm"
                placeholder="USERNAME"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">รหัสผ่าน</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-600 group-focus-within:text-purple-500 transition-colors" />
              </div>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-black/40 border border-white/5 text-white rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all placeholder:text-gray-700 font-bold text-sm"
                placeholder="PASSWORD"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl py-4 mt-6 transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-[0.2em] text-xs border border-white/10"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <span>เข้าสู่ระบบ</span>
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              </>
            )}
          </button>
        </form>
        
        <div className="mt-10 text-center">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
            Authorized Personnel Only
          </p>
        </div>
      </div>
    </div>
  );
}
