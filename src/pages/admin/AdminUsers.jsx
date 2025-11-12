import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { 
  getAllUsers,
  approveUser,
  rejectUser,
  toggleUserStatus,
  updateUser,
  assignTitlesToUser,
  removeTitlesFromUser,
  getUserStats
} from '../../services/userService';
import { getAvailableTitles } from '../../services/titleService';
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
  Phone,
  RefreshCw
} from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [availableTitles, setAvailableTitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    titles: []
  });
  const [submitting, setSubmitting] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, statsData, titlesData] = await Promise.all([
        getAllUsers(),
        getUserStats(),
        getAvailableTitles()
      ]);
      
      setUsers(usersData);
      setStats(statsData);
      setAvailableTitles(titlesData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar los datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    // Filtrar por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesName = user.name.toLowerCase().includes(search);
      const matchesEmail = user.email.toLowerCase().includes(search);
      const matchesTitles = user.titles?.some(t => t.toLowerCase().includes(search));
      if (!matchesName && !matchesEmail && !matchesTitles) return false;
    }

    // Filtrar por estado
    if (filterStatus === 'pending' && user.isApproved) return false;
    if (filterStatus === 'approved' && (!user.isApproved || !user.isActive)) return false;
    if (filterStatus === 'inactive' && user.isActive) return false;

    return true;
  });

  const getSerieColor = (title) => {
    const serie = title?.charAt(0);
    return {
      'A': 'bg-serie-a',
      'B': 'bg-serie-b',
      'C': 'bg-serie-c',
      'D': 'bg-serie-d'
    }[serie] || 'bg-gray-200';
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
      titles: [...(user.titles || [])]
    });
    setShowEditModal(true);
  };

  const handleApproveUser = async (userId) => {
    try {
      setSubmitting(true);
      await approveUser(userId);
      alert('Usuario aprobado exitosamente');
      setShowDetailsModal(false);
      await loadData();
    } catch (error) {
      console.error('Error aprobando usuario:', error);
      alert('Error al aprobar usuario: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectUser = async (userId) => {
    if (!confirm('¿Estás seguro de rechazar este usuario? Esta acción eliminará su cuenta.')) {
      return;
    }

    try {
      setSubmitting(true);
      await rejectUser(userId);
      alert('Usuario rechazado y eliminado');
      setShowDetailsModal(false);
      await loadData();
    } catch (error) {
      console.error('Error rechazando usuario:', error);
      alert('Error al rechazar usuario: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    const action = currentStatus ? 'desactivar' : 'activar';
    if (!confirm(`¿Estás seguro de ${action} este usuario?`)) {
      return;
    }

    try {
      setSubmitting(true);
      await toggleUserStatus(userId, !currentStatus);
      alert(`Usuario ${action}do exitosamente`);
      await loadData();
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error al cambiar estado: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setSubmitting(true);
      
      // Actualizar información básica
      await updateUser(selectedUser.uid, {
        name: editForm.name,
        phone: editForm.phone
      });

      // Actualizar títulos si cambiaron
      const currentTitles = selectedUser.titles || [];
      const newTitles = editForm.titles;

      // Títulos a agregar
      const titlesToAdd = newTitles.filter(t => !currentTitles.includes(t));
      // Títulos a remover
      const titlesToRemove = currentTitles.filter(t => !newTitles.includes(t));

      if (titlesToAdd.length > 0 || titlesToRemove.length > 0) {
        await assignTitlesToUser(selectedUser.uid, newTitles);
      }

      alert('Usuario actualizado exitosamente');
      setShowEditModal(false);
      await loadData();
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      alert('Error al actualizar usuario: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTitle = (titleId) => {
    if (!editForm.titles.includes(titleId)) {
      setEditForm(prev => ({
        ...prev,
        titles: [...prev.titles, titleId]
      }));
    }
  };

  const handleRemoveTitle = (titleId) => {
    setEditForm(prev => ({
      ...prev,
      titles: prev.titles.filter(t => t !== titleId)
    }));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin text-gray-400" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">
            Administra usuarios, aprobaciones y asignación de títulos
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadData}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Actualizar
        </Button>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-gray-600 mt-1">Total de usuarios</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-gray-600 mt-1">Pendientes</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
              <p className="text-gray-600 mt-1">Aprobados</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-600">{stats.inactive}</p>
              <p className="text-gray-600 mt-1">Inactivos</p>
            </div>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, email o título"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes de aprobación</option>
              <option value="approved">Aprobados y activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de usuarios */}
      <Card title="Usuarios" subtitle={`Mostrando ${filteredUsers.length} de ${users.length} usuarios`}>
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.uid}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {user.name}
                      </h3>
                      {getStatusBadge(user)}
                      {user.isAdmin && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Admin
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Mail size={14} />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={14} />
                          {user.phone}
                        </div>
                      )}
                    </div>

                    {/* Títulos */}
                    {user.titles && user.titles.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Home size={14} className="text-gray-400" />
                        {user.titles.map((title) => (
                          <span
                            key={title}
                            className={`${getSerieColor(title)} px-3 py-1 rounded-full text-sm font-medium`}
                          >
                            {title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(user)}
                    >
                      Ver detalles
                    </Button>
                    {!user.isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal de detalles */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Detalles del usuario"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedUser.name}
              </h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2 font-medium">{selectedUser.email}</span>
                </div>
                {selectedUser.phone && (
                  <div>
                    <span className="text-gray-600">Teléfono:</span>
                    <span className="ml-2 font-medium">{selectedUser.phone}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Estado:</span>
                  <span className="ml-2">{getStatusBadge(selectedUser)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Títulos:</span>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {selectedUser.titles && selectedUser.titles.length > 0 ? (
                      selectedUser.titles.map(title => (
                        <span
                          key={title}
                          className={`${getSerieColor(title)} px-3 py-1 rounded-full text-sm font-medium`}
                        >
                          {title}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">Sin títulos asignados</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-2 pt-4 border-t">
              {!selectedUser.isApproved ? (
                <>
                  <Button
                    onClick={() => handleApproveUser(selectedUser.uid)}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Aprobar usuario
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleRejectUser(selectedUser.uid)}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} />
                    Rechazar
                  </Button>
                </>
              ) : (
                !selectedUser.isAdmin && (
                  <Button
                    variant={selectedUser.isActive ? 'secondary' : 'primary'}
                    onClick={() => handleToggleActive(selectedUser.uid, selectedUser.isActive)}
                    disabled={submitting}
                    className="flex-1"
                  >
                    {selectedUser.isActive ? 'Desactivar' : 'Activar'} usuario
                  </Button>
                )
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de edición */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar usuario"
      >
        {selectedUser && (
          <div className="space-y-4">
            <Input
              label="Nombre"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />

            <Input
              label="Email"
              value={editForm.email}
              disabled
              className="bg-gray-100"
            />

            <Input
              label="Teléfono"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />

            {/* Títulos asignados */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Títulos asignados
              </label>
              <div className="flex gap-2 flex-wrap mb-3">
                {editForm.titles.length > 0 ? (
                  editForm.titles.map(title => (
                    <span
                      key={title}
                      className={`${getSerieColor(title)} px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2`}
                    >
                      {title}
                      <button
                        onClick={() => handleRemoveTitle(title)}
                        className="hover:text-red-600"
                      >
                        <XCircle size={14} />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">Sin títulos asignados</span>
                )}
              </div>
            </div>

            {/* Títulos disponibles */}
            {availableTitles.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agregar títulos disponibles
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  <div className="grid grid-cols-4 gap-2">
                    {availableTitles.map(title => (
                      <button
                        key={title.id}
                        onClick={() => handleAddTitle(title.id)}
                        disabled={editForm.titles.includes(title.id)}
                        className={`${getSerieColor(title.serie)} px-2 py-1 rounded text-sm font-medium hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {title.id}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowEditModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={submitting}
                className="flex-1"
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