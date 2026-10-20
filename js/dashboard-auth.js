async function requireRole(role) {
  const sb = window.supabaseClient;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { location.replace('../index.html'); return null; }
  const { data, error } = await sb.from('profiles').select('role, full_name').eq('id', session.user.id).single();
  if (error || data?.role !== role) { location.replace('../index.html'); return null; }
  document.getElementById('user-label').textContent = data.full_name || session.user.email;
  document.getElementById('logout').addEventListener('click', async () => { await sb.auth.signOut(); location.replace('../index.html'); });
  return { sb, user: session.user, profile: data };
}
window.requireRole = requireRole;
