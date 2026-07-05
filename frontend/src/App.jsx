import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  BrainCircuit, 
  LayoutDashboard, 
  Mic, 
  FileText, 
  MessageSquare, 
  History, 
  LogOut,
  User
} from 'lucide-react';
import api from './services/api';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import InterviewRoom from './pages/InterviewRoom';
import McqRoom from './pages/McqRoom';
import ResumeReview from './pages/ResumeReview';
import CoachChat from './pages/CoachChat';
import HistoryPage from './pages/History';

function SidebarLayout({ user, onLogout, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Dynamic custom API key settings
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyVal, setKeyVal] = useState(localStorage.getItem('grokKey') || '');
  
  const handleSaveKey = () => {
    localStorage.setItem('grokKey', keyVal);
    alert('Grok API Key saved! Live AI features are now active.');
    setShowKeyInput(false);
    window.location.reload();
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo">
          <BrainCircuit size={28} className="logo-icon" />
          <span>PrepAI</span>
        </div>
        
        <nav style={{ flex: 1 }}>
          <ul className="nav-links">
            <li>
              <Link 
                to="/dashboard" 
                className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
              >
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/interview" 
                className={`nav-item ${location.pathname === '/interview' ? 'active' : ''}`}
              >
                <Mic size={20} />
                <span>Mock Interview</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/mcq" 
                className={`nav-item ${location.pathname === '/mcq' ? 'active' : ''}`}
              >
                <FileText size={20} />
                <span>MCQ Test</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/resume" 
                className={`nav-item ${location.pathname === '/resume' ? 'active' : ''}`}
              >
                <FileText size={20} />
                <span>Resume Review</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/coach" 
                className={`nav-item ${location.pathname === '/coach' ? 'active' : ''}`}
              >
                <MessageSquare size={20} />
                <span>AI Coach Chat</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/history" 
                className={`nav-item ${location.pathname === '/history' ? 'active' : ''}`}
              >
                <History size={20} />
                <span>History Logs</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="user-profile-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%', 
              backgroundColor: 'hsl(var(--primary) / 0.2)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'hsl(var(--primary))'
            }}>
              <User size={18} />
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'Candidate'}</span>
              <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                {user?.email || 'user@example.com'}
              </span>
            </div>
          </div>
          <button onClick={onLogout} className="logout-btn" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
      } catch (err) {
        console.error('Session validation failed:', err);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'hsl(var(--bg-dark))',
        color: 'white',
        fontFamily: 'sans-serif'
      }}>
        <BrainCircuit size={48} style={{ 
          animation: 'pulseGlow 2s infinite', 
          color: 'hsl(var(--primary))',
          marginBottom: '1rem'
        }} />
        <h3>Loading PrepAI Workspace...</h3>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" /> : <Login onLoginSuccess={handleLogin} />} 
        />
        <Route 
          path="/signup" 
          element={user ? <Navigate to="/dashboard" /> : <Signup onSignupSuccess={handleLogin} />} 
        />
        
        <Route 
          path="/dashboard" 
          element={
            user ? (
              <SidebarLayout user={user} onLogout={handleLogout}>
                <Dashboard user={user} />
              </SidebarLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        
        <Route 
          path="/interview" 
          element={
            user ? (
              <SidebarLayout user={user} onLogout={handleLogout}>
                <InterviewRoom />
              </SidebarLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        <Route 
          path="/mcq" 
          element={
            user ? (
              <SidebarLayout user={user} onLogout={handleLogout}>
                <McqRoom />
              </SidebarLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        <Route 
          path="/resume" 
          element={
            user ? (
              <SidebarLayout user={user} onLogout={handleLogout}>
                <ResumeReview />
              </SidebarLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        <Route 
          path="/coach" 
          element={
            user ? (
              <SidebarLayout user={user} onLogout={handleLogout}>
                <CoachChat />
              </SidebarLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        <Route 
          path="/history" 
          element={
            user ? (
              <SidebarLayout user={user} onLogout={handleLogout}>
                <HistoryPage />
              </SidebarLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* Fallback routing */}
        <Route 
          path="*" 
          element={<Navigate to={user ? "/dashboard" : "/login"} />} 
        />
      </Routes>
    </Router>
  );
}
