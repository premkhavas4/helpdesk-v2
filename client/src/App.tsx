import { useEffect, useState } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ApiResponse {
  message: string;
}

interface HealthResponse {
  status: string;
  timestamp: string;
}

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

        if (!apiRes.ok || !healthRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const apiJson = await apiRes.json();
        const healthJson = await healthRes.json();

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

  return (
    <div className="app">
      <header className="header">
        <h1>🎫 AI-Powered Helpdesk System</h1>
        <p>Full-stack TypeScript project with Express, React, and Bun</p>
      </header>

      <main className="main">
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

        <div className="card">
          <h2>Tech Stack</h2>
          <ul className="tech-list">
            <li><strong>Backend:</strong> Node.js + Express + TypeScript</li>
            <li><strong>Frontend:</strong> React + TypeScript + Vite</li>
            <li><strong>Runtime:</strong> Bun</li>
            <li><strong>Database:</strong> PostgreSQL (to be configured)</li>
            <li><strong>AI:</strong> Claude API (to be configured)</li>
          </ul>
        </div>

        <div className="card">
          <h2>Next Steps</h2>
          <ol className="steps">
            <li>Install and configure PostgreSQL</li>
            <li>Set up Prisma ORM</li>
            <li>Implement authentication system</li>
            <li>Build ticket management features</li>
            <li>Integrate Claude API for AI features</li>
          </ol>
        </div>
      </main>

      <footer className="footer">
        <p>Project initialized on August 12, 2026</p>
      </footer>
    </div>
  );
}

export default App;
