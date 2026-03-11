import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MainInventory } from './pages/MainInventory';
import { QRGenerator } from './pages/QRGenerator';
import { VehicleInventory } from './pages/VehicleInventory';
import { WithdrawToVehicle } from './pages/WithdrawToVehicle';
import { VehicleTools } from './pages/VehicleTools';
import { UserManagement } from './pages/UserManagement';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('pea_bpn_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    // Auto-sync check: if Firebase is empty, pull from Sheets
    const checkAndSync = async () => {
      try {
        const { api } = await import('./services/api');
        const usersResult = await api.getUsers();
        if (usersResult.success && (!usersResult.users || usersResult.users.length === 0)) {
          console.log('Firebase empty, auto-syncing from Google Sheets...');
          await api.syncAllFromSheets();
        }
      } catch (e) {
        console.error('Auto-sync failed:', e);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAndSync();
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('pea_bpn_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pea_bpn_user');
  };

  if (isChecking) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={!user ? <Login onLogin={handleLogin} /> : <Navigate to={user.role === 'admin' ? '/' : '/vehicle'} replace />} 
        />
        
        <Route
          path="/"
          element={
            user ? (
              <Layout user={user} onLogout={handleLogout}>
                {user.role === 'admin' ? <Dashboard /> : <Navigate to="/vehicle" replace />}
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/main"
          element={
            user ? (
              <Layout user={user} onLogout={handleLogout}>
                {user.role === 'admin' ? <MainInventory user={user} /> : <Navigate to="/vehicle" replace />}
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/qr-generator"
          element={
            user ? (
              <Layout user={user} onLogout={handleLogout}>
                {user.role === 'admin' ? <QRGenerator /> : <Navigate to="/vehicle" replace />}
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/vehicle"
          element={
            user ? (
              <Layout user={user} onLogout={handleLogout}>
                <VehicleInventory user={user} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/withdraw-vehicle"
          element={
            user ? (
              <Layout user={user} onLogout={handleLogout}>
                <WithdrawToVehicle user={user} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/tools"
          element={
            user ? (
              <Layout user={user} onLogout={handleLogout}>
                <VehicleTools user={user} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/users"
          element={
            user ? (
              <Layout user={user} onLogout={handleLogout}>
                {user.role === 'admin' ? <UserManagement user={user} /> : <Navigate to="/vehicle" replace />}
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
