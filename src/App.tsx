import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PublicLayout } from './layouts/PublicLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { HomePage } from './pages/public/Home'
import { AboutPage } from './pages/public/About'
import { ServicesPage } from './pages/public/Services'
import { BookPage } from './pages/public/Book'
import { MyAppointmentsPage } from './pages/public/MyAppointments'
import { LoginPage } from './pages/admin/Login'
import { DashboardPage } from './pages/admin/Dashboard'
import { AppointmentsPage } from './pages/admin/Appointments'
import { PatientsPage } from './pages/admin/Patients'
import { AvailabilityPage } from './pages/admin/Availability'
import { SettingsPage } from './pages/admin/Settings'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="sobre-mi" element={<AboutPage />} />
            <Route path="servicios" element={<ServicesPage />} />
            <Route path="agendar" element={<BookPage />} />
            <Route path="mis-citas" element={<MyAppointmentsPage />} />
          </Route>

          <Route path="/admin/login" element={<LoginPage />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="citas" element={<AppointmentsPage />} />
            <Route path="pacientes" element={<PatientsPage />} />
            <Route path="disponibilidad" element={<AvailabilityPage />} />
            <Route path="configuracion" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
