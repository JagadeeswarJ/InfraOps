import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Navbar } from "./components/Navbar"
import { HomePage } from "./pages/HomePage"
import { AuthForm } from "./pages/AuthForm"
import { Dashboard } from "./pages/Dashboard"
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
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
