import { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext.jsx';
import { api } from '../../api/client.js';

export default function AboutEditorPage() {
  const { theme, updateTheme } = useTenant();
  const [form, setForm] = useState({
    about_content: '',
    about_cta_text: '',
    about_cta_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (theme) {
      setForm({
        about_content: theme.about_content || '',
        about_cta_text: theme.about_cta_text || '',
        about_cta_url: theme.about_cta_url || '',
      });
    }
  }, [theme]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTheme(form);
      setMessage('About page updated!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPhoto = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      await api.upload('/theme/about-photo', formData);
      setMessage('Photo uploaded!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error uploading photo');
    }
  };

  return (
    <div>
      <div className="flex-between mb-3">
        <h1>Edit About Page</h1>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message && (
        <div className="card mb-3" style={{ background: message.startsWith('Error') ? '#742A2A' : '#276749', padding: '0.75rem' }}>
          {message}
        </div>
      )}

      {/* Photo */}
      <div className="card mb-3">
        <h2 className="mb-2">About Photo</h2>
        {theme?.about_photo_url && (
          <img src={theme.about_photo_url} alt="" style={{ maxWidth: 300, maxHeight: 300, borderRadius: 'var(--radius)', marginBottom: '1rem', display: 'block' }} />
        )}
        <input type="file" accept="image/*" onChange={e => e.target.files[0] && handleUploadPhoto(e.target.files[0])} />
      </div>

      {/* Content */}
      <div className="card mb-3">
        <h2 className="mb-2">About Content</h2>
        <p className="text-sm text-muted mb-2">Write about yourself, your oracle practice, and what users can expect. Use plain text (line breaks are preserved).</p>
        <textarea
          value={form.about_content}
          onChange={e => setForm({ ...form, about_content: e.target.value })}
          rows={12}
          placeholder="Tell your story... Who you are, your practice, what makes your oracle unique."
          style={{ fontFamily: 'var(--font-body)' }}
        />
      </div>

      {/* CTA Buttons */}
      <div className="card mb-3">
        <h2 className="mb-2">Call to Action</h2>
        <div className="grid grid-2">
          <div className="form-group">
            <label>Button Text</label>
            <input type="text" value={form.about_cta_text} onChange={e => setForm({ ...form, about_cta_text: e.target.value })}
              placeholder="e.g. Book a Session" />
          </div>
          <div className="form-group">
            <label>Button Link</label>
            <input type="url" value={form.about_cta_url} onChange={e => setForm({ ...form, about_cta_url: e.target.value })}
              placeholder="https://..." />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="card">
        <h2 className="mb-2">Preview</h2>
        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius)' }}>
          {theme?.about_photo_url && (
            <img src={theme.about_photo_url} alt="" style={{ maxWidth: 200, borderRadius: 'var(--radius)', marginBottom: '1rem' }} />
          )}
          <div dangerouslySetInnerHTML={{ __html: form.about_content.replace(/\n/g, '<br/>') }} />
          {form.about_cta_text && (
            <button className="btn btn-primary mt-3">{form.about_cta_text}</button>
          )}
        </div>
      </div>
    </div>
  );
}
