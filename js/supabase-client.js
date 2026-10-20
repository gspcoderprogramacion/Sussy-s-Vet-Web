// Use the project's public anon/publishable key here. Never put a service_role key in browser code.
window.supabaseClient = window.supabase.createClient(
  'https://kpasfvlaashsiovzxxbk.supabase.co',
  'sb_publishable_skZ7tGL7cTyqKox3A1g9YA_hd8MWRIO',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);
