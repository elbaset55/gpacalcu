export const supabase = {
  auth: {
    signOut: async () => { window.location.href = "/api/auth/logout"; },
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
};
