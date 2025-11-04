import { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Trash2,
  UserCheck,
  UserX,
  Clock,
  Home,
  Mail,
  Phone
} from 'lucide-react';

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, approved, pending, inactive
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    titles: [],
    isApproved: false,
    isActive: false
  });

  // Datos simulados - En Fase 2 vendrán de Firebase
  const allUsers = [
    {
      id: '1',
      name: 'Alberto Retano',
      email: 'alberto@example.com',
      phone: '+52 123 456 7890',
      titles: ['A-1-1', 'A-1-2'],
      isApproved: true,
      isActive: true,
      createdAt: '2026-01-15',
      lastLogin: '2027-01-10'
    },
    {
      id: '2',
      name: 'Mónica Martínez',
      email: 'monica@example.com',
      phone: '+52 234 567 8901',
      titles: ['A-2-1'],
      isApproved: true,
      isActive: true,
      createdAt: '2026-02-20',
      lastLogin: '2027-01-09'
    },
    {
      id: '3',
      name: 'Luis Miguel Sánchez',
      email: 'luis@example.com',
      phone: '+52 345 678 9012',
      titles: ['A-3-1', 'B-1-1'],
      isApproved: true,
      isActive: true,
      createdAt: '2026-03-10',
      lastLogin: '2027-01-08'
    },
    {
      id: '4',
      name: 'Carmen López',
      email: 'carmen@example.com',
      phone: '',
      titles: ['B-2-3'],
      isApproved: false,
      isActive: false,
      createdAt: '2027-01-05',
      lastLogin: null
    },
    {
      id: '5',
      name: 'Roberto García',
      email: 'roberto@example.com',
      phone: '+52 456 789 0123',
      titles: ['C-1-1', 'C-2-2'],
      isApproved: false,
      isActive: false,
      createdAt: '2027-01-07',
      lastLogin: null
    },
    {
      id: '6',
      name: 'Patricia Hernández',
      email: 'patricia@example.com',
      phone: '+52 567 890 1234',
      titles: ['D-1-1'],
      isApproved: true,
      isActive: false,
      createdAt: '2026-06-15',
      lastLogin: '2026-12-20'
    },
  ];

  const availableTitles = [
    'A-1-1', 'A-1-2', 'A-1-3', 'A-1-4',
    'A-2-1', 'A-2-2', 'A-2-3', 'A-2-4',
    'A-3-1', 'A-3-2', 'A-3-3', 'A-3-4',
    'B-1-1', 'B-1-2', 'B-1-3', 'B-1-4',
    'B-2-1', 'B-2-2', 'B-2-3', 'B-2-4',
    'C-1-1', 'C-1-2', 'C-1-3', 'C-1-4',
    'C-2-1', 'C-2-2', 'C-2-3', 'C-2-4',
    'D-1-1', 'D-1-2', 'D-1-3', 'D-1-4',
  ];

  // Filtrar usuarios
  const filteredUsers = allUsers.filter(user => {
    // Filtrar por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesName = user.name.toLowerCase().includes(search);
      const matchesEmail = user.email.toLowerCase().includes(search);
      const matchesTitles = user.titles.some(t => t.toLowerCase().includes(search));
      if (!matchesName && !matchesEmail && !matchesTitles) return false;
    }

    // Filtrar por estado
    if (filterStatus === 'approved') {
      return user.isApproved && user.isActive;
    } else if (filterStatus === 'pending') {
      return !user.isApproved;
    } else if (filterStatus === 'inactive') {
      return !user.isActive;
    }

    return true;
  });

  const pendingUsers = allUsers.filter(u => !u.isApproved).length;
  const approvedUsers = allUsers.filter(u => u.isApproved && u.isActive).length;
  const inactiveUsers = allUsers.filter(u => !u.isActive).length;

  const getSerieColor = (title) => {
    const serie = title.charAt(0);
    return {
      'A': 'bg-serie-a',
      'B': 'bg-serie-b',
      'C': 'bg-serie-c',
      'D': 'bg-serie-d'
    }[serie];
  };

  const getStatusBadge = (user) => {
    if (!user.isApproved) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <Clock size={12} />
          Pendiente
        </span>
      );
    }
    if (!user.isActive) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 flex items-center gap-1">
          <UserX size={12} />
          Inactivo
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
        <UserCheck size={12} />
        Activo
      </span>
    );
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      titles: [...user.titles],
      isApproved: user.isApproved,
      isActive: user.isActive
    });
    setShowEditModal(true);
  };

  const handleApproveUser = (userId) => {
    // Simulación - En Fase 2 actualizará Firebase
    console.log('Aprobar usuario:', userId);
    alert('Usuario aprobado exitosamente');
    setShowDetailsModal(false);
  };

  const handleRejectUser = (userId) => {
    // Simulación - En Fase 2 actualizará Firebase
    if (confirm('¿Estás seguro de rechazar este usuario? Esta acción no se puede deshacer.')) {
      console.log('Rechazar usuario:', userId);
      alert('Usuario rechazado');
      setShowDetailsModal(false);
    }
  };

  const handleToggleActive = (userId, currentStatus) => {
    // Simulación - En Fase 2 actualizará Firebase
    const action = currentStatus ? 'desactivar' : 'activar';
    if (confirm(`¿Estás seguro de ${action} este usuario?`)) {
      console.log(`${action} usuario:`, userId);
      alert(`Usuario ${action}do exitosamente`);
    }
  };

  const handleSaveEdit = () => {
    // Simulación - En Fase 2 actualizará Firebase
    console.log('Actualizar usuario:', editForm);
    alert('Usuario actualizado exitosamente');
    setShowEditModal(false);
  };

  const handleDeleteUser = (userId) => {
    // Simulación - En Fase 2 eliminará de Firebase
    if (confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer y eliminará todos sus datos.')) {
      console.log('Eliminar usuario:', userId);
      alert('Usuario eliminado');
      setShowDetailsModal(false);
    }
  };

  const handleTitleToggle = (title) => {
    setEditForm({
      ...editForm,
      titles: editForm.titles.includes(title)
        ? editForm.titles.filter(t => t !== title)
        : [...editForm.titles, title]
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <p className="text-gray-600 mt-1">
          Administra usuarios, aprueba registros y gestiona títulos
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{allUsers.length}</p>
            <p className="text-gray-600 mt-1">Total usuarios</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{approvedUsers}</p>
            <p className="text-gray-600 mt-1">Aprobados</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600">{pendingUsers}</p>
            <p className="text-gray-600 mt-1">Pendientes</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-600">{inactiveUsers}</p>
            <p className="text-gray-600 mt-1">Inactivos</p>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, email o título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Filtro por estado */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
            >
              <option value="all">Todos los estados</option>
              <option value="approved">Solo aprobados</option>
              <option value="pending">Solo pendientes</option>
              <option value="inactive">Solo inactivos</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de usuarios */}
      <Card title="Usuarios registrados" subtitle={`Mostrando ${filteredUsers.length} usuarios`}>
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'No se encontraron usuarios con los filtros aplicados'
                : 'No hay usuarios registrados'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between mb-3 gap-3">
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 text-lg break-words">
                        {user.name}
                      </h3>
                      {getStatusBadge(user)}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 flex items-center gap-2 break-all">
                        <Mail size={14} className="flex-shrink-0" />
                        {user.email}
                      </p>
                      {user.phone && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Phone size={14} className="flex-shrink-0" />
                          {user.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => handleViewDetails(user)}
                      className="text-sm flex-1 sm:flex-initial"
                    >
                      Ver detalles
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleEditUser(user)}
                      className="text-sm px-3"
                    >
                      <Edit size={16} />
                    </Button>
                  </div>
                </div>

                {/* Títulos */}
                <div className="mb-3">
                  <p className="text-xs text-gray-600 mb-2">Títulos asignados:</p>
                  <div className="flex flex-wrap gap-2">
                    {user.titles.map((title) => (
                      <span
                        key={title}
                        className={`${getSerieColor(title)} px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1`}
                      >
                        <Home size={14} />
                        {title}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Info adicional */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>
                    Registrado: {new Date(user.createdAt).toLocaleDateString('es-ES')}
                  </span>
                  {user.lastLogin && (
                    <span>
                      Último acceso: {new Date(user.lastLogin).toLocaleDateString('es-ES')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal: Detalles del usuario */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Detalles del usuario"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">{selectedUser.name}</h3>
                {getStatusBadge(selectedUser)}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Teléfono</p>
                  <p className="font-medium">{selectedUser.phone || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Fecha de registro</p>
                  <p className="font-medium">
                    {new Date(selectedUser.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Último acceso</p>
                  <p className="font-medium">
                    {selectedUser.lastLogin 
                      ? new Date(selectedUser.lastLogin).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Nunca'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">Títulos asignados:</p>
              <div className="flex flex-wrap gap-2">
                {selectedUser.titles.map((title) => (
                  <span
                    key={title}
                    className={`${getSerieColor(title)} px-4 py-2 rounded-lg font-medium flex items-center gap-2`}
                  >
                    <Home size={16} />
                    {title}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              {!selectedUser.isApproved ? (
                <>
                  <Button
                    variant="danger"
                    onClick={() => handleRejectUser(selectedUser.id)}
                    fullWidth
                    className="flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} />
                    Rechazar
                  </Button>
                  <Button
                    onClick={() => handleApproveUser(selectedUser.id)}
                    fullWidth
                    className="flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Aprobar
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => handleToggleActive(selectedUser.id, selectedUser.isActive)}
                    fullWidth
                  >
                    {selectedUser.isActive ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    fullWidth
                    className="flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18} />
                    Eliminar
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Editar usuario */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar usuario"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-4">
            <Input
              label="Nombre completo"
              value={editForm.name}
              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              required
            />

            <Input
              label="Correo electrónico"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({...editForm, email: e.target.value})}
              required
            />

            <Input
              label="Teléfono"
              type="tel"
              value={editForm.phone}
              onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Títulos asignados
              </label>
              <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                {availableTitles.map((title) => {
                  const serie = title.charAt(0);
                  const colorClass = {
                    'A': 'bg-serie-a hover:bg-green-400',
                    'B': 'bg-serie-b hover:bg-blue-400',
                    'C': 'bg-serie-c hover:bg-yellow-400',
                    'D': 'bg-serie-d hover:bg-purple-400'
                  }[serie];
                  
                  return (
                    <button
                      key={title}
                      type="button"
                      onClick={() => handleTitleToggle(title)}
                      className={`p-3 rounded-lg text-sm font-medium transition-all ${
                        editForm.titles.includes(title)
                          ? `${colorClass} ring-2 ring-gray-700`
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {title}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.isApproved}
                  onChange={(e) => setEditForm({...editForm, isApproved: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Usuario aprobado</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Cuenta activa</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowEditModal(false)}
                fullWidth
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEdit}
                fullWidth
              >
                Guardar cambios
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}