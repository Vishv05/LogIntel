import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AdminDashboard } from './AdminDashboard';
import { UserDashboard } from './UserDashboard';

export const DashboardPage = () => {
  const { isAdmin, isPort3001 } = useAuth();
  // Admin on port 3001 defaults to 'admin', on port 3000 defaults to 'admin' (can switch to 'soc')
  const [activeView, setActiveView] = useState('admin');

  // Standard user can ONLY access UserDashboard
  if (!isAdmin()) {
    return <UserDashboard />;
  }

  // Admin has full access to both Admin Governance Dashboard and SOC Telemetry Dashboard
  if (activeView === 'soc') {
    return <UserDashboard onSwitchView={() => setActiveView('admin')} />;
  }

  return <AdminDashboard onSwitchView={() => setActiveView('soc')} />;
};

export default DashboardPage;
