import { useState, useEffect } from 'react';
import { api } from '../../api/client.js';

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', business_name: '', owner_email: '' });
  const [creating, setCreating] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [tenantDetail, setTenantDetail] = useState(null);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = () => {
    api.get('/tenants').then(d => setTenants(d.tenants || [])).catch(() => {});
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/tenants', form);
      setShowCreate(false);
      setForm({ name: '', slug: '', business_name: '', owner_email: '' });
      loadTenants();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (tenant) => {
    await api.post(`/tenants/${tenant.id}/toggle-active`);
    loadTenants();
    if (tenantDetail?.id === tenant.id) {
      viewTenant(tenant);
    }
  };

  const viewTenant = async (tenant) => {
    try {
      const data = await api.get(`/tenants/${tenant.id}`);
      setTenantDetail(data);
      setSelectedTenant(tenant.id);
    } catch {
      setTenantDetail(null);
    }
  };

  return (
    <div>
      <div className="flex-between mb-3">
        <div>
          <h1>Manage Tenants</h1>
          <p className="text-muted">Create and manage Oracle App Instances</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : 'New Oracle App Instance'}
        </button>
      </div>

      {showCreate && (
        <div className="card mb-3" style={{ maxWidth: 500 }}>
          <h3 className="mb-2">Create Oracle App Instance</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Mystic Moon Oracle" required />
            </div>
            <div className="form-group">
              <label>Slug (URL-friendly name)</label>
              <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                placeholder="e.g. mystic-moon (auto-generated if blank)" />
            </div>
            <div className="form-group">
              <label>Business Name</label>
              <input type="text" value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })}
                placeholder="e.g. Mystic Moon LLC" />
            </div>
            <div className="form-group">
              <label>Owner Email (Oracle Card Admin) *</label>
              <input type="email" value={form.owner_email} onChange={e => setForm({ ...form, owner_email: e.target.value })}
                placeholder="admin@example.com" required />
              <p className="text-sm text-muted" style={{ marginTop: '0.25rem' }}>This email will be the Oracle Card Admin for this instance</p>
            </div>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Creating...' : 'Create Instance'}
            </button>
          </form>
        </div>
      )}

      {/* Tenant Detail Modal */}
      {tenantDetail && (
        <div className="modal-overlay" onClick={() => setTenantDetail(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex-between mb-3">
              <h2>{tenantDetail.tenant?.name}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setTenantDetail(null)}>Close</button>
            </div>
            <div className="mb-2">
              <p><strong>Slug:</strong> {tenantDetail.tenant?.slug}</p>
              <p><strong>Business:</strong> {tenantDetail.tenant?.business_name || '-'}</p>
              <p><strong>Owner Email:</strong> {tenantDetail.tenant?.owner_email || '-'}</p>
              <p><strong>Status:</strong> {tenantDetail.tenant?.is_active ? 'Active' : 'Inactive'}</p>
              <p><strong>Created:</strong> {new Date(tenantDetail.tenant?.created_at).toLocaleString()}</p>
            </div>
            {tenantDetail.stats && (
              <div className="mb-2">
                <h3 className="mb-1" style={{ fontSize: '0.9rem' }}>Statistics</h3>
                <p>Total Users: {tenantDetail.stats.total_users}</p>
                <p>Regular Users: {tenantDetail.stats.user_count}</p>
                <p>Admins: {tenantDetail.stats.admin_count}</p>
              </div>
            )}
            <p className="text-sm text-muted">
              Login URL: <code>/login?tenant={tenantDetail.tenant?.slug}</code>
            </p>
          </div>
        </div>
      )}

      {/* Tenants Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map(t => (
              <tr key={t.id}>
                <td>
                  <button style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 500 }}
                    onClick={() => viewTenant(t)}>
                    {t.name}
                  </button>
                </td>
                <td><code className="text-sm">{t.slug}</code></td>
                <td className="text-sm">{t.owner_email || '-'}</td>
                <td><span className={`badge ${t.is_active ? 'badge-success' : 'badge-danger'}`}>{t.is_active ? 'Active' : 'Inactive'}</span></td>
                <td className="text-sm">{new Date(t.created_at).toLocaleDateString()}</td>
                <td>
                  <button className={`btn btn-sm ${t.is_active ? 'btn-danger' : 'btn-primary'}`}
                    onClick={() => handleToggleActive(t)}>
                    {t.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && <tr><td colSpan={6} className="text-center text-muted">No tenants</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
