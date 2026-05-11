import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const useStore = create((set, get) => ({
  employees: [],
  leaveRequests: [],
  loading: false,
  error: null,
  isAuthenticated: false,
  user: null,
  notifications: [],
  unreadCount: 0,
  searchTerm: '',

  // Auth Actions
  login: async (email, password) => {
    if (!isSupabaseConfigured) return { error: { message: 'Database not configured' } };
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      set({ error: error.message, loading: false });
      return { error };
    }

    set({ user: data.user, isAuthenticated: true, loading: false });
    return { data, error: null };
  },

  logout: async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    if (!isSupabaseConfigured) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      set({ user: session.user, isAuthenticated: true });
    } else {
      set({ user: null, isAuthenticated: false });
    }
  },

  // Data Actions
  fetchEmployees: async () => {
    if (!isSupabaseConfigured) return;
    set({ loading: true });
    
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) set({ error: error.message, loading: false });
    else set({ employees: data || [], loading: false });
  },

  fetchLeaveRequests: async () => {
    if (!isSupabaseConfigured) return;
    set({ loading: true });

    const { data, error } = await supabase
      .from('leave_requests')
      .select('*, employees(name, team, pn)')
      .order('created_at', { ascending: false });
    
    if (error) set({ error: error.message, loading: false });
    else set({ leaveRequests: data || [], loading: false });
  },

  addEmployee: async (employee) => {
    if (!isSupabaseConfigured) return { error: { message: 'Database not configured' } };
    
    const { data, error } = await supabase
      .from('employees')
      .insert([employee])
      .select();
    
    if (!error) {
      set((state) => ({ employees: [...state.employees, ...data] }));
    }
    return { data, error };
  },

  addLeaveRequest: async (request) => {
    if (!isSupabaseConfigured) return { error: { message: 'Database not configured' } };

    const { data, error } = await supabase
      .from('leave_requests')
      .insert([request])
      .select();
    
    if (!error) {
      await get().fetchLeaveRequests(); 
    }
    return { data, error };
  },

  updateEmployee: async (id, updates) => {
    if (!isSupabaseConfigured) return { error: { message: 'Database not configured' } };
    
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (!error) {
      set((state) => ({
        employees: state.employees.map((emp) => emp.id === id ? data[0] : emp)
      }));
    }
    return { data, error };
  },

  deleteEmployee: async (id) => {
    if (!isSupabaseConfigured) return { error: { message: 'Database not configured' } };
    
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);
    
    if (!error) {
      set((state) => ({
        employees: state.employees.filter((emp) => emp.id !== id)
      }));
    }
    return { error };
  },

  updateLeaveRequest: async (id, updates) => {
    if (!isSupabaseConfigured) return { error: { message: 'Database not configured' } };
    const { data, error } = await supabase
      .from('leave_requests')
      .update(updates)
      .eq('id', id)
      .select('*, employees(name, team, pn)');
    
    if (!error) {
      set((state) => ({
        leaveRequests: state.leaveRequests.map((req) => req.id === id ? data[0] : req)
      }));
    }
    return { data, error };
  },

  deleteLeaveRequest: async (id) => {
    if (!isSupabaseConfigured) return { error: { message: 'Database not configured' } };
    const { error } = await supabase
      .from('leave_requests')
      .delete()
      .eq('id', id);
    
    if (!error) {
      set((state) => ({
        leaveRequests: state.leaveRequests.filter((req) => req.id !== id)
      }));
    }
    return { error };
  },

  // Notification Actions
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 20),
      unreadCount: state.unreadCount + 1
    }));
  },

  clearUnread: () => set({ unreadCount: 0 }),

  subscribeToLeaveRequests: () => {
    if (!isSupabaseConfigured) return;
    
    const channel = supabase
      .channel('leave_requests_changes')
      .on('postgres_changes', { event: 'INSERT', table: 'leave_requests' }, async (payload) => {
        const { data: employee } = await supabase
          .from('employees')
          .select('name')
          .eq('id', payload.new.employee_id)
          .single();
          
        get().addNotification({
          id: payload.new.id,
          type: 'new_leave',
          title: 'Pengajuan Cuti Baru',
          message: `${employee?.name || 'Karyawan'} mengajukan cuti ${payload.new.total_days} hari.`,
          time: new Date().toLocaleTimeString(),
        });
        
        get().fetchLeaveRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Search Action
  setSearchTerm: (term) => set({ searchTerm: term })
}));
