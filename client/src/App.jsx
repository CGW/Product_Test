import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { TenantProvider } from './context/TenantContext.jsx';

// Layout
import AppShell from './components/layout/AppShell.jsx';
import AdminShell from './components/layout/AdminShell.jsx';

// Pages
import LoginPage from './pages/LoginPage.jsx';
import TenantSelectPage from './pages/TenantSelectPage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ReadingsPage from './pages/ReadingsPage.jsx';
import ReadingDetailPage from './pages/ReadingDetailPage.jsx';
import LearnPage from './pages/LearnPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import AccountPage from './pages/AccountPage.jsx';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import ManageCardSetsPage from './pages/admin/ManageCardSetsPage.jsx';
import CardSetDetailPage from './pages/admin/CardSetDetailPage.jsx';
import ManageReadingsPage from './pages/admin/ManageReadingsPage.jsx';
import ThemeSettingsPage from './pages/admin/ThemeSettingsPage.jsx';
import WebhookSettingsPage from './pages/admin/WebhookSettingsPage.jsx';
import ManageUsersPage from './pages/admin/ManageUsersPage.jsx';
import AboutEditorPage from './pages/admin/AboutEditorPage.jsx';

// Owner Pages
import TenantsPage from './pages/owner/TenantsPage.jsx';

function ProtectedRoute({ children, minRole }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex-center" style={{ height: '100vh' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const levels = { app_owner_admin: 40, app_admin: 30, oracle_card_admin: 20, user: 10 };
  if (minRole && (levels[user.role] || 0) < (levels[minRole] || 0)) {
    return <Navigate to="/" replace />;
  }

  // Redirect users who haven't completed onboarding
  if (user.role === 'user' && !user.onboarding_completed && window.location.pathname !== '/welcome') {
    return <Navigate to="/welcome" replace />;
  }

  return children;
}

export default function App() {
  return (
    <TenantProvider>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/select-tenant" element={<TenantSelectPage />} />

          {/* Onboarding */}
          <Route path="/welcome" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

          {/* User routes */}
          <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="readings" element={<ReadingsPage />} />
            <Route path="readings/:id" element={<ReadingDetailPage />} />
            <Route path="learn" element={<LearnPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="account" element={<AccountPage />} />
          </Route>

          {/* Admin routes (Oracle Card Admin+) */}
          <Route path="/admin" element={<ProtectedRoute minRole="oracle_card_admin"><AdminShell /></ProtectedRoute>}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="card-sets" element={<ManageCardSetsPage />} />
            <Route path="card-sets/:id" element={<CardSetDetailPage />} />
            <Route path="readings" element={<ManageReadingsPage />} />
            <Route path="theme" element={<ThemeSettingsPage />} />
            <Route path="webhooks" element={<WebhookSettingsPage />} />
            <Route path="users" element={<ManageUsersPage />} />
            <Route path="about-editor" element={<AboutEditorPage />} />
            <Route path="account" element={<AccountPage />} />
          </Route>

          {/* Owner routes */}
          <Route path="/owner" element={<ProtectedRoute minRole="app_admin"><AdminShell owner /></ProtectedRoute>}>
            <Route index element={<TenantsPage />} />
            <Route path="account" element={<AccountPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </TenantProvider>
  );
}
