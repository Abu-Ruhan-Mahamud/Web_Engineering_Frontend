import DashboardLayout from './DashboardLayout';

const labNav = [
  { label: 'Lab Orders', to: '/lab/orders', end: true },
];

export default function LabLayout() {
  return <DashboardLayout navItems={labNav} />;
}
