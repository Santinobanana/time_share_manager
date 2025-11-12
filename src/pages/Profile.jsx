import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import { User, Mail, Phone, Key, Calendar, Home, Edit, Save, X } from 'lucide-react';
import { updateUser } from '../services/userService';
import { getTitlesByUser } from '../services/titleService';
import { updatePassword } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function Profile() {
  const { user } = useAuth();
  const [userTitles, setUserTitles] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      loadUserTitles();
    }
  }, [user]);

  const loadUserTitles = async () => {
    try {
      if (!user.titles || user.titles.length === 0) {
        setUserTitles([]);
        return;
      }
      const titles = await getTitlesByUser(user.uid);
      setUserTitles(titles);
    } catch (error) {
      console.error('Error cargando títulos:', error);
    }
  };

  const getSerieColor = (title) => {
    const serie = title?.charAt(0) || title?.serie;
    return {
      'A': 'bg-serie-a',
      'B': 'bg-serie-b',
      'C': 'bg-serie-c',
      'D': 'bg-serie-d'
    }[serie] || 'bg-gray-200';
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancelar edición
      setEditForm({
        name: user?.name || '',
        phone: user?.phone || ''
      });
      setErrors({});
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    // Validaciones
    const newErrors = {};
    
    if (!editForm.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      await updateUser(user.uid, {
        name: editForm.name,
        phone: editForm.phone
      });
      
      alert('Perfil actualizado exitosamente');
      setIsEditing(false);
      setErrors({});
      
      // Recargar la página para actualizar el contexto
      window.location.reload();
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      alert('Error al actualizar perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
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

    try {
      setLoading(true);
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No hay usuario autenticado');
      }

      await updatePassword(currentUser, passwordForm.newPassword);
      
      alert('Contraseña actualizada exitosamente');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setErrors({});
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      
      let errorMessage = 'Error al cambiar la contraseña';
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Por seguridad, debes cerrar sesión y volver a iniciar para cambiar tu contraseña';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
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
                    disabled={loading}
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
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    error={errors.name}
                    icon={User}
                  />

                  <Input
                    label="Teléfono"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="+52 123 456 7890"
                    icon={Phone}
                  />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-600">Nombre</p>
                      <p className="font-medium text-gray-900">{user?.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Seguridad
            </h2>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Key className="text-gray-400" size={20} />
                <div>
                  <p className="font-medium text-gray-900">Contraseña</p>
                  <p className="text-sm text-gray-600">••••••••</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowPasswordModal(true)}
              >
                Cambiar
              </Button>
            </div>
          </Card>
        </div>

        {/* Columna derecha - Títulos y estadísticas */}
        <div className="space-y-6">
          {/* Mis títulos */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Home size={20} />
              Mis Títulos
            </h2>
            {userTitles.length === 0 ? (
              <p className="text-gray-500 text-sm">Sin títulos asignados</p>
            ) : (
              <div className="space-y-2">
                {userTitles.map((title) => (
                  <div
                    key={title.id}
                    className={`${getSerieColor(title.serie)} rounded-lg p-3`}
                  >
                    <p className="font-bold text-gray-900">{title.id}</p>
                    <p className="text-sm text-gray-700">
                      Serie {title.serie} - Subserie {title.subserie}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Estadísticas */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Estadísticas
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Títulos</span>
                <span className="font-bold text-gray-900">{userTitles.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Semanas 2027</span>
                <span className="font-bold text-gray-900">{userTitles.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Intercambios</span>
                <span className="font-bold text-gray-900">0</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal cambio de contraseña */}
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
            type="password"
            label="Contraseña actual"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            error={errors.currentPassword}
          />

          <Input
            type="password"
            label="Nueva contraseña"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            error={errors.newPassword}
          />

          <Input
            type="password"
            label="Confirmar nueva contraseña"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            error={errors.confirmPassword}
          />

          <div className="flex gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowPasswordModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={loading}
              className="flex-1"
            >
              Cambiar contraseña
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}