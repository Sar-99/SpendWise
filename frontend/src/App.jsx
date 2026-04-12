import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AuthForm from './components/auth/AuthForm';
import ProfilesScreen from './components/profiles/ProfilesScreen';
import Workspace from './components/workspace/Workspace';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/auth" />;
};

const AppContent = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/auth" element={!user ? <AuthForm /> : <Navigate to="/profiles" />} />
      <Route
        path="/profiles"
        element={
          <PrivateRoute>
            <ProfilesScreen />
          </PrivateRoute>
        }
      />
      <Route
        path="/workspace"
        element={
          <PrivateRoute>
            <Workspace />
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to={user ? '/profiles' : '/auth'} />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;