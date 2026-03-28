import DashboardLayout from './DashboardLayout';

const doctorNav = [
  { label: 'Dashboard', to: '/doctor/dashboard', end: true },
  { label: 'Schedule', to: '/doctor/schedule' },
  { label: 'Patients', to: '/doctor/patients' },
  { label: 'Pending Reports', to: '/doctor/pending-reports' },
];

export default function DoctorLayout() {
  return <DashboardLayout navItems={doctorNav} />;
}
