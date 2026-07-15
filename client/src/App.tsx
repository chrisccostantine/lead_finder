import { BarChart3, BriefcaseBusiness, FileSearch, FileText, MessageSquareText, Search } from 'lucide-react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth/protected-route';
import { AppShell } from './components/app-shell';
import { AuthPage } from './pages/auth-page';
import { DashboardPage } from './pages/dashboard-page';
import { PlaceholderPage } from './pages/placeholder-page';
import { SettingsPage } from './pages/settings-page';

export default function App() {
  return <Routes>
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/setup" element={<AuthPage mode="setup" />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/lead-finder" element={<PlaceholderPage title="Lead Finder" description="Approved provider search and reviewed lead imports will be implemented in Phase 3." icon={Search} />} />
        <Route path="/leads" element={<PlaceholderPage title="Leads" description="Lead management, filtering, and import workflows will be implemented in Phase 2." icon={BriefcaseBusiness} />} />
        <Route path="/audits" element={<PlaceholderPage title="Audits" description="Website and social presence audits will be introduced in their dedicated phases." icon={FileSearch} />} />
        <Route path="/outreach" element={<PlaceholderPage title="Outreach" description="Personalized message generation and lightweight activity tracking are planned for later phases." icon={MessageSquareText} />} />
        <Route path="/proposals" element={<PlaceholderPage title="Proposals" description="Tailored, reviewable proposal generation will be implemented in Phase 9." icon={FileText} />} />
        <Route path="/analytics" element={<PlaceholderPage title="Analytics" description="Acquisition metrics will use real platform data after the underlying workflows are complete." icon={BarChart3} />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>;
}

