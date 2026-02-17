import { useTenant } from '../context/TenantContext.jsx';

export default function AboutPage() {
  const { tenant, theme } = useTenant();

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {theme?.about_photo_url && (
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src={theme.about_photo_url} alt={tenant?.name}
            style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 'var(--radius)', objectFit: 'cover' }} />
        </div>
      )}

      <h1 className="mb-2">{tenant?.name || 'About'}</h1>
      {tenant?.business_name && <p className="text-muted mb-3">{tenant.business_name}</p>}

      {theme?.about_content ? (
        <div className="card" style={{ padding: '2rem' }}
          dangerouslySetInnerHTML={{ __html: theme.about_content.replace(/\n/g, '<br/>') }} />
      ) : (
        <div className="card empty-state">
          <h3>About this Oracle</h3>
          <p className="text-muted">The oracle guide hasn't added their about page yet.</p>
        </div>
      )}

      {theme?.about_cta_text && theme?.about_cta_url && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <a href={theme.about_cta_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            {theme.about_cta_text}
          </a>
        </div>
      )}
    </div>
  );
}
