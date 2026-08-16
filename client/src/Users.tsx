import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('agent');
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/users`, { withCredentials: true });
      setUsers(res.data.users || []);
    } catch (e) {
      console.error('Failed to fetch users', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async () => {
    try {
      await axios.post(
        `${API_URL}/api/users`,
        { email: newEmail, role: newRole, password: newPassword },
        { withCredentials: true }
      );
      setNewEmail('');
      setNewRole('agent');
      setNewPassword('');
      fetchUsers();
    } catch (e) {
      console.error('Create error', e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api/users/${id}`, { withCredentials: true });
      fetchUsers();
    } catch (e) {
      console.error('Delete error', e);
    }
  };

  const handleUpdate = async (id: string) => {
    const role = prompt('New role (admin/agent)');
    if (!role) return;
    try {
      await axios.put(`${API_URL}/api/users/${id}`, { role }, { withCredentials: true });
      fetchUsers();
    } catch (e) {
      console.error('Update error', e);
    }
  };

  return (
    <div>
      <h1>Users</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{new Date(u.created_at).toLocaleString()}</td>
                <td>
                  <button onClick={() => handleUpdate(u.id)}>Edit</button>
                  <button onClick={() => handleDelete(u.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <h2>Create New User</h2>
      <input
        placeholder="Email"
        value={newEmail}
        onChange={e => setNewEmail(e.target.value)}
      />
      <input
        placeholder="Role"
        value={newRole}
        onChange={e => setNewRole(e.target.value)}
      />
      <input
        placeholder="Password"
        type="password"
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
      />
      <button onClick={handleCreate}>Create</button>
    </div>
  );
};

export default Users;
