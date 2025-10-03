import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Mentorship from './pages/Mentorship'
import Opportunities from './pages/Opportunities'
import Stories from './pages/Stories'
import Scholarships from './pages/Scholarships'
import Admin from './pages/Admin'
import AdminStudents from './pages/AdminStudents'
import AdminAlumni from './pages/AdminAlumni'
import Login from './pages/Login'

function Sidebar() {
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/opportunities', label: 'Opportunities', icon: '💼' },
    { path: '/mentorship', label: 'Mentorship', icon: '🤝' },
    { path: '/scholarships', label: 'Scholarships', icon: '🎓' },
    { path: '/stories', label: 'Stories', icon: '📖' }
  ]

  // Add Admin links only for admin users
  if (user.role === 'admin') {
    navItems.push(
      { path: '/admin/students', label: 'Students', icon: '👨‍🎓' },
      { path: '/admin/alumni', label: 'Alumni', icon: '👨‍💼' },
      { path: '/admin', label: 'Admin Panel', icon: '🛡️' }
    )
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <Link to="/" className="logo">Alumni Connect</Link>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}

function Header() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleLogout = () => {
    localStorage.clear()
    window.location.reload()
  }

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'
  }

  return (
    <div className="header">
      <div className="header-left">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search opportunities, people, stories..."
          />
        </div>
      </div>
      <div className="header-right">
        <div className="user-info">
          <div className="user-avatar">
            {getInitials(user.name)}
          </div>
          <div className="user-details">
            <div className="user-name">{user.name || 'User'}</div>
            <div className="user-role">{user.role || 'Member'}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  )
}

function ProtectedRoute({ children, allowedRoles }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  
  return children
}

function ProtectedApp() {
  return (
    <div className="main-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mentorship" element={<Mentorship />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/scholarships" element={<Scholarships />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Admin />
            </ProtectedRoute>
          } />
          <Route path="/admin/students" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminStudents />
            </ProtectedRoute>
          } />
          <Route path="/admin/alumni" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminAlumni />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </div>
  )
}

export default function App() {
  const [hasToken, setHasToken] = useState(!!localStorage.getItem('token'))

  if (!hasToken) {
    return (
      <Routes>
        <Route path="*" element={<Login onLoginSuccess={() => setHasToken(true)} />} />
      </Routes>
    )
  }

  return <ProtectedApp />
}
