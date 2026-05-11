import React, { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { getMonthlyColumns, getLeavePeriod } from '../lib/leaveLogic';
import { getMonth, format, parseISO } from 'date-fns';
import { Download, FileSpreadsheet, Info, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Recap = () => {
  const { employees, leaveRequests, deleteLeaveRequest, updateLeaveRequest, searchTerm } = useStore();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [editFormData, setEditFormData] = useState({
    start_date: '',
    end_date: '',
    total_days: 0,
    description: ''
  });
  const months = getMonthlyColumns();

  const availableYears = useMemo(() => {
    const years = new Set();
    leaveRequests.forEach(req => {
      if (req.start_date) {
        years.add(new Date(req.start_date).getFullYear().toString());
      }
    });
    years.add(new Date().getFullYear().toString());
    return Array.from(years).sort((a, b) => b - a);
  }, [leaveRequests]);

  const recapData = useMemo(() => {
    const filteredEmployees = employees.filter(emp => 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.pn.includes(searchTerm) ||
      (emp.team && emp.team.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return filteredEmployees.map(emp => {
      const monthlyValues = Array(12).fill(0);
      
      // 1. Data untuk Tampilan Distribusi (Tahun Kalender)
      const calendarLeaves = leaveRequests.filter(req => {
        if (!req.start_date) return false;
        const reqDate = parseISO(req.start_date);
        if (isNaN(reqDate)) return false;
        return req.employee_id === emp.id && reqDate.getFullYear().toString() === selectedYear;
      });

      calendarLeaves.forEach(req => {
        const parsedDate = parseISO(req.start_date);
        const monthIndex = getMonth(parsedDate);
        monthlyValues[monthIndex] += req.total_days;
      });

      const totalUsedInYear = monthlyValues.reduce((a, b) => a + b, 0);

      // 2. Data untuk Sisa Cuti (Berdasarkan Periode Anniversary/TMT)
      const period = getLeavePeriod(emp.tmt);
      const anniversaryLeaves = leaveRequests.filter(req => {
        if (!req.start_date) return false;
        const reqDate = parseISO(req.start_date);
        return req.employee_id === emp.id && reqDate >= period.start && reqDate <= period.end;
      });

      const totalUsedInPeriod = anniversaryLeaves.reduce((sum, req) => sum + req.total_days, 0);

      return {
        ...emp,
        monthlyValues,
        totalUsed: totalUsedInYear,
        remaining: Math.max(0, emp.annual_leave_quota - totalUsedInPeriod),
        periodLabel: selectedYear,
        anniversaryLabel: period.label
      };
    });
  }, [employees, leaveRequests, selectedYear]);

  const handleExport = () => {
    const headers = ['Nama', 'PN', 'Periode', ...months, 'Total', 'Sisa'];
    const rows = recapData.map(row => [
      row.name,
      row.pn,
      row.periodLabel,
      ...row.monthlyValues,
      row.totalUsed,
      row.remaining
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Rekap_Cuti_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteRequest = async (id) => {
    if (window.confirm('Hapus data pengajuan cuti ini?')) {
      const { error } = await deleteLeaveRequest(id);
      if (error) alert(error.message);
    }
  };

  const handleEditClick = (req) => {
    setEditingRequest(req);
    setEditFormData({
      start_date: req.start_date,
      end_date: req.end_date,
      total_days: req.total_days,
      description: req.description || ''
    });
  };

  const handleUpdateLeave = async (e) => {
    e.preventDefault();
    const { error } = await updateLeaveRequest(editingRequest.id, editFormData);
    if (!error) {
      setEditingRequest(null);
    } else {
      alert(error.message);
    }
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const empLeaves = useMemo(() => {
    if (!selectedEmp) return [];
    return leaveRequests.filter(req => 
      req.employee_id === selectedEmp.id && 
      new Date(req.start_date).getFullYear().toString() === selectedYear
    ).sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
  }, [selectedEmp, leaveRequests, selectedYear]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-3xl font-bold text-slate-800 font-display tracking-tight">Rekapitulasi Bulanan</h2>
          <p className="text-slate-500 font-medium">Monitoring distribusi penggunaan cuti per tahun kalender</p>
        </motion.div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
            <div className="pl-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tahun:</div>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 pr-8 cursor-pointer focus:ring-0"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        <motion.button 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={handleExport}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 font-bold text-sm"
        >
          <Download size={18} />
          <span>Export Rekap (.csv)</span>
        </motion.button>
      </div>
    </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="table-container shadow-2xl shadow-slate-200/50"
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900">
                <th className="sticky left-0 z-20 bg-slate-900 px-6 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-r border-slate-800 min-w-[240px]">
                  Informasi Karyawan
                </th>
                {months.map(m => (
                  <th key={m} className="px-3 py-5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-r border-slate-800 min-w-[70px]">
                    {m.substring(0, 3)}
                  </th>
                ))}
                <th className="px-6 py-5 text-center text-[10px] font-bold text-white uppercase tracking-widest bg-primary-600 min-w-[80px]">Used</th>
                <th className="px-6 py-5 text-center text-[10px] font-bold text-white uppercase tracking-widest bg-slate-800 min-w-[80px]">Left</th>
                <th className="px-6 py-5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-900 min-w-[80px]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {recapData.map((row, idx) => (
                <tr key={row.id} className="group">
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 transition-colors px-6 py-4 border-r border-slate-100 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                    <div className="font-bold text-slate-800 text-sm">{row.name}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Tahun {selectedYear}</div>
                    </div>
                  </td>
                  {row.monthlyValues.map((val, i) => (
                    <td key={i} className={`px-3 py-4 text-center text-sm border-r border-slate-50 transition-colors group-hover:bg-slate-50/50 ${val > 0 ? 'bg-primary-50/40 font-bold text-primary-700' : 'text-slate-300'}`}>
                      {val || '•'}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-center font-bold text-primary-700 bg-primary-50/20 group-hover:bg-primary-50/40 transition-colors border-r border-slate-100">
                    {row.totalUsed}
                  </td>
                  <td className={`px-6 py-4 text-center font-bold border-b border-slate-50 group-hover:bg-slate-50 transition-colors ${row.remaining <= 2 ? 'text-red-500' : 'text-slate-700'}`}>
                    <div className="flex flex-col items-center">
                      <span>{row.remaining}</span>
                      <span className="text-[8px] text-slate-400 font-normal uppercase mt-0.5 whitespace-nowrap">
                        Exp: {row.anniversaryLabel.split(' - ')[1]}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center border-b border-slate-50">
                    <button 
                      onClick={() => {
                        setSelectedEmp(row);
                        setShowDetailModal(true);
                      }}
                      className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-primary-600 transition-all"
                      title="Detail Cuti"
                    >
                      <Info size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
            <Info size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Legend Info</p>
            <p className="text-[10px] text-slate-400 font-medium">Panduan warna indikator rekap</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-lg">
            <div className="w-2.5 h-2.5 bg-primary-500 rounded-full"></div>
            <span className="text-[10px] font-bold text-primary-700 uppercase tracking-wider">Terdapat Cuti</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
            <div className="w-2.5 h-2.5 bg-slate-200 rounded-full"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nol / Kosong</span>
          </div>
        </div>
        <div className="md:ml-auto flex items-center gap-2 text-slate-400">
          <FileSpreadsheet size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Data sync: Calendar Year {selectedYear}</span>
        </div>
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedEmp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 font-display">Log Cuti: {selectedEmp.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">Daftar penggunaan cuti tahun {selectedYear}</p>
                </div>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white text-slate-400 hover:text-slate-600 shadow-sm transition-all"
                >
                  ×
                </button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto">
                {editingRequest ? (
                  <motion.form 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onSubmit={handleUpdateLeave} 
                    className="space-y-6 bg-slate-50 p-6 rounded-[24px] border border-slate-100"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <button 
                        type="button"
                        onClick={() => setEditingRequest(null)}
                        className="text-[10px] font-bold text-primary-600 hover:underline uppercase tracking-widest"
                      >
                        ← Kembali ke daftar
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 pl-1">Mulai</label>
                        <input 
                          type="date"
                          value={editFormData.start_date}
                          onChange={(e) => {
                            const newStart = e.target.value;
                            setEditFormData(prev => ({
                              ...prev,
                              start_date: newStart,
                              total_days: calculateDays(newStart, prev.end_date)
                            }));
                          }}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 pl-1">Selesai</label>
                        <input 
                          type="date"
                          value={editFormData.end_date}
                          onChange={(e) => {
                            const newEnd = e.target.value;
                            setEditFormData(prev => ({
                              ...prev,
                              end_date: newEnd,
                              total_days: calculateDays(prev.start_date, newEnd)
                            }));
                          }}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none text-sm font-medium"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 pl-1">Keterangan</label>
                      <textarea 
                        value={editFormData.description}
                        onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none text-sm font-medium min-h-[100px]"
                        placeholder="Alasan cuti..."
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-sm font-bold text-slate-600">
                        Total: <span className="text-primary-600">{editFormData.total_days} Hari</span>
                      </div>
                      <button 
                        type="submit"
                        className="px-6 py-2.5 bg-primary-600 text-white text-xs font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200"
                      >
                        Simpan Perubahan
                      </button>
                    </div>
                  </motion.form>
                ) : empLeaves.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-slate-400 text-sm italic font-medium">Tidak ada data cuti untuk tahun ini</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {empLeaves.map((req) => (
                      <div key={req.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex flex-col items-center justify-center border border-slate-100">
                            <span className="text-[10px] font-bold text-primary-600 uppercase leading-none">
                              {format(new Date(req.start_date), 'MMM')}
                            </span>
                            <span className="text-sm font-bold text-slate-800 leading-none mt-0.5">
                              {format(new Date(req.start_date), 'dd')}
                            </span>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">
                              {format(new Date(req.start_date), 'dd MMM yyyy')} - {format(new Date(req.end_date), 'dd MMM yyyy')}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                              {req.total_days} Hari • {req.description || 'Tidak ada keterangan'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => handleEditClick(req)}
                            className="p-2 text-slate-300 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteRequest(req.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-8 bg-slate-50/50 flex justify-end">
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition-all shadow-lg shadow-slate-200"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Recap;
