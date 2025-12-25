import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CreditsProvider } from './contexts/CreditsContext';
import ProtectedLayout from './components/ProtectedLayout';
import CreatorTool from './components/CreatorTool';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import ProfilePage from './pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <CreditsProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            
            {/* Public Home (Editor) */}
            <Route path="/" element={<CreatorTool />} />
            
            {/* Protected Routes (Future use, e.g. Profile, Settings) */}
            <Route element={<ProtectedLayout />}>
               <Route path="/profile" element={<ProfilePage />} />
               <Route path="/dashboard" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Router>
      </CreditsProvider>
    </AuthProvider>
  );
}
