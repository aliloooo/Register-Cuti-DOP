import React from 'react';
import { LayoutDashboard, Users, CalendarPlus, FileSpreadsheet, LogOut, Settings, ShieldCheck, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const logout = useStore(state => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  const userItems = [
    { id: 'input', label: 'Input Cuti', icon: CalendarPlus },
  ];

  const adminItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Data Karyawan', icon: Users },
    { id: 'recap', label: 'Rekap Cuti', icon: FileSpreadsheet },
  ];

  const MenuItem = ({ item, index }) => (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={() => setActiveTab(item.id)}
      className={`sidebar-item group w-full ${activeTab === item.id ? 'active' : ''}`}
    >
      <item.icon size={20} className={activeTab === item.id ? 'text-primary-600' : 'text-slate-400 group-hover:text-primary-500'} />
      <span className="text-sm font-semibold tracking-tight">{item.label}</span>
    </motion.button>
  );

  return (
    <aside className="w-64 h-screen bg-[#fdfdfd] border-r border-slate-100 flex flex-col fixed left-0 top-0 z-20">
      <div className="p-8 pb-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 mb-10"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
            <CalendarPlus size={22} />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-slate-800 leading-tight tracking-tight">DOPsys</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">Workspace</p>
          </div>
        </motion.div>

        <div className="space-y-8">
          {/* User Section */}
          <div className="space-y-3">
            <div className="px-4 flex items-center gap-2">
              <UserCircle size={12} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">User Menu</span>
            </div>
            <nav className="space-y-1">
              {userItems.map((item, index) => (
                <MenuItem key={item.id} item={item} index={index} />
              ))}
            </nav>
          </div>

          {/* Admin Section */}
          <div className="space-y-3">
            <div className="px-4 flex items-center gap-2">
              <ShieldCheck size={12} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Admin Menu</span>
            </div>
            <nav className="space-y-1">
              {adminItems.map((item, index) => (
                <MenuItem key={item.id} item={item} index={index + userItems.length} />
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="mt-auto p-8 pt-4 space-y-2">
        <button 
          onClick={handleLogout}
          className="sidebar-item group w-full text-red-500 hover:text-red-600 hover:bg-red-50/50"
        >
          <LogOut size={20} />
          <span className="text-sm font-semibold tracking-tight">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
