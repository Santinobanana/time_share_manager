import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import { User, Mail, Phone, Key, Calendar, Home, Edit, Save, X } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  // Datos simulados - En Fase 2 vendrán de Firebase
  const userTitles = user?.titles || ['A-1-1', 'A-2-3'];
  const accountInfo = {
    createdAt: '2026-01-15',
    lastLogin: '2027-01-10',
    totalWeeks: 6,
    exchangesCompleted: 2
  };

  const getSerieColor = (title) => {
    const serie = title.charAt(0);
    return {
      'A': 'bg-serie-a',
      'B': 'bg-serie-b',
      'C': 'bg-serie-c',
      'D': 'bg-serie-d'
    }[serie];
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancelar edición - restaurar valores originales
      setEditForm({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || ''
      });
      setErrors({});
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = () => {
    // Validaciones
    const newErrors = {};
    
    if (!editForm.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    if (!editForm.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(editForm.email)) {
      newErrors.email = 'Email inválido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Simulación - En Fase 2 actualizará Firebase
    console.log('Actualizar perfil:', editForm);
    alert('Perfil actualizado exitosamente');
    setIsEditing(false);
    setErrors({});
  };

  const handleChangePassword = () => {
    // Validaciones
    const newErrors = {};
    
    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'La contraseña actual es requerida';
    }
    
    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'La nueva contraseña es requerida';
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Simulación - En Fase 2 actualizará Firebase
    console.log('Cambiar contraseña');
    alert('Contraseña actualizada exitosamente');
    setShowPasswordModal(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setErrors({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-1">
          Gestiona tu información personal y configuración
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna izquierda - Información principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información personal */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Información Personal
              </h2>
              {!isEditing ? (
                <Button
                  variant="outline"
                  onClick={handleEditToggle}
                  className="flex items-center gap-2"
                >
                  <Edit size={16} />
                  Editar
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={handleEditToggle}
                    className="flex items-center gap-2"
                  >
                    <X size={16} />
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    className="flex items-center gap-2"
                  >
                    <Save size={16} />
                    Guardar
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {isEditing ? (
                <>
                  <Input
                    label="Nombre completo"
                    name="name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    error={errors.name}
                    required
                  />
                  <Input
                    label="Correo electrónico"
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    error={errors.email}
                    required
                  />
                  <Input
                    label="Teléfono"
                    type="tel"
                    name="phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    placeholder="+52 123 456 7890"
                  />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User size={20} className="text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-600">Nombre</p>
                      <p className="font-medium text-gray-900">{user?.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail size={20} className="text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-600">Correo electrónico</p>
                      <p className="font-medium text-gray-900">{user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone size={20} className="text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-600">Teléfono</p>
                      <p className="font-medium text-gray-900">
                        {user?.phone || 'No especificado'}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Seguridad */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Seguridad</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Gestiona tu contraseña y configuración de seguridad
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Key size={20} className="text-gray-600" />
                <div className="flex-1">
                  <p className="text-xs text-gray-600">Contraseña</p>
                  <p className="font-medium text-gray-900">••••••••</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordModal(true)}
                >
                  Cambiar
                </Button>
              </div>
            </div>
          </Card>

          {/* Mis títulos */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Mis Títulos
            </h2>
            <div className="flex flex-wrap gap-3">
              {userTitles.map((title) => (
                <div
                  key={title}
                  className={`${getSerieColor(title)} px-6 py-3 rounded-lg font-semibold text-lg flex items-center gap-2`}
                >
                  <Home size={20} />
                  {title}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Total de títulos: {userTitles.length}
            </p>
          </Card>
        </div>

        {/* Columna derecha - Estadísticas */}
        <div className="space-y-6">
          {/* Estado de cuenta */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Estado de Cuenta
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Estado</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Activa
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Tipo</span>
                <span className="text-sm font-medium text-gray-900">
                  {user?.isAdmin ? 'Administrador' : 'Usuario'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Miembro desde</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(accountInfo.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long'
                  })}
                </span>
              </div>
            </div>
          </Card>

          {/* Estadísticas */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Estadísticas
            </h2>
            <div className="space-y-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-gray-900">
                  {accountInfo.totalWeeks}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Semanas este año
                </p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-gray-900">
                  {accountInfo.exchangesCompleted}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Intercambios realizados
                </p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar size={16} className="text-gray-600" />
                  <p className="text-xs text-gray-600">Último acceso</p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(accountInfo.lastLogin).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </Card>

          {/* Ayuda */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              ¿Necesitas ayuda?
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Si tienes problemas con tu cuenta o necesitas asistencia, contacta al administrador.
            </p>
            <Button variant="outline" fullWidth>
              Contactar soporte
            </Button>
          </Card>
        </div>
      </div>

      {/* Modal: Cambiar contraseña */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setErrors({});
        }}
        title="Cambiar contraseña"
      >
        <div className="space-y-4">
          <Input
            label="Contraseña actual"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
            error={errors.currentPassword}
            required
          />
          
          <Input
            label="Nueva contraseña"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
            error={errors.newPassword}
            required
          />
          
          <Input
            label="Confirmar nueva contraseña"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
            error={errors.confirmPassword}
            required
          />

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Asegúrate de recordar tu nueva contraseña. Se cerrará tu sesión después del cambio.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setErrors({});
              }}
              fullWidth
            >
              Cancelar
            </Button>
            <Button
              onClick={handleChangePassword}
              fullWidth
            >
              Cambiar contraseña
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}