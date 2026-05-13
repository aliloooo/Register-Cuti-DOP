import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const useStore = create((set, get) => ({
  employees: [],
  leaveRequests: [],
  jointLeaves: [],
  loading: false,
  error: null,
  isAuthenticated: false,
  user: null,
  isAuthLoading: true,
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
    if (!isSupabaseConfigured) {
      set({ isAuthLoading: false });
      return;
    }
    
    set({ isAuthLoading: true });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      set({ user: session.user, isAuthenticated: true, isAuthLoading: false });
    } else {
      set({ user: null, isAuthenticated: false, isAuthLoading: false });
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
    
    if (error) {
      console.error('Error fetching employees:', error);
      set({ error: error.message, loading: false });
    } else {
      set({ employees: data || [], loading: false });
    }
  },

  fetchLeaveRequests: async () => {
    if (!isSupabaseConfigured) return;
    set({ loading: true });

    const { data, error } = await supabase
      .from('leave_requests')
      .select('*, employees(name, team, pn)')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching leave requests:', error);
      set({ error: error.message, loading: false });
    } else {
      set({ leaveRequests: data || [], loading: false });
    }
  },

  fetchJointLeaves: async () => {
    if (!isSupabaseConfigured) return;
    set({ loading: true });
    const { data, error } = await supabase
      .from('joint_leaves')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching joint leaves:', error);
      set({ error: error.message, loading: false });
    } else {
      set({ jointLeaves: data || [], loading: false });
    }
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
    const payload = Array.isArray(request) ? request : [request];

    const { data, error } = await supabase
      .from('leave_requests')
      .insert(payload)
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

  deleteJointLeave: async (id) => {
    if (!isSupabaseConfigured) return { error: { message: 'Database not configured' } };
    
    // Get info before delete for sync
    const { data: event } = await supabase.from('joint_leaves').select('*').eq('id', id).single();
    if (!event) return { error: { message: 'Event not found' } };

    // 1. Delete from joint_leaves
    const { error: eventError } = await supabase.from('joint_leaves').delete().eq('id', id);
    if (eventError) return { error: eventError };

    // 2. Sync delete from leave_requests
    await supabase
      .from('leave_requests')
      .delete()
      .eq('start_date', event.date)
      .eq('description', event.description);
    
    await get().fetchJointLeaves();
    await get().fetchLeaveRequests();
    return { error: null };
  },

  addJointLeave: async (eventData) => {
    if (!isSupabaseConfigured) return { error: { message: 'Database not configured' } };
    
    // 1. Insert into joint_leaves
    const { data: event, error: eventError } = await supabase
      .from('joint_leaves')
      .insert([eventData])
      .select()
      .single();
    
    if (eventError) return { error: eventError };

    // 2. Insert into leave_requests for ALL employees
    const employees = get().employees;
    const bulkRequests = employees.map(emp => ({
      employee_id: emp.id,
      start_date: eventData.date,
      end_date: eventData.date,
      total_days: 1,
      description: eventData.description,
      status: 'approved'
    }));

    const { error: bulkError } = await supabase.from('leave_requests').insert(bulkRequests);
    
    await get().fetchJointLeaves();
    await get().fetchLeaveRequests();
    return { error: bulkError };
  },

  updateJointLeave: async (id, newData) => {
    if (!isSupabaseConfigured) return { error: { message: 'Database not configured' } };
    
    // Get info before update for sync
    const { data: oldEvent } = await supabase.from('joint_leaves').select('*').eq('id', id).single();
    if (!oldEvent) return { error: { message: 'Event not found' } };

    // 1. Update joint_leaves
    const { error: eventError } = await supabase
      .from('joint_leaves')
      .update(newData)
      .eq('id', id);
    
    if (eventError) return { error: eventError };

    // 2. Sync update leave_requests
    await supabase
      .from('leave_requests')
      .update({
        start_date: newData.date,
        end_date: newData.date,
        description: newData.description
      })
      .eq('start_date', oldEvent.date)
      .eq('description', oldEvent.description);
    
    await get().fetchJointLeaves();
    await get().fetchLeaveRequests();
    return { error: null };
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
