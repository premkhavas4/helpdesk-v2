import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { handleSubmit, register, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data: { email: string; password: string }) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/sign-in/email`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: data.email, password: data.password }),
      });
      if (!res.ok) throw new Error('Login failed');
      console.log('Login successful');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setAuthError('Invalid email or password');
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <form onSubmit={handleSubmit(onSubmit)} className="w-[400px] p-6 bg-white rounded shadow-md">
        <h2 className="text-center text-2xl mb-4">Helpdesk</h2>
        <p className="text-center mb-6">Sign in to your account</p>
        {authError && <p className="text-sm text-red-500 mb-4 text-center">{authError}</p>}
        <div className="mb-4">
          <label className="block mb-1" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className={`w-full border rounded px-3 py-2 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            {...register('email')}
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>
        <div className="mb-6">
          <label className="block mb-1" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className={`w-full border rounded px-3 py-2 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
            {...register('password')}
          />
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Sign In</button>
      </form>
    </div>
  );
}
