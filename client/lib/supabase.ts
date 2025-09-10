import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

export function getSupabase() {
  if (supabase) return supabase;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  supabase = createClient(url, key, { auth: { persistSession: false } });
  return supabase;
}

export async function signInWithGoogle() {
  const s = getSupabase();
  if (!s) throw new Error("Supabase not configured");
  const { error } = await s.auth.signInWithOAuth({ provider: "google" });
  if (error) throw error;
}

export async function signOut() {
  const s = getSupabase();
  if (!s) return;
  await s.auth.signOut();
}

export function onAuthChange(cb: (event: string, session: any) => void) {
  const s = getSupabase();
  if (!s) return () => {};
  const { data } = s.auth.onAuthStateChange((event, session) => cb(event, session));
  return () => data.subscription.unsubscribe();
}

export async function getCurrentUser() {
  const s = getSupabase();
  if (!s) return null;
  const { data } = await s.auth.getUser();
  return data.user;
}
