import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./App.css";

const queryClient = new QueryClient();

// ── Protected Route wrapper ────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// ── Admin-only Route wrapper ───────────────────────────────────────
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role?.toLowerCase() !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// ── App Header ─────────────────────────────────────────────────────
function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="header bg-white p-4 shadow-md flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <Link to="/" className="text-2xl font-bold">
          Helpdesk
        </Link>
        {user?.role?.toLowerCase() === "admin" && (
          <Link to="/users" className="ml-4 text-blue-700 hover:underline">
            Users
          </Link>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {user && (
          <>
            <span className="text-sm text-gray-600">{user.email}</span>
            {user.role && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {user.role}
              </span>
            )}
          </>
        )}
        <button onClick={handleSignOut} className="btn btn-sm ml-2">
          Sign out
        </button>
      </div>
    </header>
  );
}

// ── Page wrapper — hides header on login page ──────────────────────
function PageWrapper({ children }: { children?: React.ReactNode }) {
  const location = useLocation();
  const showHeader = location.pathname !== "/login";

  return (
    <div className="app">
      {showHeader && <AppHeader />}
      {children}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <PageWrapper>
      <main className="main">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            }
          />
          {/* Default redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </PageWrapper>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
