export const supabaseAdmin = new Proxy({} as any, {
  get() {
    throw new Error("supabaseAdmin is not available. Use direct pg queries via src/integrations/replit/db.ts instead.");
  },
});
