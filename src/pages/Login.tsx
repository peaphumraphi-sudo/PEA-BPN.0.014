import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, Loader2 } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Mock login for now, replace with actual API call later
      // const res = await api.login(username, pin);
      
      // Temporary mock logic
      let role = 'user';
      if (username === 'admin') role = 'admin';
      
      if (username && pin) {
        const user = { username, name: username, role };
        onLogin(user);
        navigate(role === 'admin' ? '/' : '/main');
      } else {
        setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
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

      <div className="w-full max-w-md bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-800 p-8 z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-800 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
            <span className="text-3xl font-black text-white tracking-tighter">PEA</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">BPN Inventory</h1>
          <p className="text-purple-300/80 text-sm font-medium">ระบบจัดการคลังพัสดุ</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-400 ml-1">ชื่อผู้ใช้</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className="text-gray-500" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all placeholder:text-gray-600"
                placeholder="กรอกชื่อผู้ใช้"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-400 ml-1">รหัสผ่าน</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-500" />
              </div>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all placeholder:text-gray-600"
                placeholder="กรอกรหัสผ่าน"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl py-3.5 mt-4 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <span>เข้าสู่ระบบ</span>
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-600">
            เฉพาะผู้ดูแลระบบและผู้ใช้ที่ได้รับอนุญาตเท่านั้น
          </p>
        </div>
      </div>
    </div>
  );
}
