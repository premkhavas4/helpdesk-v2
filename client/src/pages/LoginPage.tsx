import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Send login request
fetch('/api/auth/sign-in/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email, password }),
}).then(res => {
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}).then(data => {
  console.log('Login successful', data);
  // reload to get authenticated state
 navigate('/dashboard');
}).catch(err => console.error(err));
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Helpdesk</h2>
        <p className="subtitle">Sign in to your account</p>
        <form onSubmit={handleSubmit} className="login-form">
          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          <label>
            <span>Password</span>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </label>
          <button type="submit">Sign In</button>
        </form>
      </div>
    </div>
  );
}
