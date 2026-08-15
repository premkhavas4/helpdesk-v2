import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import './App.css';

// Base API URL, defaults to localhost during development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ApiResponse {
  message: string;
}

interface HealthResponse {
  status: string;
  timestamp: string;
}

function App() {
  // Session state – null or an object containing a `user` field
  const [session, setSession] = useState<{ user?: { email?: string; role?: string } } | null>(null);

  // Fetch session on mount to populate the authentication context
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/session`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setSession(data);
        } else {
          setSession(null);
        }
      } catch {
        setSession(null);
      }
    };
    fetchSession();
  }, []);

  // Backend quick‑check data
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apiRes, healthRes] = await Promise.all([
          fetch(`${API_URL}/api`),
          fetch(`${API_URL}/health`),
        ]);
        if (!apiRes.ok || !healthRes.ok) throw new Error('Failed to fetch data');
        const apiJson: ApiResponse = await apiRes.json();
        const healthJson: HealthResponse = await healthRes.json();
        setApiData(apiJson);
        setHealthData(healthJson);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to backend');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper wrapper that hides the header on auth screens
  function PageWrapper({ children }: { children?: React.ReactNode }) {
    const location = useLocation();
    const showHeader = location.pathname !== '/login';
    return (
      <div className="app">
        {showHeader && <AppHeader />}
        {children}
      </div>
    );
  }

  // Header – shows user details and a sign‑out button
  function AppHeader() {
    const navigate = useNavigate();
    const handleSignOut = async () => {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
          credentials: 'include',
        });
        setSession(null);
        navigate('/login');
      } catch {
        console.error('Sign out failed');
      }
    };

    return (
      <header className="header bg-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="text-2xl font-bold">Helpdesk</Link>
          <Link to="/users">Users</Link>
        </div>
        <div className="flex items-center space-x-2">
          {session?.user?.role && <span>{session.user.role}</span>}
          <button onClick={handleSignOut} className="btn btn-sm">Sign out</button>
        </div>
      </header>
    );
  }

  return (
    <BrowserRouter>
      <PageWrapper>
        <main className="main">
          <Routes>
            <Route index element={
              <div className="card">
                <h2>Backend Connection</h2>
                {loading && <p>Connecting to backend...</p>}
                {error && <p className="error">❌ {error}</p>}
                {apiData && (
                  <div className="success">
                    <p>✅ Connected to backend!</p>
                    <p><strong>Message:</strong> {apiData.message}</p>
                  </div>
                )}
                {healthData && (
                  <div className="health">
                    <p><strong>Status:</strong> {healthData.status}</p>
                    <p><strong>Timestamp:</strong> {new Date(healthData.timestamp).toLocaleString()}</p>
                  </div>
                )}
              </div>
            } />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
          </Routes>
        </main>
      </PageWrapper>
    </BrowserRouter>
  );
}

export default App;
