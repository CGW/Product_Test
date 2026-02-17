import { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext.jsx';
import { api } from '../../api/client.js';

export default function ThemeSettingsPage() {
  const { theme, updateTheme } = useTenant();
  const [colorPresets, setColorPresets] = useState([]);
  const [fontPresets, setFontPresets] = useState([]);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (theme) {
      setForm({
        primary_color: theme.primary_color,
        secondary_color: theme.secondary_color,
        background_color: theme.background_color,
        surface_color: theme.surface_color,
        text_color: theme.text_color,
        accent_color: theme.accent_color,
        heading_font: theme.heading_font,
        body_font: theme.body_font,
      });
    }
    api.get('/theme/presets/colors').then(d => setColorPresets(d.presets || [])).catch(() => {});
    api.get('/theme/presets/fonts').then(d => setFontPresets(d.presets || [])).catch(() => {});
  }, [theme]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTheme(form);
      setMessage('Theme updated!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const applyColorPreset = (preset) => {
    setForm(prev => ({
      ...prev,
      primary_color: preset.primary,
      secondary_color: preset.secondary,
      background_color: preset.background,
      surface_color: preset.surface,
      text_color: preset.text,
      accent_color: preset.accent,
    }));
  };

  const applyFontPreset = (preset) => {
    setForm(prev => ({
      ...prev,
      heading_font: preset.heading,
      body_font: preset.body,
    }));
  };

  const handleUploadLogo = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const data = await api.upload('/theme/logo', formData);
    setMessage('Logo uploaded!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div>
      <div className="flex-between mb-3">
        <h1>Theme & Branding</h1>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Theme'}
        </button>
      </div>

      {message && (
        <div className="card mb-3" style={{ background: message.startsWith('Error') ? '#742A2A' : '#276749', padding: '0.75rem' }}>
          {message}
        </div>
      )}

      {/* Color Presets */}
      <div className="card mb-3">
        <h2 className="mb-2">Color Scheme</h2>
        <p className="text-sm text-muted mb-2">Choose a preset or customize individual colors:</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {colorPresets.map(p => (
            <button key={p.name} onClick={() => applyColorPreset(p)}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: 'var(--radius)',
                background: p.background,
                color: p.text,
                border: `2px solid ${p.primary}`,
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}>
              {p.name}
            </button>
          ))}
        </div>

        <div className="grid grid-3">
          {[
            { key: 'primary_color', label: 'Primary' },
            { key: 'secondary_color', label: 'Secondary' },
            { key: 'background_color', label: 'Background' },
            { key: 'surface_color', label: 'Surface' },
            { key: 'text_color', label: 'Text' },
            { key: 'accent_color', label: 'Accent' },
          ].map(({ key, label }) => (
            <div key={key} className="form-group">
              <label>{label}</label>
              <div className="flex gap-1" style={{ alignItems: 'center' }}>
                <input type="color" value={form[key] || '#000000'} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  style={{ width: 40, height: 36, padding: 2, cursor: 'pointer' }} />
                <input type="text" value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.85rem' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Font Presets */}
      <div className="card mb-3">
        <h2 className="mb-2">Font Pairing</h2>
        <p className="text-sm text-muted mb-2">Choose a font pair or enter custom font names:</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {fontPresets.map(p => (
            <button key={p.name} onClick={() => applyFontPreset(p)}
              className="btn btn-secondary btn-sm"
              style={{ fontFamily: `'${p.heading}', serif` }}>
              {p.name}
            </button>
          ))}
        </div>

        <div className="grid grid-2">
          <div className="form-group">
            <label>Heading Font</label>
            <input type="text" value={form.heading_font || ''} onChange={e => setForm({ ...form, heading_font: e.target.value })} />
            <p style={{ fontFamily: `'${form.heading_font}', serif`, fontSize: '1.2rem', marginTop: '0.5rem' }}>
              Preview Heading Text
            </p>
          </div>
          <div className="form-group">
            <label>Body Font</label>
            <input type="text" value={form.body_font || ''} onChange={e => setForm({ ...form, body_font: e.target.value })} />
            <p style={{ fontFamily: `'${form.body_font}', sans-serif`, marginTop: '0.5rem' }}>
              Preview body text for this font pairing.
            </p>
          </div>
        </div>
      </div>

      {/* Logo Upload */}
      <div className="card mb-3">
        <h2 className="mb-2">Logo</h2>
        {theme?.logo_url && (
          <img src={theme.logo_url} alt="Logo" style={{ height: 50, marginBottom: '1rem' }} />
        )}
        <input type="file" accept="image/*" onChange={e => e.target.files[0] && handleUploadLogo(e.target.files[0])} />
      </div>

      {/* Live Preview */}
      <div className="card" style={{
        background: form.background_color, color: form.text_color, padding: '2rem',
      }}>
        <h2 style={{ fontFamily: `'${form.heading_font}', serif`, color: form.primary_color, marginBottom: '0.5rem' }}>
          Live Preview
        </h2>
        <p style={{ fontFamily: `'${form.body_font}', sans-serif`, marginBottom: '1rem' }}>
          This is how your app will look with the current theme settings.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ background: form.primary_color, color: 'white', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius)' }}>Primary</span>
          <span style={{ background: form.secondary_color, color: 'white', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius)' }}>Secondary</span>
          <span style={{ background: form.accent_color, color: 'white', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius)' }}>Accent</span>
          <span style={{ background: form.surface_color, color: form.text_color, padding: '0.4rem 0.8rem', borderRadius: 'var(--radius)', border: '1px solid rgba(255,255,255,0.1)' }}>Surface</span>
        </div>
      </div>
    </div>
  );
}
