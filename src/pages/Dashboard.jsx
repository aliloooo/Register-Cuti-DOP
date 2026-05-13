import React, { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { getLeavePeriod } from '../lib/leaveLogic';
import { format } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie 
} from 'recharts';
import { Users, Calendar, Clock, CheckCircle, TrendingUp, PlusCircle, AlertCircle, CalendarDays, Edit2, Trash2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import SuccessModal from '../components/SuccessModal';
import { motion } from 'framer-motion';

const StatCard = ({ label, value, icon: Icon, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass-card p-6 flex items-start justify-between group"
  >
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
        <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5">
          <TrendingUp size={10} /> +0%
        </span>
      </div>
    </div>
    <div className={`stat-icon-wrapper ${color} bg-opacity-10 text-current`}>
      <Icon size={24} className={color.replace('bg-', 'text-')} />
    </div>
  </motion.div>
);

const Dashboard = () => {
  const { employees, leaveRequests, jointLeaves, addJointLeave, deleteJointLeave, updateJointLeave } = useStore();
  const [filterId, setFilterId] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [editingJointLeave, setEditingJointLeave] = useState(null);
  const [cbData, setCbData] = useState({
    date: '',
    description: 'Cuti Bersama ' + new Date().getFullYear()
  });

  const handleMassCutiBersama = async (e) => {
    e.preventDefault();
    if (!cbData.date) return;
    
    setIsSubmitting(true);
    
    let error;
    if (editingJointLeave) {
      // Edit mode
      const result = await updateJointLeave(editingJointLeave.id, { 
        date: cbData.date, 
        description: cbData.description 
      });
      error = result.error;
    } else {
      // Create mode
      const result = await addJointLeave({
        date: cbData.date,
        description: cbData.description
      });
      error = result.error;
    }
    
    setIsSubmitting(false);
    if (!error) {
      setSuccess(true);
      setIsModalOpen(false);
      setEditingJointLeave(null);
      setCbData({ date: '', description: 'Cuti Bersama ' + new Date().getFullYear() });
    } else {
      alert(error.message);
    }
  };

  const handleDeleteJointLeave = async (ev) => {
    if (window.confirm(`Hapus seluruh data cuti bersama "${ev.description}" pada ${format(new Date(ev.date), 'dd MMM yyyy')}?`)) {
      const { error } = await deleteJointLeave(ev.id);
      if (error) alert(error.message);
    }
  };

  const openEditModal = (ev) => {
    setEditingJointLeave(ev);
    setCbData({
      date: ev.date,
      description: ev.description
    });
    setIsModalOpen(true);
  };

  const stats = useMemo(() => {
    const targetEmployees = filterId === 'all' 
      ? employees 
      : employees.filter(e => e.id === filterId);

    const totalEmployees = targetEmployees.length;
    let totalQuota = 0;
    let totalUsed = 0;

    const employeeUsage = targetEmployees.map(emp => {
      const currentPeriod = getLeavePeriod(emp.tmt);
      const usedInPeriod = leaveRequests
        .filter(req => req.employee_id === emp.id)
        .filter(req => {
            const reqDate = new Date(req.start_date);
            return reqDate >= currentPeriod.start && reqDate <= currentPeriod.end;
        })
        .reduce((sum, req) => sum + req.total_days, 0);
      
      totalQuota += emp.annual_leave_quota;
      totalUsed += usedInPeriod;

      return {
        name: emp.name,
        used: usedInPeriod,
        remaining: Math.max(0, emp.annual_leave_quota - usedInPeriod)
      };
    });

    const topTakers = [...employeeUsage]
      .sort((a, b) => b.used - a.used)
      .slice(0, 5);

    return {
      totalEmployees,
      totalQuota,
      totalUsed,
      remaining: Math.max(0, totalQuota - totalUsed),
      topTakers
    };
  }, [employees, leaveRequests, filterId]);

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-10">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <h2 className="text-3xl font-bold text-slate-800 font-display tracking-tight">Dashboard Overview</h2>
          <p className="text-slate-500 font-medium">Real-time insight into employee leave metrics</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary-500/20 transition-all active:scale-95"
          >
            <PlusCircle size={18} />
            Input Cuti Bersama
          </button>
          
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <div className="pl-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter:</div>
          <select 
            value={filterId}
            onChange={(e) => setFilterId(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 pr-8 cursor-pointer focus:ring-0"
          >
            <option value="all">Seluruh Karyawan</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Karyawan" value={stats.totalEmployees} icon={Users} color="bg-blue-500" delay={0.1} />
        <StatCard label="Total Hak Cuti" value={stats.totalQuota} icon={Calendar} color="bg-emerald-500" delay={0.2} />
        <StatCard label="Total Terpakai" value={stats.totalUsed} icon={Clock} color="bg-amber-500" delay={0.3} />
        <StatCard label="Sisa Cuti" value={stats.remaining} icon={CheckCircle} color="bg-indigo-500" delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 glass-card p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-800 font-display">Leave Utilization by Employee</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Top 5 Performers
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topTakers} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px'}}
                />
                <Bar dataKey="used" radius={[6, 6, 0, 0]} barSize={32}>
                  {stats.topTakers.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-8 flex flex-col"
        >
          <h3 className="text-lg font-bold text-slate-800 mb-8 font-display">Distribution</h3>
          <div className="flex-1 flex items-center justify-center relative">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={[
                     { name: 'Terpakai', value: stats.totalUsed },
                     { name: 'Sisa', value: stats.remaining }
                   ]}
                   innerRadius={70}
                   outerRadius={90}
                   paddingAngle={8}
                   dataKey="value"
                   stroke="none"
                 >
                   <Cell fill="#0ea5e9" />
                   <Cell fill="#f1f5f9" />
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-slate-800">{stats.totalUsed}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Days Used</span>
             </div>
          </div>
          <div className="space-y-3 mt-8">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-primary-500"></div>
                <span className="text-xs font-bold text-slate-600">Terpakai</span>
              </div>
              <span className="text-xs font-bold text-slate-800">{Math.round((stats.totalUsed / (stats.totalQuota || 1)) * 100)}%</span>
            </div>
            <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                <span className="text-xs font-bold text-slate-600">Sisa</span>
              </div>
              <span className="text-xs font-bold text-slate-800">{Math.round((stats.remaining / (stats.totalQuota || 1)) * 100)}%</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                <Clock size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 font-display uppercase tracking-tight">Pengajuan Terbaru</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-4 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Karyawan</th>
                  <th className="px-4 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</th>
                  <th className="px-4 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Durasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leaveRequests.filter(r => 
                  !jointLeaves.some(jl => jl.date === r.start_date && jl.description === r.description)
                ).slice(0, 5).map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-slate-800">{req.employees?.name || 'Karyawan'}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">{req.employees?.pn || '-'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-[11px] font-bold text-slate-600">
                        {req.start_date === req.end_date 
                          ? format(new Date(req.start_date), 'dd MMM yyyy')
                          : `${format(new Date(req.start_date), 'dd MMM')} - ${format(new Date(req.end_date), 'dd MMM yyyy')}`
                        }
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-lg text-[10px] font-bold">
                        {req.total_days} Hari
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Joint Leave History Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass-card p-8 border-primary-100 bg-gradient-to-br from-white to-primary-50/10"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                <CalendarDays size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 font-display uppercase tracking-tight">Daftar Cuti Bersama</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Event / Keterangan</th>
                  <th className="px-4 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</th>
                  <th className="px-4 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {jointLeaves.slice(0, 5).map((ev) => (
                  <tr key={ev.id} className="hover:bg-white/50 transition-colors group">
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-slate-800">{ev.description}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                        <span className="text-[10px] font-bold text-primary-600 uppercase tracking-tight">Official Holiday</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="inline-block px-3 py-1 bg-white border border-slate-100 rounded-xl shadow-sm text-[10px] font-bold text-slate-700">
                        {format(new Date(ev.date), 'dd MMM yyyy')}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => openEditModal(ev)}
                          className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                          title="Edit Event"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteJointLeave(ev)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Hapus Event"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {jointLeaves.length === 0 && (
                  <tr>
                    <td colSpan="3" className="py-20 text-center">
                      <p className="text-slate-400 text-sm italic">Belum ada data cuti bersama.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>


      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-8 pb-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{editingJointLeave ? 'Edit Cuti Bersama' : 'Mass Input Cuti Bersama'}</h3>
                    <p className="text-xs text-slate-500 font-medium">{editingJointLeave ? 'Perbarui data cuti bersama yang sudah terinput' : 'Potong jatah cuti seluruh karyawan sekaligus'}</p>
                  </div>
                </div>

                <form onSubmit={handleMassCutiBersama} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Tanggal Cuti Bersama</label>
                    <input 
                      type="date"
                      required
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none font-semibold text-sm transition-all"
                      value={cbData.date}
                      onChange={e => setCbData({...cbData, date: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Keterangan / Nama Event</label>
                    <input 
                      type="text"
                      required
                      placeholder="Contoh: Cuti Bersama Idul Fitri"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none font-semibold text-sm transition-all"
                      value={cbData.description}
                      onChange={e => setCbData({...cbData, description: e.target.value})}
                    />
                  </div>

                  {!editingJointLeave && (
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                      <AlertCircle className="text-amber-500 shrink-0" size={18} />
                      <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                        Tindakan ini akan membuat satu record cuti untuk <span className="font-bold">seluruh ({employees.length}) karyawan</span>. Pastikan tanggal dan keterangan sudah benar.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2 pb-8">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setEditingJointLeave(null);
                      }}
                      className="flex-1 px-5 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all text-sm"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-[2] bg-primary-600 hover:bg-primary-700 text-white px-5 py-4 rounded-2xl font-bold text-sm shadow-lg shadow-primary-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>{editingJointLeave ? 'Simpan Perubahan' : 'Terapkan ke Semua'}</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SuccessModal 
        isOpen={success}
        onClose={() => setSuccess(false)}
        title="Input Berhasil!"
        message={`Cuti bersama telah berhasil diterapkan kepada ${employees.length} karyawan.`}
      />
    </div>
  );
};

export default Dashboard;
