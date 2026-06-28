import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Inbox,
  Users,
  Settings,
  LogOut,
  X,
} from 'lucide-react';

export default function LawyerLayout({ activeTab, onTabChange, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'pending', label: 'Pending Requests', icon: <Inbox size={18} /> },
    { id: 'active', label: 'Active Clients', icon: <Users size={18} /> },
    { id: 'capacity', label: 'Capacity', icon: <Settings size={18} /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header-bar glass-panel">
        <div className="dashboard-header-left">
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setShowMobileSidebar(true)}
          >
            ☰
          </button>
          <div className="dashboard-logo">
            <span className="logo-icon">⚖</span>
            <span className="logo-text">LegalLink</span>
            <span className="lawyer-portal-badge">Lawyer Portal</span>
          </div>
        </div>
        <div className="dashboard-header-right">
          <div className="lawyer-header-user">
            <span className="lawyer-header-name">{user?.name || user?.email}</span>
            <span className="lawyer-header-city">{user?.city}</span>
          </div>
        </div>
      </header>

      <div className="dashboard-layout">
        <aside className={`dashboard-sidebar glass-panel ${showMobileSidebar ? 'sidebar-mobile-show' : ''}`}>
          <div>
            <div className="sidebar-mobile-header">
              <h3>Navigation</h3>
              <button type="button" className="sidebar-close-btn" onClick={() => setShowMobileSidebar(false)}>
                <X size={20} />
              </button>
            </div>
            <nav className="sidebar-nav">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-item ${activeTab === item.id ? 'nav-item-active' : ''}`}
                  onClick={() => {
                    onTabChange(item.id);
                    setShowMobileSidebar(false);
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="sidebar-footer">
            <button type="button" onClick={handleLogout} className="sidebar-logout-link">
              <LogOut size={18} />
              Log out
            </button>
          </div>
        </aside>

        {showMobileSidebar && (
          <div className="sidebar-overlay" onClick={() => setShowMobileSidebar(false)} />
        )}

        <main className="dashboard-main-content">{children}</main>
      </div>
    </div>
  );
}

export function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className={`lawyer-stat-card glass-card ${accent ? 'lawyer-stat-accent' : ''}`}>
      <div className="lawyer-stat-icon">{icon}</div>
      <div className="lawyer-stat-body">
        <span className="lawyer-stat-value">{value}</span>
        <span className="lawyer-stat-label">{label}</span>
        {sub && <span className="lawyer-stat-sub">{sub}</span>}
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const variant = {
    Pending: 'warning',
    Accepted: 'info',
    'In Progress': 'info',
    'Waiting for Documents': 'warning',
    Filed: 'accent',
    Resolved: 'success',
    Closed: 'default',
    pending: 'warning',
    accepted: 'success',
    declined: 'danger',
  }[status] || 'default';

  return <span className={`lawyer-status-badge lawyer-status-${variant}`}>{status}</span>;
}

export function formatRequestDate(date) {
  if (!date) return '--';
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
