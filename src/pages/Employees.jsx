import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { getLeavePeriod } from '../lib/leaveLogic';
import { Plus, Search, Filter, MoreHorizontal, User, Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const Employees = () => {
  const { employees, leaveRequests, addEmployee, updateEmployee, deleteEmployee, searchTerm, setSearchTerm } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  const [newEmp, setNewEmp] = useState({
    name: '', position: '', pn: '', team: '', tmt: '', annual_leave_quota: 12
  });
  
  const [filterTeam, setFilterTeam] = useState('All');
  const [filterPosition, setFilterPosition] = useState('All');

  const teams = useMemo(() => {
    const set = new Set(employees.map(emp => emp.team).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [employees]);

  const positions = useMemo(() => {
    const set = new Set(employees.map(emp => emp.position).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [employees]);

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.pn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.team?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTeam = filterTeam === 'All' || emp.team === filterTeam;
    const matchesPosition = filterPosition === 'All' || emp.position === filterPosition;
    
    return matchesSearch && matchesTeam && matchesPosition;
  });

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (isEdit) {
      const { error } = await updateEmployee(currentId, newEmp);
      if (!error) {
        setShowModal(false);
        setIsEdit(false);
        setCurrentId(null);
        setNewEmp({ name: '', position: '', pn: '', team: '', tmt: '', annual_leave_quota: 12 });
      } else {
        alert(error.message);
      }
    } else {
      const { error } = await addEmployee(newEmp);
      if (!error) {
        setShowModal(false);
        setNewEmp({ name: '', position: '', pn: '', team: '', tmt: '', annual_leave_quota: 12 });
      } else {
        alert(error.message);
      }
    }
  };

  const handleEdit = (emp) => {
    setIsEdit(true);
    setCurrentId(emp.id);
    setNewEmp({
      name: emp.name,
      position: emp.position,
      pn: emp.pn,
      team: emp.team,
      tmt: emp.tmt,
      annual_leave_quota: emp.annual_leave_quota
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data karyawan ini?')) {
      const { error } = await deleteEmployee(id);
      if (error) alert(error.message);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-3xl font-bold text-slate-800 font-display tracking-tight">Data Karyawan</h2>
          <p className="text-slate-500 font-medium">Kelola informasi dan hak cuti tahunan karyawan</p>
        </motion.div>
        <motion.button 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setShowModal(true)}
          className="btn-primary w-full md:w-fit"
        >
          <Plus size={18} />
          <span>Tambah Karyawan</span>
        </motion.button>
      </div>


      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center gap-4 bg-white p-5 rounded-3xl shadow-sm border border-slate-100"
      >
        <div className="flex items-center gap-2 text-slate-400 mr-2">
          <Filter size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Filter Data:</span>
        </div>
        
        <div className="flex-1 flex flex-wrap gap-4">
          <div className="flex flex-col gap-1.5 min-w-[160px]">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter ml-1">Berdasarkan Tim</span>
            <select 
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer"
            >
              {teams.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 min-w-[160px]">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter ml-1">Berdasarkan Jabatan</span>
            <select 
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer"
            >
              {positions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {(filterTeam !== 'All' || filterPosition !== 'All') && (
          <button 
            onClick={() => {
              setFilterTeam('All');
              setFilterPosition('All');
            }}
            className="text-[10px] font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-4 py-2 rounded-xl transition-all"
          >
            Reset Filter
          </button>
        )}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="table-container"
      >
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>PN / ID</th>
                <th>Jabatan & Tim</th>
                <th>TMT</th>
                <th>Periode Aktif</th>
                <th>Sisa Cuti</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp, index) => {
                const period = getLeavePeriod(emp.tmt);
                const used = leaveRequests
                  .filter(r => r.employee_id === emp.id)
                  .filter(r => {
                    const d = new Date(r.start_date);
                    return d >= period.start && d <= period.end;
                  })
                  .reduce((sum, r) => sum + r.total_days, 0);

                return (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + (index * 0.05) }}
                    key={emp.id}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                          {emp.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div className="font-bold text-slate-800 leading-tight">{emp.name}</div>
                      </div>
                    </td>
                    <td><code className="text-[11px] font-bold bg-slate-100 px-2 py-1 rounded-lg text-slate-500">{emp.pn}</code></td>
                    <td>
                      <div className="text-sm font-bold text-slate-700">{emp.position}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{emp.team}</div>
                    </td>
                    <td>
                      <span className="text-sm font-medium text-slate-600">
                        {emp.tmt && !isNaN(new Date(emp.tmt)) ? format(new Date(emp.tmt), 'dd MMM yyyy') : '-'}
                      </span>
                    </td>
                    <td>
                      <div className="text-[11px] font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg inline-block">{period.label}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Year {period.yearIndex}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                           <div 
                             className={`h-full rounded-full ${emp.annual_leave_quota - used > 3 ? 'bg-emerald-500' : 'bg-red-500'}`}
                             style={{ width: `${Math.min(100, ((emp.annual_leave_quota - used) / emp.annual_leave_quota) * 100)}%` }}
                           ></div>
                        </div>
                        <span className={`text-sm font-bold ${emp.annual_leave_quota - used > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {emp.annual_leave_quota - used}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">/ {emp.annual_leave_quota}</span>
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => handleEdit(emp)}
                          className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-primary-600 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(emp.id)}
                          className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {filteredEmployees.length === 0 && (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-slate-300" />
              </div>
              <p className="text-slate-400 font-medium italic">Tidak ada data karyawan ditemukan.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Add Employee Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden relative z-10 border border-slate-100"
            >
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 font-display">
                    {isEdit ? 'Edit Data Karyawan' : 'Registrasi Karyawan'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {isEdit ? 'Perbarui informasi detail karyawan' : 'Input data dasar untuk sistem cuti'}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setShowModal(false);
                    setIsEdit(false);
                    setNewEmp({ name: '', position: '', pn: '', team: '', tmt: '', annual_leave_quota: 12 });
                  }} 
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white text-slate-400 hover:text-slate-600 shadow-sm transition-all"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleAddEmployee} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nama Lengkap</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input 
                        required 
                        className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none text-sm font-medium transition-all"
                        placeholder="John Doe"
                        value={newEmp.name}
                        onChange={e => setNewEmp({...newEmp, name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">PN / ID</label>
                    <input 
                      required 
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none text-sm font-medium transition-all"
                      placeholder="800001"
                      value={newEmp.pn}
                      onChange={e => setNewEmp({...newEmp, pn: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Jabatan</label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none text-sm font-medium transition-all appearance-none cursor-pointer"
                      value={newEmp.position}
                      onChange={e => setNewEmp({...newEmp, position: e.target.value})}
                    >
                      <option value="">Pilih Jabatan</option>
                      <option value="Team Leader">Team Leader</option>
                      <option value="Senior Manager">Senior Manager</option>
                      <option value="Junior Manager">Junior Manager</option>
                      <option value="Associate">Associate</option>
                      <option value="Assistant">Assistant</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Team</label>
                    <input 
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none text-sm font-medium transition-all"
                      placeholder="DOP"
                      value={newEmp.team}
                      onChange={e => setNewEmp({...newEmp, team: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Join Date (TMT)</label>
                    <input 
                      type="date" 
                      required 
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none text-sm font-medium transition-all"
                      value={newEmp.tmt}
                      onChange={e => setNewEmp({...newEmp, tmt: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Hak Cuti Tahunan (Hari)</label>
                     <input 
                      type="number" 
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none text-sm font-medium transition-all"
                      value={newEmp.annual_leave_quota}
                      onChange={e => setNewEmp({...newEmp, annual_leave_quota: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3.5 text-sm font-bold text-slate-500 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl hover:shadow-xl hover:shadow-primary-500/20 transition-all active:scale-95"
                  >
                    Simpan Data
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Employees;
