import { createContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export interface User { id: string; email: string; name?: string; }
export interface AuthContextType { user: User | null; login: (email:string,password:string)=>Promise<boolean>; logout:()=>Promise<void>; }

export const AuthContext = createContext<AuthContextType>({ user: null, login: async()=>false, logout: async()=>{} });

export const AuthProvider = ({children}:{children:ReactNode})=>{
  const [user, setUser] = useState<User|null>(null);
  const navigate = useNavigate();

  const fetchSession = async()=>{
    try {
      const res = await fetch(import.meta.env.VITE_API_URL+'/api/auth/session', { credentials:'include' });
      if (!res.ok) { setUser(null); return; }
      const data = await res.json();
      setUser(data.user ?? null);
    } catch(_) { setUser(null); }
  };

  useEffect(()=>{ fetchSession(); }, []);

  const login = async(email:string,password:string)=>{
    try {
      const res = await fetch(import.meta.env.VITE_API_URL+'/api/auth/login', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}) });
      if (!res.ok) return false;
      await fetchSession();
      navigate('/');
      return true;
    }catch{ return false; }
  };
  const logout = async()=>{
    try { await fetch(import.meta.env.VITE_API_URL+'/api/auth/logout', { method:'POST', credentials:'include' }); } catch(_){}
    setUser(null);
    navigate('/login');
  };

  return <AuthContext.Provider value={{user,login,logout}}>{children}</AuthContext.Provider>;
};
