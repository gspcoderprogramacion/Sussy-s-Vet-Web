document.addEventListener('DOMContentLoaded', async () => {
  const supabase = window.supabaseClient;
  const form = document.getElementById('login-form');
  const message = document.getElementById('auth-message');
  const say = (text, error = false) => { message.textContent = text; message.classList.toggle('error', error); };
  const destination = { admin: 'views/admin.html', veterinarian: 'views/veterinarian.html', owner: 'views/owner.html' };

  async function routeUser(user) {
    const { data, error } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single();
    if (error || !data || !destination[data.role]) {
      await supabase.auth.signOut();
      say('Tu cuenta no tiene un rol habilitado. Contacta al administrador.', true);
      return;
    }
    location.replace(destination[data.role]);
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (session) await routeUser(session.user);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]'); button.disabled = true;
    say('Validando acceso…');
    const { data, error } = await supabase.auth.signInWithPassword({ email: form.email.value.trim(), password: form.password.value });
    button.disabled = false;
    if (error) return say(error.message, true);
    await routeUser(data.user);
  });

  document.getElementById('forgot-password').addEventListener('click', async () => {
    const email = form.email.value.trim();
    if (!email) return say('Escribe tu correo para enviarte el enlace de recuperación.', true);
    // Resolve relative to the deployed project path (including GitHub Pages /<repo>/).
    const recoveryUrl = new URL('views/reset-password.html', document.baseURI).toString();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: recoveryUrl });
    say(error ? error.message : 'Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña.', Boolean(error));
  });
});
