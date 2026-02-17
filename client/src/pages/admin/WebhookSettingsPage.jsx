import { useState, useEffect } from 'react';
import { api } from '../../api/client.js';

export default function WebhookSettingsPage() {
  const [webhooks, setWebhooks] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [webhookForm, setWebhookForm] = useState({ event_type: 'user.registered', url: '', secret: '' });
  const [keyLabel, setKeyLabel] = useState('');
  const [newKey, setNewKey] = useState(null);
  const [tab, setTab] = useState('webhooks');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    api.get('/webhooks').then(d => setWebhooks(d.webhooks || [])).catch(() => {});
    api.get('/webhooks/api-keys').then(d => setApiKeys(d.api_keys || [])).catch(() => {});
    api.get('/webhooks/logs').then(d => setLogs(d.logs || [])).catch(() => {});
  };

  const handleCreateWebhook = async (e) => {
    e.preventDefault();
    try {
      await api.post('/webhooks', webhookForm);
      setShowAddWebhook(false);
      setWebhookForm({ event_type: 'user.registered', url: '', secret: '' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteWebhook = async (id) => {
    if (!confirm('Delete this webhook?')) return;
    await api.delete(`/webhooks/${id}`);
    loadData();
  };

  const handleTestWebhook = async (id) => {
    try {
      const data = await api.post(`/webhooks/${id}/test`);
      alert(data.success ? `Test sent! Status: ${data.status}` : `Failed: ${data.error}`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateApiKey = async () => {
    try {
      const data = await api.post('/webhooks/api-keys', { label: keyLabel || 'Default' });
      setNewKey(data.api_key);
      setKeyLabel('');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRevokeKey = async (id) => {
    if (!confirm('Revoke this API key?')) return;
    await api.delete(`/webhooks/api-keys/${id}`);
    loadData();
  };

  return (
    <div>
      <h1 className="mb-3">Webhooks & API</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        {['webhooks', 'api-keys', 'logs'].map(t => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setTab(t)}>
            {t === 'webhooks' ? 'Webhooks' : t === 'api-keys' ? 'API Keys' : 'Logs'}
          </button>
        ))}
      </div>

      {/* Webhooks Tab */}
      {tab === 'webhooks' && (
        <>
          <div className="flex-between mb-2">
            <h2>Webhooks</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddWebhook(!showAddWebhook)}>
              {showAddWebhook ? 'Cancel' : 'Add Webhook'}
            </button>
          </div>

          <p className="text-muted mb-3 text-sm">
            Webhooks send real-time notifications to your Zapier account when events occur (user registration, onboarding completion, readings).
          </p>

          {showAddWebhook && (
            <div className="card mb-3" style={{ maxWidth: 500 }}>
              <form onSubmit={handleCreateWebhook}>
                <div className="form-group">
                  <label>Event Type</label>
                  <select value={webhookForm.event_type} onChange={e => setWebhookForm({ ...webhookForm, event_type: e.target.value })}>
                    <option value="user.registered">User Registered</option>
                    <option value="user.onboarding_completed">Onboarding Completed</option>
                    <option value="reading.completed">Reading Completed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Webhook URL (Zapier Catch Hook URL)</label>
                  <input type="url" value={webhookForm.url} onChange={e => setWebhookForm({ ...webhookForm, url: e.target.value })}
                    placeholder="https://hooks.zapier.com/hooks/catch/..." required />
                </div>
                <div className="form-group">
                  <label>Signing Secret (optional)</label>
                  <input type="text" value={webhookForm.secret} onChange={e => setWebhookForm({ ...webhookForm, secret: e.target.value })}
                    placeholder="For HMAC signature verification" />
                </div>
                <button type="submit" className="btn btn-primary">Create Webhook</button>
              </form>
            </div>
          )}

          {webhooks.length === 0 ? (
            <div className="card empty-state">
              <h3>No webhooks configured</h3>
              <p className="text-muted">Add a webhook to start sending events to Zapier</p>
            </div>
          ) : (
            <div className="grid grid-2">
              {webhooks.map(w => (
                <div key={w.id} className="card">
                  <div className="flex-between mb-1">
                    <span className="badge badge-info">{w.event_type}</span>
                    <span className={`badge ${w.is_active ? 'badge-success' : 'badge-warning'}`}>
                      {w.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm mb-2" style={{ wordBreak: 'break-all' }}>{w.url}</p>
                  <div className="flex gap-1">
                    <button className="btn btn-secondary btn-sm" onClick={() => handleTestWebhook(w.id)}>Test</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteWebhook(w.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* API Keys Tab */}
      {tab === 'api-keys' && (
        <>
          <h2 className="mb-2">API Keys</h2>
          <p className="text-muted mb-3 text-sm">
            Generate API keys for Zapier or external integrations. Each key is scoped to your Oracle App Instance.
          </p>

          <div className="card mb-3" style={{ maxWidth: 400 }}>
            <div className="form-group">
              <label>Key Label</label>
              <input type="text" value={keyLabel} onChange={e => setKeyLabel(e.target.value)} placeholder="e.g. Zapier Production" />
            </div>
            <button className="btn btn-primary" onClick={handleCreateApiKey}>Generate API Key</button>
          </div>

          {newKey && (
            <div className="card mb-3" style={{ background: '#276749', padding: '1rem' }}>
              <h3 className="mb-1" style={{ fontSize: '1rem' }}>New API Key Generated</h3>
              <p className="text-sm mb-2" style={{ fontWeight: 700 }}>Save this key now - it will not be shown again!</p>
              <code style={{ display: 'block', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius)', wordBreak: 'break-all', fontSize: '0.85rem' }}>
                {newKey.key}
              </code>
              <button className="btn btn-secondary btn-sm mt-2" onClick={() => {
                navigator.clipboard.writeText(newKey.key);
                alert('Copied!');
              }}>Copy to Clipboard</button>
            </div>
          )}

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Key Prefix</th>
                  <th>Status</th>
                  <th>Last Used</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map(k => (
                  <tr key={k.id}>
                    <td>{k.label}</td>
                    <td><code>{k.key_prefix}...</code></td>
                    <td><span className={`badge ${k.is_active ? 'badge-success' : 'badge-danger'}`}>{k.is_active ? 'Active' : 'Revoked'}</span></td>
                    <td className="text-sm">{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Never'}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => handleRevokeKey(k.id)}>Revoke</button></td>
                  </tr>
                ))}
                {apiKeys.length === 0 && <tr><td colSpan={5} className="text-center text-muted">No API keys</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Logs Tab */}
      {tab === 'logs' && (
        <>
          <h2 className="mb-2">Webhook Logs</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id}>
                    <td>{l.event_type}</td>
                    <td>
                      <span className={`badge ${l.response_status && l.response_status < 400 ? 'badge-success' : 'badge-danger'}`}>
                        {l.response_status || 'Error'}
                      </span>
                    </td>
                    <td className="text-sm">{new Date(l.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {logs.length === 0 && <tr><td colSpan={3} className="text-center text-muted">No webhook logs yet</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
