import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Navbar } from "./components/Navbar"
import { HomePage } from "./components/HomePage"
import { Login } from "./components/Login"

export default function App() {
  return (
    <BrowserRouter>
      <div className="relative flex min-h-screen flex-col bg-background">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
