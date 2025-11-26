import { useState } from 'react';
import { login } from '../services/api';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('info@dunyatek.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const result = await login(email, password);
      onLogin(result.user);
    } catch (err) {
      setError('E-posta veya şifre hatalı');
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f5f7fb' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', minWidth: 320 }}>
        <h2 style={{ marginBottom: 24, textAlign: 'center' }}>Giriş Yap</h2>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>E-posta</label>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d0d7e2' }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Şifre</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d0d7e2' }}
          />
        </div>
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        <button type="submit" style={{ width: '100%', padding: 10, borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600 }}>
          Giriş Yap
        </button>
      </form>
    </div>
  );
}
