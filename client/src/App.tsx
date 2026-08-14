import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ApiResponse { message: string; }
interface HealthResponse { status: string; timestamp: string; }

function App() {
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apiRes, healthRes] = await Promise.all([
          fetch(`${API_URL}/api`),
          fetch(`${API_URL}/health`)
        ]);
        if (!apiRes.ok || !healthRes.ok) throw new Error('Failed to fetch data');
        const apiJson = await apiRes.json();
        const healthJson = await healthRes.json();
        setApiData(apiJson);
        setHealthData(healthJson);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to backend');
      } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  function PageWrapper({ children }: { children?: React.ReactNode }) {
    const location = useLocation();
    const showHeader = location.pathname !== '/login';
    return (
      <div className="app">
        {showHeader && (
          <header className="header">
            <h1>🎫 AI-Powered Helpdesk System</h1>
            <nav>
              <Link to="/">Home</Link> | <Link to="/login">Login</Link>
            </nav>
          </header>
        )}
        {children}
      </div>
    );
  }

  return (
    <BrowserRouter>
      <PageWrapper>
        <main className="main">
          <Routes>
            <Route path="/" element={
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
          </Routes>
        </main>
        <footer className="footer"><p>Project initialized on August 12, 2026</p></footer>
      </PageWrapper>
    </BrowserRouter>
  );
}

export default App;
