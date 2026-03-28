import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'

// Layouts
import PatientLayout from './components/layout/PatientLayout'
import DoctorLayout from './components/layout/DoctorLayout'
import AdminLayout from './components/layout/AdminLayout'
import LabLayout from './components/layout/LabLayout'

// Public pages
import Homepage from './pages/public/Homepage'
import Login from './pages/public/Login'
import Registration from './pages/public/Registration'
import PrivacyPolicy from './pages/public/PrivacyPolicy'
import Cookies from './pages/public/Cookies'
import NotFound from './pages/public/NotFound'

// Patient pages
import PatientDashboard from './pages/patient/Dashboard'
import PatientAppointments from './pages/patient/Appointments'
import PatientMedicalRecords from './pages/patient/MedicalRecords'
import PatientPrescriptions from './pages/patient/Prescriptions'
import PatientDocuments from './pages/patient/Documents'
import PatientLabResults from './pages/patient/LabResults'
import PatientMedications from './pages/patient/Medications'
import PatientProfile from './pages/patient/Profile'

// Doctor pages
import DoctorDashboard from './pages/doctor/Dashboard'
import DoctorSchedule from './pages/doctor/ScheduleManagement'
import DoctorPatients from './pages/doctor/Patients'
import DoctorPatientDetail from './pages/doctor/PatientDetail'
import DoctorCreateRecord from './pages/doctor/CreateRecord'
import DoctorPendingReports from './pages/doctor/PendingReports'
import DoctorProfile from './pages/doctor/Profile'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminUserManagement from './pages/admin/UserManagement'
import AdminAppointments from './pages/admin/Appointments'

// Lab tech pages
import LabOrders from './pages/lab/LabOrders'
import LabProfile from './pages/lab/Profile'

// Shared pages
import Notifications from './pages/common/Notifications'

function App() {
  const { isAuthenticated, user, loading } = useAuth()

  // Redirect authenticated users to their dashboard
  const getDashboardPath = () => {
    if (!user) return '/login'
    const map = {
      patient: '/patient/dashboard',
      doctor: '/doctor/dashboard',
      admin: '/admin/dashboard',
      lab_tech: '/lab/orders',
    }
    return map[user.user_type] || '/login'
  }

  // H-11: Show loading spinner while auth state is being validated
  const authGate = (component) => {
    if (loading) return <div className="loading-spinner" />
    return isAuthenticated ? <Navigate to={getDashboardPath()} replace /> : component
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Homepage />} />
      <Route path="/login" element={authGate(<Login />)} />
      <Route path="/register" element={authGate(<Registration />)} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/cookies" element={<Cookies />} />

      {/* Patient Routes — nested under PatientLayout */}
      <Route
        path="/patient"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<PatientDashboard />} />
        <Route path="appointments" element={<PatientAppointments />} />
        <Route path="medical-records" element={<PatientMedicalRecords />} />
        <Route path="prescriptions" element={<PatientPrescriptions />} />
        <Route path="documents" element={<PatientDocuments />} />
        <Route path="lab-results" element={<PatientLabResults />} />
        <Route path="medications" element={<PatientMedications />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<PatientProfile />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Doctor Routes — nested under DoctorLayout */}
      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="schedule" element={<DoctorSchedule />} />
        <Route path="patients" element={<DoctorPatients />} />
        <Route path="patients/:patientId" element={<DoctorPatientDetail />} />
        <Route path="patients/:patientId/create-record" element={<DoctorCreateRecord />} />
        <Route path="pending-reports" element={<DoctorPendingReports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<DoctorProfile />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Admin Routes — nested under AdminLayout */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUserManagement />} />
        <Route path="appointments" element={<AdminAppointments />} />
        <Route path="notifications" element={<Notifications />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Lab Tech Routes — nested under LabLayout */}
      <Route
        path="/lab"
        element={
          <ProtectedRoute allowedRoles={['lab_tech']}>
            <LabLayout />
          </ProtectedRoute>
        }
      >
        <Route path="orders" element={<LabOrders />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<LabProfile />} />
        <Route index element={<Navigate to="orders" replace />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
