import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import PDFDownloadButton from '../components/common/PDFDownloadButton';
import TitleCalendarModal from '../components/common/Titlecalendarmodal';
import { getTitleById } from '../services/titleService';
import { User, Mail, Phone, Key, Calendar, Home, Edit, Save, X, FileDown } from 'lucide-react';
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
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedTitleForCalendar, setSelectedTitleForCalendar] = useState(null);

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

  const handleViewFullCalendar = async (titleId) => {
  try {
    // Obtener datos completos del título desde Firestore
    const titleData = await getTitleById(titleId);
    setSelectedTitleForCalendar(titleData);
    setShowCalendarModal(true);
  } catch (error) {
    console.error('Error cargando título completo:', error);
    alert('Error al cargar el calendario del título');
  }
};

  // ✅ FIX: Validación robusta de getSerieColor
  const getSerieColor = (title) => {
    // Manejar diferentes tipos de entrada
    let serieChar = null;
    
    if (typeof title === 'string') {
      // Si es string (ej: "C-1-1")
      serieChar = title.charAt(0);
    } else if (title && typeof title === 'object') {
      // Si es objeto, buscar en diferentes campos posibles
      serieChar = title.serie || 
                  (title.id ? title.id.charAt(0) : null) ||
                  (title.titleId ? title.titleId.charAt(0) : null);
    }
    
    // Si no se pudo determinar, usar default
    if (!serieChar) {
      console.warn('No se pudo determinar serie de:', title);
      return 'bg-gray-200';
    }
    
    return {
      'A': 'bg-serie-a',
      'B': 'bg-serie-b',
      'C': 'bg-serie-c',
      'D': 'bg-serie-d'
    }[serieChar] || 'bg-gray-200';
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditForm({
        name: user?.name || '',
        phone: user?.phone || ''
      });
      setErrors({});
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
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
      window.location.reload();
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      alert('Error al actualizar perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
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
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setErrors({});
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      
      if (error.code === 'auth/requires-recent-login') {
        alert('Por seguridad, necesitas volver a iniciar sesión antes de cambiar tu contraseña');
      } else {
        alert('Error al cambiar contraseña: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-1">Gestiona tu información personal y títulos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Personal */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Información Personal</h2>
              {!isEditing ? (
                <Button variant="secondary" size="sm" onClick={handleEditToggle}>
                  <Edit size={16} className="mr-2" />
                  Editar
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleEditToggle}>
                    <X size={16} className="mr-2" />
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSaveProfile} disabled={loading}>
                    <Save size={16} className="mr-2" />
                    Guardar
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <User size={16} className="mr-2" />
                  Nombre completo
                </label>
                {isEditing ? (
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    error={errors.name}
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{user?.name}</p>
                )}
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Mail size={16} className="mr-2" />
                  Correo electrónico
                </label>
                <p className="text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500 mt-1">El correo no se puede cambiar</p>
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Phone size={16} className="mr-2" />
                  Teléfono
                </label>
                {isEditing ? (
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="(opcional)"
                  />
                ) : (
                  <p className="text-gray-900">{user?.phone || 'No proporcionado'}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Seguridad */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Seguridad</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Contraseña</p>
                <p className="text-sm text-gray-600">••••••••</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setShowPasswordModal(true)}>
                <Key size={16} className="mr-2" />
                Cambiar contraseña
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar - Títulos */}
        <div className="space-y-6">
        <Card>
          <h3 className="font-semibold text-gray-900 mb-3">Mis títulos</h3>
          {userTitles.length === 0 ? (
            <div className="text-center py-8">
              <Home size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">
                Aún no tienes títulos asignados
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {userTitles.map((title) => {
                if (!title) {
                  return null;
                }

                return (
                  <div
                    key={title.id}
                    className={`${getSerieColor(title)} rounded-lg p-3`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Home size={18} />
                        <span className="font-bold">{title.id}</span>
                      </div>
                      
                      
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          )}
        </Card>

          {/* Botón descargar calendario */}
          {userTitles.length > 0 && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">Calendario</h3>
              <p className="text-sm text-gray-600 mb-4">
                Descarga el calendario de todos tus títulos con información de los próximos 74 años (2027-2100)
              </p>
              <PDFDownloadButton
                data={userTitles}
                userName={user?.name}
                variant="primary"
                size="md"
                className="w-full"
                label={
                  <span className="flex items-center justify-center">
                    <FileDown size={18} className="mr-2" />
                    Descargar mi calendario
                  </span>
                }
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                PDF con {userTitles.length} título{userTitles.length > 1 ? 's' : ''}
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Modal cambiar contraseña */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          setErrors({});
        }}
        title="Cambiar contraseña"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña actual
            </label>
            <Input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              error={errors.currentPassword}
              placeholder="Ingresa tu contraseña actual"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nueva contraseña
            </label>
            <Input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              error={errors.newPassword}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar nueva contraseña
            </label>
            <Input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              error={errors.confirmPassword}
              placeholder="Repite la nueva contraseña"
            />
          </div>

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
      {/* Modal de calendario completo */}
    <TitleCalendarModal
      isOpen={showCalendarModal}
      onClose={() => setShowCalendarModal(false)}
      title={selectedTitleForCalendar}
      userName={user?.name}
    />
    </div>
  );
}