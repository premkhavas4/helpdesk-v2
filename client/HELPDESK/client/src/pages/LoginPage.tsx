import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import './LoginPage.css';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const onSubmit = (data: { email: string; password: string }) => {
    fetch('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Login failed');
        return res.json();
      })
      .then(() => {
        console.log('Login successful');
        navigate('/dashboard');
      })
      .catch((err) => console.error(err));
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Helpdesk</h2>
        <p className="subtitle">Sign in to your account</p>
        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <label>
            <span>Email</span>
            <input type="email" {...register('email')} required className={errors.email ? 'error-border' : ''} />
            {errors.email && <span>{errors.email.message}</span>}
          </label>
          <label>
            <span>Password</span>
            <input type="password" {...register('password')} required className={errors.password ? 'error-border' : ''} />
            {errors.password && <span>{errors.password.message}</span>}
          </label>
          <button type="submit">Sign In</button>
        </form>
      </div>
    </div>
  );
}
