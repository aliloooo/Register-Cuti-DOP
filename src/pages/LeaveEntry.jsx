import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { calculateDuration, getLeavePeriod } from '../lib/leaveLogic';
import { Calendar, User, FileText, Send, CheckCircle2, AlertCircle, Clock, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SuccessModal from '../components/SuccessModal';

const LeaveEntry = () => {
  const { employees, leaveRequests, addLeaveRequest, fetchLeaveRequests } = useStore();
  const [formData, setFormData] = useState({
    employee_id: '',
    start_date: '',
    end_date: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [monitoringSearch, setMonitoringSearch] = useState('');

  React.useEffect(() => {
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  const duration = useMemo(() => {
    if (formData.start_date && formData.end_date) {
      return calculateDuration(formData.start_date, formData.end_date);
    }
    return 0;
  }, [formData.start_date, formData.end_date]);

  const selectedEmployee = useMemo(() => {
    return employees.find(e => e.id === formData.employee_id);
  }, [formData.employee_id, employees]);

  const quotaInfo = useMemo(() => {
    if (!selectedEmployee) return { remaining: 0, label: '' };
    const period = getLeavePeriod(selectedEmployee.tmt);
    const used = leaveRequests
      .filter(req =>
        req.employee_id === selectedEmployee.id &&
        new Date(req.start_date) >= period.start &&
        new Date(req.start_date) <= period.end
      )
      .reduce((sum, req) => sum + req.total_days, 0);

    return {
      remaining: Math.max(0, selectedEmployee.annual_leave_quota - used),
      label: period.label
    };
  }, [selectedEmployee, leaveRequests]);

  const canSubmit = useMemo(() => {
    if (!selectedEmployee) return false;
    return duration > 0 && duration <= quotaInfo.remaining;
  }, [duration, quotaInfo.remaining, selectedEmployee]);

  const filteredMonitoring = useMemo(() => {
    return employees.filter(emp => 
      emp.name.toLowerCase().includes(monitoringSearch.toLowerCase()) ||
      emp.pn.toLowerCase().includes(monitoringSearch.toLowerCase())
    );
  }, [employees, monitoringSearch]);

  const getRemainingQuota = (emp) => {
    const period = getLeavePeriod(emp.tmt);
    const used = leaveRequests
      .filter(req => 
        req.employee_id === emp.id && 
        new Date(req.start_date) >= period.start && 
        new Date(req.start_date) <= period.end
      )
      .reduce((sum, req) => sum + req.total_days, 0);
    return {
      remaining: Math.max(0, emp.annual_leave_quota - used),
      label: period.label
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (duration <= 0) return alert('Tanggal tidak valid');

    setIsSubmitting(true);
    const { error } = await addLeaveRequest({
      ...formData,
      total_days: duration,
      status: 'approved'
    });

    setIsSubmitting(false);
    if (!error) {
      setSuccess(true);
      setFormData({ employee_id: '', start_date: '', end_date: '', description: '' });
    } else {
      alert(error.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h2 className="text-3xl font-bold text-slate-800 font-display tracking-tight">Input Register Cuti</h2>
        <p className="text-slate-500 font-medium">Catat penggunaan jatah cuti karyawan secara digital</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-10"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Employee Selection */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <User size={14} /> Pilih Karyawan
            </label>
            <div className="relative">
              <select
                required
                className="w-full px-5 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none text-sm font-semibold appearance-none transition-all cursor-pointer"
                value={formData.employee_id}
                onChange={e => setFormData({ ...formData, employee_id: e.target.value })}
              >
                <option value="">-- Cari Nama Karyawan --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.pn})</option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <Calendar size={18} />
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {selectedEmployee && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-5 bg-gradient-to-r from-primary-50 to-indigo-50/30 rounded-2xl border border-primary-100 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary-600 shadow-sm">
                      <User size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">Periode Aktif</p>
                      <p className="text-sm font-bold text-slate-800">{quotaInfo.label}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">Sisa Jatah</p>
                    <p className={`text-sm font-bold ${quotaInfo.remaining <= 0 ? 'text-red-500' : 'text-slate-800'}`}>
                      {quotaInfo.remaining} Hari
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <Calendar size={14} /> Tanggal Mulai
              </label>
              <input
                type="date"
                required
                className="w-full px-5 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none text-sm font-semibold transition-all"
                value={formData.start_date}
                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <Calendar size={14} /> Tanggal Selesai
              </label>
              <input
                type="date"
                required
                className="w-full px-5 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none text-sm font-semibold transition-all"
                value={formData.end_date}
                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          {/* Duration Display */}
          <div className="flex items-center justify-between p-6 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                <Clock size={20} />
              </div>
              <span className="text-sm font-bold text-slate-600">Estimasi Durasi</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${duration > 0 ? 'text-primary-600' : 'text-slate-300'}`}>{duration}</span>
              <span className="text-sm font-bold text-slate-400">Hari Kerja</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <FileText size={14} /> Keterangan Keperluan
            </label>
            <textarea
              rows="3"
              placeholder="Contoh: Cuti Tahunan, Menghadiri Acara Keluarga, dll..."
              className="w-full px-5 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none text-sm font-semibold resize-none transition-all placeholder:text-slate-300"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>

          <motion.button
            whileHover={canSubmit && !isSubmitting ? { scale: 1.01 } : {}}
            whileTap={canSubmit && !isSubmitting ? { scale: 0.98 } : {}}
            type="submit"
            disabled={isSubmitting || !canSubmit}
            className={`w-full py-5 rounded-2xl font-bold text-white shadow-2xl flex items-center justify-center gap-3 transition-all ${!canSubmit || isSubmitting ? 'bg-slate-400 cursor-not-allowed grayscale' : 'bg-gradient-to-r from-primary-600 to-primary-500 shadow-primary-500/30'
              }`}
          >
            {success ? (
              <><CheckCircle2 size={22} /> Berhasil Tersimpan!</>
            ) : isSubmitting ? (
              <span className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Memproses...</span>
            ) : (
              <><Send size={20} /> Submit Pengajuan Cuti</>
            )}
          </motion.button>

          {duration <= 0 && formData.start_date && formData.end_date && (
            <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase tracking-wider justify-center">
              <AlertCircle size={14} /> Tanggal mulai harus sebelum atau sama dengan tanggal selesai
            </div>
          )}

          {selectedEmployee && duration > quotaInfo.remaining && (
            <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase tracking-wider justify-center">
              <AlertCircle size={14} /> Jatah cuti tidak mencukupi (Sisa: {quotaInfo.remaining} hari)
            </div>
          )}
        </form>
      </motion.div>

      <SuccessModal
        isOpen={success}
        onClose={() => setSuccess(false)}
        title="Pengajuan Berhasil!"
        message="Permohonan cuti karyawan telah berhasil dicatat ke dalam database."
      />

      {/* Monitoring Section */}
      <div className="mt-20 space-y-8 pb-20">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-slate-800 font-display uppercase tracking-tight">Monitoring Sisa Cuti</h3>
          <p className="text-slate-500 text-sm mt-1">Cek sisa jatah cuti Anda secara mandiri</p>
        </div>

        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Cari Nama atau PN..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 transition-all text-sm shadow-sm outline-none font-medium"
            value={monitoringSearch}
            onChange={(e) => setMonitoringSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredMonitoring.slice(0, 6).map((emp) => {
            const quota = getRemainingQuota(emp);
            return (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={emp.id}
                className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{emp.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{quota.label}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sisa</p>
                  <p className={`text-lg font-bold ${quota.remaining <= 0 ? 'text-red-500' : 'text-primary-600'}`}>
                    {quota.remaining} <span className="text-[10px]">Hari</span>
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {monitoringSearch && filteredMonitoring.length === 0 && (
          <div className="text-center py-10">
            <p className="text-slate-400 text-sm italic">Nama tidak ditemukan...</p>
          </div>
        )}

        {!monitoringSearch && filteredMonitoring.length > 6 && (
          <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            Gunakan fitur cari untuk melihat sisa cuti lainnya
          </p>
        )}
      </div>
    </div>
  );
};

export default LeaveEntry;
