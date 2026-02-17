import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { requireRole, requireTenantMatch } from '../middleware/requireRole.js';
import { updateTenantTheme } from '../services/tenantService.js';
import { upload } from '../services/uploadService.js';
import db from '../config/database.js';

const router = Router();

// Get tenant theme (public - used for branding on login page)
router.get('/public/:slug', (req, res) => {
  const tenant = db.prepare('SELECT id, name, slug, business_name FROM tenants WHERE slug = ? AND is_active = 1').get(req.params.slug);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

  const theme = db.prepare('SELECT * FROM tenant_themes WHERE tenant_id = ?').get(tenant.id);
  res.json({ tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, business_name: tenant.business_name }, theme });
});

// Get current tenant theme
router.get('/', authenticate, tenantContext, requireTenantMatch, (req, res) => {
  const theme = db.prepare('SELECT * FROM tenant_themes WHERE tenant_id = ?').get(req.tenant.id);
  res.json({ theme });
});

// Update tenant theme (Oracle Card Admin+)
router.put('/', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'), (req, res) => {
  const theme = updateTenantTheme(req.tenant.id, req.body);
  res.json({ theme });
});

// Upload logo
router.post('/logo', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'),
  upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Image file required' });
    const url = `/uploads/${req.tenant.id}/${req.file.filename}`;
    db.prepare(`UPDATE tenant_themes SET logo_url = ?, updated_at = datetime('now') WHERE tenant_id = ?`)
      .run(url, req.tenant.id);
    res.json({ logo_url: url });
  }
);

// Upload about photo
router.post('/about-photo', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'),
  upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Image file required' });
    const url = `/uploads/${req.tenant.id}/${req.file.filename}`;
    db.prepare(`UPDATE tenant_themes SET about_photo_url = ?, updated_at = datetime('now') WHERE tenant_id = ?`)
      .run(url, req.tenant.id);
    res.json({ about_photo_url: url });
  }
);

// Color scheme presets
router.get('/presets/colors', (_req, res) => {
  res.json({
    presets: [
      { name: 'Mystic Purple', primary: '#6B46C1', secondary: '#D69E2E', background: '#1A202C', surface: '#2D3748', text: '#E2E8F0', accent: '#ED64A6' },
      { name: 'Ocean Deep', primary: '#2B6CB0', secondary: '#38B2AC', background: '#1A365D', surface: '#2A4365', text: '#E2E8F0', accent: '#63B3ED' },
      { name: 'Forest Sage', primary: '#276749', secondary: '#C6923A', background: '#1A2F23', surface: '#234136', text: '#E6FFFA', accent: '#68D391' },
      { name: 'Midnight Rose', primary: '#97266D', secondary: '#C53030', background: '#1A1025', surface: '#2D1B3D', text: '#FED7E2', accent: '#F687B3' },
      { name: 'Ember Gold', primary: '#C05621', secondary: '#D69E2E', background: '#1C1411', surface: '#2D2119', text: '#FFFAF0', accent: '#F6AD55' },
      { name: 'Arctic Frost', primary: '#4299E1', secondary: '#90CDF4', background: '#EBF8FF', surface: '#FFFFFF', text: '#2D3748', accent: '#63B3ED' },
      { name: 'Sunset Glow', primary: '#DD6B20', secondary: '#F6E05E', background: '#1A1108', surface: '#2D1F10', text: '#FEFCBF', accent: '#ED8936' },
      { name: 'Royal Navy', primary: '#2C5282', secondary: '#ECC94B', background: '#0D1B2A', surface: '#1B2838', text: '#E2E8F0', accent: '#667EEA' },
      { name: 'Cherry Blossom', primary: '#D53F8C', secondary: '#FBB6CE', background: '#FFF5F7', surface: '#FFFFFF', text: '#702459', accent: '#ED64A6' },
      { name: 'Earthy Terracotta', primary: '#9C4221', secondary: '#7B341E', background: '#1A1210', surface: '#2D201A', text: '#FFFAF0', accent: '#DD6B20' },
      { name: 'Celestial Blue', primary: '#3182CE', secondary: '#805AD5', background: '#0B1120', surface: '#151D30', text: '#E2E8F0', accent: '#7F9CF5' },
      { name: 'Jade Temple', primary: '#2F855A', secondary: '#F6E05E', background: '#0F1A14', surface: '#1A2D22', text: '#C6F6D5', accent: '#48BB78' },
      { name: 'Lavender Dream', primary: '#805AD5', secondary: '#B794F4', background: '#FAF5FF', surface: '#FFFFFF', text: '#44337A', accent: '#9F7AEA' },
      { name: 'Volcanic Ash', primary: '#E53E3E', secondary: '#FC8181', background: '#1A1A2E', surface: '#16213E', text: '#FED7D7', accent: '#F56565' },
      { name: 'Moonlit Silver', primary: '#718096', secondary: '#A0AEC0', background: '#171923', surface: '#1A202C', text: '#E2E8F0', accent: '#CBD5E0' },
      { name: 'Tropical Paradise', primary: '#319795', secondary: '#F6E05E', background: '#0A1A18', surface: '#153028', text: '#B2F5EA', accent: '#4FD1C5' },
      { name: 'Dark Chocolate', primary: '#744210', secondary: '#D69E2E', background: '#1C1612', surface: '#2D2419', text: '#FEFCBF', accent: '#B7791F' },
      { name: 'Northern Lights', primary: '#38A169', secondary: '#9F7AEA', background: '#0B1120', surface: '#151D30', text: '#C6F6D5', accent: '#68D391' },
      { name: 'Crimson Night', primary: '#C53030', secondary: '#FBD38D', background: '#1A0A0A', surface: '#2D1515', text: '#FED7D7', accent: '#FC8181' },
      { name: 'Clean White', primary: '#4A5568', secondary: '#3182CE', background: '#FFFFFF', surface: '#F7FAFC', text: '#1A202C', accent: '#4299E1' },
    ],
  });
});

// Font pair presets
router.get('/presets/fonts', (_req, res) => {
  res.json({
    presets: [
      { name: 'Classic Elegance', heading: 'Playfair Display', body: 'Inter' },
      { name: 'Modern Minimal', heading: 'Montserrat', body: 'Open Sans' },
      { name: 'Mystical', heading: 'Cinzel', body: 'Raleway' },
      { name: 'Bohemian', heading: 'Amatic SC', body: 'Josefin Sans' },
      { name: 'Literary', heading: 'Merriweather', body: 'Source Sans 3' },
      { name: 'Art Deco', heading: 'Poiret One', body: 'Quicksand' },
      { name: 'Celestial', heading: 'Cormorant Garamond', body: 'Proza Libre' },
      { name: 'Contemporary', heading: 'Poppins', body: 'Nunito' },
      { name: 'Gothic', heading: 'Uncial Antiqua', body: 'Spectral' },
      { name: 'Zen', heading: 'Zen Antique', body: 'Noto Sans' },
      { name: 'Vintage', heading: 'Abril Fatface', body: 'Lato' },
      { name: 'Sacred', heading: 'IM Fell English SC', body: 'Crimson Text' },
      { name: 'Nouveau', heading: 'Tenor Sans', body: 'Work Sans' },
      { name: 'Cosmic', heading: 'Space Grotesk', body: 'DM Sans' },
      { name: 'Nature', heading: 'Bitter', body: 'Cabin' },
      { name: 'Romantic', heading: 'Libre Baskerville', body: 'Karla' },
      { name: 'Bold Modern', heading: 'Bebas Neue', body: 'Roboto' },
      { name: 'Handwritten', heading: 'Caveat', body: 'Assistant' },
      { name: 'Geometric', heading: 'Archivo Black', body: 'Rubik' },
      { name: 'Timeless', heading: 'Lora', body: 'Source Serif 4' },
    ],
  });
});

export default router;
