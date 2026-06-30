import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { login } from '../api';
import { useAuth, useToast } from '../store';

export default function LoginPage() {
  const navigate    = useNavigate();
  const [params]    = useSearchParams();
  const setSession  = useAuth(s => s.setSession);
  const { show }    = useToast();

  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const expired = params.get('expired') === 'true';
  const reset   = params.get('reset')   === 'true';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email.trim()) {
      show('Ingresa tu correo electrónico', 'error'); return;
    }
    if (!form.email.trim().includes('@')) {
      show('El correo electrónico no es válido', 'error'); return;
    }
    if (!form.password.trim()) {
      show('Ingresa tu contraseña', 'error'); return;
    }

    setLoading(true);
    try {
      const data = await login(form);
      setSession(data.token, { name: data.name, email: data.email, role: data.role });
      navigate('/documentos', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message
               ?? err.response?.data?.error
               ?? 'Correo o contraseña incorrectos';
      show(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <img src="/logo.png" alt="RST" className="login-logo" />

        <h1>Módulo de Facturación RS Tech</h1>
        <p>Ingresa con tu cuenta para continuar</p>

        {expired && (
          <div className="error-msg" style={{ background: '#fef9c3', color: '#854d0e', borderColor: '#fde047', marginBottom: 12 }}>
            Tu sesión expiró. Inicia sesión nuevamente.
          </div>
        )}
        {reset && (
          <div className="error-msg" style={{ background: '#f0fdf4', color: '#15803d', borderColor: '#86efac', marginBottom: 12 }}>
            Contraseña actualizada correctamente. Ya puedes iniciar sesión.
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email" required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="admin@rstech.cl"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password" required
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 20, padding: '11px' }}
            disabled={loading}
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none' }}>
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>
    </div>
  );
}
