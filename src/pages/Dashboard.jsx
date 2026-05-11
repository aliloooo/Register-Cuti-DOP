import React, { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { getLeavePeriod } from '../lib/leaveLogic';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie 
} from 'recharts';
import { Users, Calendar, Clock, CheckCircle, TrendingUp } from 'lucide-react';
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
  const { employees, leaveRequests } = useStore();
  const [filterId, setFilterId] = useState('all');

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
    </div>
  );
};

export default Dashboard;
