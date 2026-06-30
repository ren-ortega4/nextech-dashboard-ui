import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al enviar el correo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>Recuperar contraseña</h1>

        {sent ? (
          <>
            <p style={{ color: '#16a34a', marginTop: 12 }}>
              Si el correo existe en el sistema, recibirás un enlace para restablecer tu contraseña.
            </p>
            <Link to="/login" className="btn btn-outline" style={{ display: 'block', textAlign: 'center', marginTop: 20 }}>
              ← Volver al inicio de sesión
            </Link>
          </>
        ) : (
          <>
            <p>Ingresa tu correo y te enviaremos un enlace de recuperación.</p>
            <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email" required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@nextech.cl"
                  autoFocus
                />
              </div>

              {error && <div className="error-msg">{error}</div>}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 20, padding: '11px' }}
                disabled={loading}
              >
                {loading ? 'Enviando…' : 'Enviar enlace'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link to="/login" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none' }}>
                ← Volver al inicio de sesión
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
