import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Inbox,
  Briefcase,
  CheckCircle,
  LayoutDashboard,
} from 'lucide-react';
import LawyerLayout, { StatCard } from '../components/lawyer/LawyerLayout';
import PendingRequestsPanel, { ActiveClientsPanel } from '../components/lawyer/LawyerPanels';
import CapacityPanel, { OverviewPanel } from '../components/lawyer/CapacityPanel';
import * as api from '../services/api';

export default function LawyerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [capacity, setCapacity] = useState(null);
  const [pending, setPending] = useState([]);
  const [active, setActive] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardStats, capacityData, pendingReqs, activeClients] = await Promise.all([
        api.getLawyerDashboard(),
        api.getLawyerCapacity(),
        api.getLawyerRequests('pending'),
        api.getLawyerRequests('active'),
      ]);
      setStats(dashboardStats);
      setCapacity(capacityData);
      setPending(pendingReqs || []);
      setActive(activeClients || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const renderSection = () => {
    switch (activeTab) {
      case 'pending':
        return <PendingRequestsPanel requests={pending} loading={loading} onRefresh={loadAll} />;
      case 'active':
        return <ActiveClientsPanel clients={active} loading={loading} onRefresh={loadAll} />;
      case 'capacity':
        return (
          <CapacityPanel
            capacity={capacity}
            loading={loading}
            onUpdate={loadAll}
          />
        );
      default:
        return (
          <>
            <div className="lawyer-stats-grid">
              <StatCard
                icon={<Users size={22} />}
                label="Active Clients"
                value={stats?.activeClients ?? 0}
                sub={`${stats?.availableSlots ?? 0} slots available`}
              />
              <StatCard
                icon={<Inbox size={22} />}
                label="Pending Requests"
                value={stats?.pendingRequests ?? 0}
                accent={stats?.pendingRequests > 0}
              />
              <StatCard
                icon={<Briefcase size={22} />}
                label="Available Slots"
                value={stats?.availableSlots ?? 0}
                sub={`Max ${capacity?.maxActiveClients ?? 15}`}
              />
              <StatCard
                icon={<CheckCircle size={22} />}
                label="Cases Completed"
                value={stats?.totalCasesCompleted ?? capacity?.casesCompleted ?? 0}
              />
            </div>
            <OverviewPanel stats={stats} loading={loading} />
          </>
        );
    }
  };

  return (
    <LawyerLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'overview' && (
        <div className="tab-section">
          <h2 className="tab-section-title">
            <LayoutDashboard size={22} className="tab-title-icon" />
            Dashboard Overview
          </h2>
        </div>
      )}
      {renderSection()}
    </LawyerLayout>
  );
}
