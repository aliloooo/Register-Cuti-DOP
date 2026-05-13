import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import SuccessModal from '../components/SuccessModal';

const Settings = () => {
  const { updatePassword, loading, user } = useStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Password konfirmasi tidak cocok');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    const { error: updateError } = await updatePassword(formData.newPassword);
    
    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setFormData({ newPassword: '', confirmPassword: '' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <h2 className="text-3xl font-bold text-slate-800 font-display tracking-tight">Pengaturan Akun</h2>
        <p className="text-slate-500 font-medium">Kelola keamanan dan kredensial admin Anda</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Info Section */}
        <div className="space-y-6">
          <div className="glass-card p-6 bg-primary-600 text-white">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <Shield size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">Informasi Akun</h3>
            <p className="text-white/80 text-xs leading-relaxed">
              Anda saat ini masuk menggunakan email dummy:
            </p>
            <div className="mt-4 p-3 bg-white/10 rounded-xl border border-white/20 font-mono text-xs break-all">
              {user?.email}
            </div>
          </div>

          <div className="p-6 bg-amber-50 rounded-[32px] border border-amber-100 flex gap-4">
            <AlertCircle className="text-amber-500 shrink-0" size={20} />
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Catatan Penting</p>
              <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                Karena menggunakan email dummy, pastikan Anda mencatat password baru ini. Jika lupa, Anda harus menghubungi teknisi database untuk meresetnya secara manual.
              </p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 glass-card p-8 sm:p-12"
        >
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Ganti Password</h3>
              <p className="text-xs text-slate-400 font-medium">Perbarui kredensial login Anda</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2 relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Password Baru</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none font-semibold text-sm transition-all"
                    placeholder="Minimal 6 karakter"
                    value={formData.newPassword}
                    onChange={e => setFormData({...formData, newPassword: e.target.value})}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Konfirmasi Password</label>
                <div className="relative">
                  <input 
                    type={showConfirm ? 'text' : 'password'}
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none font-semibold text-sm transition-all"
                    placeholder="Ulangi password baru"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-xs font-bold border border-red-100"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-2xl font-bold text-sm shadow-xl shadow-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Perbarui Password</span>
                  <CheckCircle size={18} className="opacity-0 group-hover:opacity-100 transition-all" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>

      <SuccessModal 
        isOpen={success}
        onClose={() => setSuccess(false)}
        title="Password Berhasil Diubah"
        message="Keamanan akun Anda telah diperbarui. Gunakan password baru ini untuk login berikutnya."
      />
    </div>
  );
};

export default Settings;
