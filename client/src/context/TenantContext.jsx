import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setTenantSlug } from '../api/client.js';

const TenantContext = createContext(null);

export function TenantProvider({ children }) {
  const [tenant, setTenant] = useState(null);
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadTenant = useCallback(async (slug) => {
    try {
      setTenantSlug(slug);
      const data = await api.get(`/theme/public/${slug}`);
      setTenant(data.tenant);
      setTheme(data.theme);
      applyTheme(data.theme);
    } catch {
      // Tenant not found
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshTheme = useCallback(async () => {
    try {
      const data = await api.get('/theme');
      setTheme(data.theme);
      applyTheme(data.theme);
    } catch {
      // ignore
    }
  }, []);

  const updateTheme = useCallback(async (updates) => {
    const data = await api.put('/theme', updates);
    setTheme(data.theme);
    applyTheme(data.theme);
    return data.theme;
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, theme, loading, loadTenant, refreshTheme, updateTheme, setTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

function applyTheme(theme) {
  if (!theme) return;
  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.primary_color);
  root.style.setProperty('--color-secondary', theme.secondary_color);
  root.style.setProperty('--color-background', theme.background_color);
  root.style.setProperty('--color-surface', theme.surface_color);
  root.style.setProperty('--color-text', theme.text_color);
  root.style.setProperty('--color-accent', theme.accent_color);
  root.style.setProperty('--font-heading', `'${theme.heading_font}', serif`);
  root.style.setProperty('--font-body', `'${theme.body_font}', sans-serif`);

  // Dynamically load Google Fonts
  const fontLink = document.getElementById('dynamic-fonts');
  if (fontLink) fontLink.remove();
  const link = document.createElement('link');
  link.id = 'dynamic-fonts';
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(theme.heading_font)}:wght@400;600;700&family=${encodeURIComponent(theme.body_font)}:wght@300;400;500;600&display=swap`;
  document.head.appendChild(link);
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
}
