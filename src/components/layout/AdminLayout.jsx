import DashboardLayout from './DashboardLayout';

const adminNav = [
  { label: 'Dashboard', to: '/admin/dashboard', end: true },
  { label: 'Users', to: '/admin/users' },
  { label: 'Appointments', to: '/admin/appointments' },
];

export default function AdminLayout() {
  return <DashboardLayout navItems={adminNav} />;
}
