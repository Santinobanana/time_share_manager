import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, ArrowLeftRight, Users, User, LogOut, Settings, Menu, X } from 'lucide-react';

export default function Navbar({ user, isAdmin, onLogout }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActive = (path) => {
    return location.pathname === path ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white';
  };
  
  const userNavItems = [
    { path: '/dashboard', label: 'Inicio', icon: Home },
    { path: '/my-weeks', label: 'Mis Semanas', icon: Calendar },
    { path: '/exchanges', label: 'Intercambios', icon: ArrowLeftRight },
    { path: '/availability', label: 'Disponibilidad', icon: Users },
  ];
  
  const adminNavItems = [
    { path: '/admin/users', label: 'Usuarios', icon: Users },
    { path: '/admin/titles', label: 'Títulos', icon: Settings },
  ];

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };
  
  return (
    <nav className="bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="text-white text-lg sm:text-xl font-bold">
              Nombre por definir
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-2">
            {userNavItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`${isActive(path)} px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
            
            {isAdmin && adminNavItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`${isActive(path)} px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}

            <Link
              to="/profile"
              className={`${isActive('/profile')} px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors`}
            >
              <User size={18} />
              {user?.name || 'Perfil'}
            </Link>
            
            <button
              onClick={onLogout}
              className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <LogOut size={18} />
              Salir
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-300 hover:bg-gray-700 hover:text-white p-2 rounded-md"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {userNavItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={handleNavClick}
                className={`${isActive(path)} block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
            
            {isAdmin && (
              <>
                <div className="border-t border-gray-700 my-2"></div>
                {adminNavItems.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={handleNavClick}
                    className={`${isActive(path)} block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2`}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                ))}
              </>
            )}

            <div className="border-t border-gray-700 my-2"></div>
            
            <Link
              to="/profile"
              onClick={handleNavClick}
              className={`${isActive('/profile')} block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2`}
            >
              <User size={18} />
              {user?.name || 'Perfil'}
            </Link>
            
            <button
              onClick={() => {
                handleNavClick();
                onLogout();
              }}
              className="w-full text-left text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
            >
              <LogOut size={18} />
              Salir
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}