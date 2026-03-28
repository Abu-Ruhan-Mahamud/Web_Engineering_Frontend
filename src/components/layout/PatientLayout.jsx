import DashboardLayout from './DashboardLayout';

const patientNav = [
  { label: 'Dashboard', to: '/patient/dashboard', end: true },
  { label: 'Appointments', to: '/patient/appointments' },
  { label: 'Medical Records', to: '/patient/medical-records' },
  { label: 'Prescriptions', to: '/patient/prescriptions' },
  { label: 'Medications', to: '/patient/medications' },
  { label: 'Lab Results', to: '/patient/lab-results' },
  { label: 'Documents', to: '/patient/documents' },
];

export default function PatientLayout() {
  return <DashboardLayout navItems={patientNav} />;
}
