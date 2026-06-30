import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../api';

export default function ResetPasswordPage() {
  const [params]    = useSearchParams();
  const navigate    = useNavigate();
  const token       = params.get('token') ?? '';

  const [form, setForm]       = useState({ password: '', confirm: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(token, form.password);
      navigate('/login?reset=true', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message ?? 'El enlace es inválido o expiró');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <p className="error-msg">Enlace inválido.</p>
          <Link to="/login" style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: 13 }}>
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>Nueva contraseña</h1>
        <p>Elige una contraseña segura para tu cuenta.</p>

        <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          <div className="form-group">
            <label>Nueva contraseña</label>
            <input
              type="password" required
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Confirmar contraseña</label>
            <input
              type="password" required
              value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
              placeholder="••••••••"
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 20, padding: '11px' }}
            disabled={loading}
          >
            {loading ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
