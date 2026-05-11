import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import LeaveEntry from './pages/LeaveEntry';
import Recap from './pages/Recap';
import Login from './pages/Login';
import { useStore } from './store/useStore';
import { Bell, Search, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLayout = ({ children, activeTab, setActiveTab }) => {
  const { isAuthenticated, fetchEmployees, fetchLeaveRequests, notifications, unreadCount, clearUnread, searchTerm, setSearchTerm } = useStore();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const hasCredentials = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    if (isAuthenticated) {
      fetchEmployees();
      fetchLeaveRequests();
    }
  }, [isAuthenticated, fetchEmployees, fetchLeaveRequests]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#fdfdfd]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 ml-64 p-10">

        <header className="flex items-center justify-between mb-12">
          <div className="relative w-96 hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Quick search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 transition-all text-sm shadow-sm outline-none font-medium"
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) clearUnread();
                }}
                className="p-3 text-slate-400 hover:text-primary-600 hover:bg-white rounded-2xl transition-all relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[8px] font-bold text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)}></div>
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-40 overflow-hidden"
                    >
                      <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 text-sm">Notifikasi</h3>
                        <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">Terbaru</span>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <Bell size={24} className="mx-auto text-slate-200 mb-2" />
                            <p className="text-xs text-slate-400 font-medium italic">Belum ada notifikasi baru</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600 flex-shrink-0">
                                  <Bell size={14} />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{n.title}</p>
                                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                                  <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase">{n.time}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="h-10 w-px bg-slate-100"></div>
            <div className="flex items-center gap-4 pl-2 group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">Admin User</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Super Admin</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-tr from-primary-600 to-primary-400 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
                AD
              </div>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

const UserLayout = ({ children }) => {
  const { fetchEmployees } = useStore();

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return (
    <div className="min-h-screen bg-[#fdfdfd] p-10">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Settings size={24} />
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
};

function AppContent() {
  const [activeTab, setActiveTab] = React.useState('dashboard');

  return (
    <Routes>
      <Route path="/" element={<UserLayout><LeaveEntry /></UserLayout>} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={
        <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'employees' && <Employees />}
          {activeTab === 'input' && <LeaveEntry />}
          {activeTab === 'recap' && <Recap />}
        </AdminLayout>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const { checkAuth, subscribeToLeaveRequests } = useStore();

  useEffect(() => {
    checkAuth();
    const unsubscribe = subscribeToLeaveRequests();
    return () => unsubscribe && unsubscribe();
  }, [checkAuth, subscribeToLeaveRequests]);

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
