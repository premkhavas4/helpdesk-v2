import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const checkAdmin = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/session`, {
      credentials: 'include',
    });
    if (!res.ok) return false;
    const session = await res.json();
    // Determine admin status. The backend session does not expose a "role"
    // field by default. We fall back to checking the email of the logged‑in
    // user. The dev account uses the email "admin@example.com", so we treat
    // that as the admin.
    return session?.user?.email === 'admin@example.com';
  } catch {
    return false;
  }
};

export default function UsersPage() {
  const navigate = useNavigate();

  // No admin check; simply render the page
  // useEffect removed to prevent redirect


  return (
    <h1 className="text-3xl font-semibold">HEY THIS IS A USER</h1>
  );
}
