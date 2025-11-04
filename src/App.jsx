import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './pages/Dashboard';
import MyWeeks from './pages/MyWeeks';
import Availability from './pages/Availability';
import Exchanges from './pages/Exchanges';
import Profile from './pages/Profile';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTitles from './pages/admin/AdminTitles';

// Componente para proteger rutas
function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (!user.isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Cuenta pendiente de aprobación</h3>
          <p className="text-gray-600">
            Tu cuenta está siendo revisada por un administrador. Te notificaremos por correo cuando sea aprobada.
          </p>
        </div>
      </div>
    );
  }
  
  return children;
}

// Layout principal con Navbar
function Layout({ children }) {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} isAdmin={user?.isAdmin} onLogout={logout} />
      <main>{children}</main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Rutas protegidas */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/my-weeks" element={
            <ProtectedRoute>
              <Layout>
                <MyWeeks />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/exchanges" element={
            <ProtectedRoute>
              <Layout>
                <Exchanges />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/availability" element={
            <ProtectedRoute>
              <Layout>
                <Availability />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/users" element={
            <ProtectedRoute>
              <Layout>
                <AdminUsers />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/titles" element={
            <ProtectedRoute>
              <Layout>
                <AdminTitles />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Redireccion por defecto */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;