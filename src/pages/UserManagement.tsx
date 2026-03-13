import { useState, useEffect, FormEvent } from 'react';
import { Users, Plus, Edit2, Trash2, Save, X, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { cn } from '../utils/cn';

interface UserManagementProps {
  user: any;
}

export function UserManagement({ user }: UserManagementProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  // Form state
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('user');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await api.getUsers();
      if (response.success) {
        setUsers(response.users);
      } else {
        console.error('Failed to load users:', response.message);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await api.syncAllFromSheets();
      if (response.success) {
        alert('ซิงค์ข้อมูลผู้ใช้งานสำเร็จ');
        loadData();
      } else {
        alert(`ผิดพลาด: ${response.message}`);
      }
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการซิงค์ข้อมูล');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenModal = (userToEdit: any = null) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setUsername(userToEdit.username);
      setPin(userToEdit.pin);
      setName(userToEdit.name);
      setRole(userToEdit.role);
    } else {
      setEditingUser(null);
      setUsername('');
      setPin('');
      setName('');
      setRole('user');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username || !pin || !name) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);
    try {
      const userData = { 
        username: username.trim(), 
        pin: pin.trim(), 
        name: name.trim(), 
        role 
      };
      let response;
      
      if (editingUser) {
        response = await api.updateUser(userData);
      } else {
        response = await api.addUser(userData);
      }

      if (response.success) {
        alert(editingUser ? 'อัปเดตข้อมูลสำเร็จ' : 'เพิ่มผู้ใช้งานสำเร็จ');
        setIsModalOpen(false);
        loadData();
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

  const handleDelete = async (usernameToDelete: string) => {
    if (usernameToDelete === user.username) {
      alert('ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่ได้');
      return;
    }

    if (window.confirm(`คุณต้องการลบผู้ใช้งาน ${usernameToDelete} ใช่หรือไม่?`)) {
      try {
        const response = await api.deleteUser(usernameToDelete);
        if (response.success) {
          alert('ลบผู้ใช้งานสำเร็จ');
          loadData();
        } else {
          alert(`เกิดข้อผิดพลาด: ${response.message}`);
        }
      } catch (error) {
        console.error(error);
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ');
      }
    }
  };

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-900/50 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ตั้งค่าการใช้สิทธิ์</h1>
            <p className="text-sm text-gray-400 mt-1">จัดการข้อมูลผู้ใช้งานและสิทธิ์การเข้าถึง</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all flex items-center gap-2 shrink-0 shadow-xl shadow-emerald-500/20 disabled:opacity-50 uppercase tracking-widest text-xs"
          >
            <RefreshCw size={20} className={cn(isSyncing && "animate-spin")} />
            {isSyncing ? 'กำลังซิงค์...' : 'ซิงค์จาก Sheets'}
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl transition-all flex items-center gap-2 shrink-0 shadow-xl shadow-purple-500/25 uppercase tracking-widest text-xs"
          >
            <Plus size={20} /> เพิ่มผู้ใช้งาน
          </button>
        </div>
      </div>

      <div className="bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/50 text-gray-500 text-[10px] font-bold uppercase tracking-widest border-b border-gray-800">
                <th className="p-4">รหัสพนักงาน (Username)</th>
                <th className="p-4">ชื่อ-สกุลจริง</th>
                <th className="p-4">สิทธิ์การใช้งาน</th>
                <th className="p-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest">กำลังโหลดข้อมูล...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest">ไม่พบข้อมูลผู้ใช้งาน</td>
                </tr>
              ) : (
                users.map((u: any) => (
                  <tr key={u.username} className="border-b border-gray-800 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold text-white font-mono">{u.username}</td>
                    <td className="p-4 text-gray-300">{u.name}</td>
                    <td className="p-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                        u.role === 'admin' ? "bg-purple-900/40 text-purple-400 border-purple-500/20" : "bg-blue-900/40 text-blue-400 border-blue-500/20"
                      )}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(u)}
                          className="p-2 text-gray-500 hover:text-purple-400 hover:bg-purple-900/30 rounded-lg transition-colors border border-transparent hover:border-purple-500/20"
                          title="แก้ไข"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(u.username)}
                          disabled={u.username === user.username}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-red-500/20"
                          title="ลบ"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="p-6 bg-gradient-to-br from-purple-600 to-purple-800 text-white flex justify-between items-start border-b border-purple-500/20">
              <div>
                <h3 className="text-xl font-black uppercase tracking-widest mb-1">{editingUser ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}</h3>
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest">กำหนดรหัสพนักงานและสิทธิ์</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">รหัสพนักงาน (Username)</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={!!editingUser}
                  className="w-full px-4 py-2 bg-black border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm"
                  placeholder="เช่น 501234"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">รหัสผ่าน (PIN)</label>
                <input 
                  type="text" 
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-4 py-2 bg-black border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-white text-sm"
                  placeholder="รหัสผ่านสำหรับเข้าสู่ระบบ"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">ชื่อ-สกุลจริง</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-black border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-white text-sm"
                  placeholder="ชื่อและนามสกุล"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">สิทธิ์การใช้งาน</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2 bg-black border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-white text-sm"
                >
                  <option value="user">ผู้ใช้งานทั่วไป (User)</option>
                  <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl transition-all uppercase tracking-widest text-xs"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl transition-all shadow-xl shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 uppercase tracking-widest text-xs"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : <><Save size={20} /> บันทึก</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
