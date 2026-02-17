import { useState, useEffect } from 'react';
import { api } from '../../api/client.js';

export default function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    api.get('/users').then(d => setUsers(d.users || [])).catch(() => {});
  };

  const handleToggleActive = async (user) => {
    await api.patch(`/users/${user.id}`, { is_active: !user.is_active });
    loadUsers();
  };

  const handleViewUser = async (user) => {
    try {
      const data = await api.get(`/users/${user.id}`);
      setSelectedUser({ ...data.user, stats: data.stats });
    } catch {
      setSelectedUser(null);
    }
  };

  const roleLabels = {
    oracle_card_admin: 'Admin',
    user: 'User',
  };

  return (
    <div>
      <h1 className="mb-3">Users</h1>

      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex-between mb-3">
              <h2>{selectedUser.display_name}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedUser(null)}>Close</button>
            </div>
            <div className="mb-2">
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Role:</strong> {roleLabels[selectedUser.role] || selectedUser.role}</p>
              <p><strong>Status:</strong> {selectedUser.is_active ? 'Active' : 'Inactive'}</p>
              <p><strong>Onboarding:</strong> {selectedUser.onboarding_completed ? 'Completed' : 'Pending'}</p>
              <p><strong>Joined:</strong> {new Date(selectedUser.created_at).toLocaleString()}</p>
              {selectedUser.stats && <p><strong>Readings:</strong> {selectedUser.stats.reading_count}</p>}
            </div>
            {selectedUser.onboarding_data && selectedUser.onboarding_data !== '{}' && (
              <div>
                <h3 className="mb-1" style={{ fontSize: '0.9rem' }}>Onboarding Data</h3>
                <pre style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius)', fontSize: '0.8rem', overflow: 'auto' }}>
                  {JSON.stringify(JSON.parse(selectedUser.onboarding_data), null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Onboarded</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <button style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 500 }}
                    onClick={() => handleViewUser(u)}>
                    {u.display_name}
                  </button>
                </td>
                <td className="text-sm">{u.email}</td>
                <td><span className={`badge ${u.role === 'oracle_card_admin' ? 'badge-info' : 'badge-success'}`}>{roleLabels[u.role] || u.role}</span></td>
                <td>{u.onboarding_completed ? 'Yes' : 'No'}</td>
                <td><span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                <td className="text-sm">{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  <button className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-primary'}`}
                    onClick={() => handleToggleActive(u)}>
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={7} className="text-center text-muted">No users yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
