import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Navbar } from "./components/Navbar"
import { HomePage } from "./pages/HomePage"
import { AuthForm } from "./pages/AuthForm"
import { Dashboard } from "./pages/Dashboard"
import { UserDashboard } from "./pages/UserDashboard"
import { TechnicianDashboard } from "./pages/TechnicianDashboard"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { AuthProvider } from "./contexts/AuthContext"

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="relative flex min-h-screen flex-col bg-background">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<AuthForm />} />
            <Route path="/dashboard" element={
              <ProtectedRoute requiredRole="manager">
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/user-dashboard" element={
              <ProtectedRoute requiredRole="resident">
                <UserDashboard />
              </ProtectedRoute>
            } />
            <Route path="/technician-dashboard" element={
              <ProtectedRoute requiredRole="technician">
                <TechnicianDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
