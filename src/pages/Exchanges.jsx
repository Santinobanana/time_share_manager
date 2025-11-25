import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import { 
  ArrowLeftRight, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Send,
  Calendar,
  User,
  RefreshCw,
  MessageSquare,
  AlertCircle,
  Shield
} from 'lucide-react';
import {
  getUserExchanges,
  getPendingExchanges,
  createExchange,
  acceptExchange,
  rejectExchange,
  cancelExchange,
  getExchangeStats,
  checkDuplicateExchange,
  getAllExchangesForAdmin, // NUEVA FUNCIÓN
  getGlobalExchangeStats // NUEVA FUNCIÓN
} from '../services/exchangeService';
import { getUserWeeksForYear } from '../services/titleService';
import { getAllUsers } from '../services/userService';

export default function Exchanges() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sentExchanges, setSentExchanges] = useState([]);
  const [receivedExchanges, setReceivedExchanges] = useState([]);
  const [allExchanges, setAllExchanges] = useState([]); // NUEVO: Para vista de admin
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('received'); // received, sent, history, admin-all
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Estados para crear intercambio
  const [myWeeks, setMyWeeks] = useState([]);
  const [otherUsers, setOtherUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedUserWeeks, setSelectedUserWeeks] = useState([]);
  const [createForm, setCreateForm] = useState({
    myWeek: '',
    targetWeek: '',
    message: ''
  });

  const currentYear = 2027;

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Si es administrador, cargar TODO
      if (user.isAdmin) {
        const [adminExchanges, globalStats, usersData] = await Promise.all([
          getAllExchangesForAdmin(),
          getGlobalExchangeStats(),
          getAllUsers()
        ]);
        
        setAllExchanges(adminExchanges.all || []);
        setStats(globalStats);
        
        // También cargar intercambios propios del admin
        const userExchanges = await getUserExchanges(user.uid);
        setSentExchanges(userExchanges.sent || []);
        setReceivedExchanges(userExchanges.received || []);
        
        const activeUsers = usersData.filter(u => 
          u.isApproved && 
          u.isActive && 
          u.titles && 
          u.titles.length > 0 &&
          u.uid !== user.uid
        );
        setOtherUsers(activeUsers);
        
        // Establecer tab por defecto para admin
        setActiveTab('admin-all');
      } else {
        // Usuario normal
        const [exchangesData, statsData, usersData] = await Promise.all([
          getUserExchanges(user.uid),
          getExchangeStats(user.uid),
          getAllUsers()
        ]);
        
        setSentExchanges(exchangesData.sent || []);
        setReceivedExchanges(exchangesData.received || []);
        setStats(statsData);
        
        const activeUsers = usersData.filter(u => 
          u.isApproved && 
          u.isActive && 
          u.titles && 
          u.titles.length > 0 &&
          u.uid !== user.uid
        );
        setOtherUsers(activeUsers);
      }
      
      // Cargar semanas del usuario actual (para crear intercambios)
      try {
        const weeksData = await getUserWeeksForYear(user.uid, currentYear);
        const weeksArray = weeksData.all || [];
        setMyWeeks(weeksArray);
      } catch (weeksError) {
        console.error('Error cargando semanas del usuario:', weeksError);
        setMyWeeks([]);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError(error.message || 'Error al cargar los datos de intercambios');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = async (userId) => {
    setSelectedUser(userId);
    setCreateForm({ ...createForm, targetWeek: '' });
    
    if (!userId) {
      setSelectedUserWeeks([]);
      return;
    }

    try {
      const weeksData = await getUserWeeksForYear(userId, currentYear);
      const weeksArray = weeksData.all || [];
      setSelectedUserWeeks(weeksArray);
    } catch (error) {
      console.error('Error cargando semanas del usuario:', error);
      setSelectedUserWeeks([]);
    }
  };

  const handleCreateExchange = async () => {
    if (!createForm.myWeek || !createForm.targetWeek) {
      alert('Debes seleccionar ambas semanas');
      return;
    }

    if (!selectedUser) {
      alert('Debes seleccionar un usuario');
      return;
    }

    try {
      setSubmitting(true);

      const myWeekData = myWeeks.find(w => `${w.titleId}-${w.weekNumber}` === createForm.myWeek);
      const targetWeekData = selectedUserWeeks.find(w => `${w.titleId}-${w.weekNumber}` === createForm.targetWeek);

      if (!myWeekData || !targetWeekData) {
        alert('Error: No se encontraron los datos de las semanas');
        return;
      }

      const isDuplicate = await checkDuplicateExchange(
        user.uid,
        selectedUser,
        { titleId: myWeekData.titleId, weekNumber: myWeekData.weekNumber },
        { titleId: targetWeekData.titleId, weekNumber: targetWeekData.weekNumber }
      );

      if (isDuplicate) {
        alert('Ya existe una solicitud pendiente para este intercambio');
        return;
      }

      await createExchange({
        fromUserId: user.uid,
        toUserId: selectedUser,
        fromWeek: {
          titleId: myWeekData.titleId,
          weekNumber: myWeekData.weekNumber
        },
        toWeek: {
          titleId: targetWeekData.titleId,
          weekNumber: targetWeekData.weekNumber
        },
        message: createForm.message,
        year: currentYear
      });

      alert('Solicitud de intercambio enviada exitosamente');
      setShowCreateModal(false);
      setCreateForm({ myWeek: '', targetWeek: '', message: '' });
      setSelectedUser('');
      setSelectedUserWeeks([]);
      await loadData();
    } catch (error) {
      console.error('Error creando intercambio:', error);
      alert('Error al crear intercambio: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (exchangeId) => {
    try {
      setSubmitting(true);
      await acceptExchange(exchangeId);
      alert('Intercambio aceptado exitosamente');
      setShowDetailsModal(false);
      await loadData();
    } catch (error) {
      console.error('Error aceptando intercambio:', error);
      alert('Error al aceptar intercambio: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (exchangeId) => {
    if (!confirm('¿Estás seguro de rechazar esta solicitud?')) {
      return;
    }

    try {
      setSubmitting(true);
      await rejectExchange(exchangeId);
      alert('Intercambio rechazado');
      setShowDetailsModal(false);
      await loadData();
    } catch (error) {
      console.error('Error rechazando intercambio:', error);
      alert('Error al rechazar intercambio: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (exchangeId) => {
    if (!confirm('¿Estás seguro de cancelar este intercambio?')) {
      return;
    }

    try {
      setSubmitting(true);
      await cancelExchange(exchangeId, user.uid);
      alert('Intercambio cancelado');
      setShowDetailsModal(false);
      await loadData();
    } catch (error) {
      console.error('Error cancelando intercambio:', error);
      alert('Error al cancelar intercambio: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getSerieColor = (titleId) => {
    const serie = titleId?.charAt(0);
    return {
      'A': 'bg-serie-a',
      'B': 'bg-serie-b',
      'C': 'bg-serie-c',
      'D': 'bg-serie-d'
    }[serie] || 'bg-gray-100';
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    const icons = {
      pending: <Clock size={16} />,
      accepted: <CheckCircle size={16} />,
      rejected: <XCircle size={16} />,
      cancelled: <XCircle size={16} />
    };

    const labels = {
      pending: 'Pendiente',
      accepted: 'Aceptado',
      rejected: 'Rechazado',
      cancelled: 'Cancelado'
    };

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
        {icons[status]}
        {labels[status]}
      </span>
    );
  };

  // Determinar qué intercambios mostrar según el tab activo
  const displayExchanges = user.isAdmin && activeTab === 'admin-all' 
    ? allExchanges 
    : activeTab === 'sent' 
    ? sentExchanges 
    : activeTab === 'received' 
    ? receivedExchanges
    : [...sentExchanges, ...receivedExchanges].filter(e => 
        e.status === 'accepted' || e.status === 'rejected' || e.status === 'cancelled'
      );

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
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Intercambios
            {user.isAdmin && <Shield className="inline-block ml-2 text-purple-600" size={28} />}
          </h1>
          <p className="text-gray-600 mt-1">
            {user.isAdmin ? 'Vista de administrador - Todos los intercambios del sistema' : 'Gestiona tus solicitudes de intercambio'}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Send size={20} className="mr-2" />
          Nueva Solicitud
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <div className="text-3xl font-bold text-gray-900">{stats.pending}</div>
            <div className="text-sm text-gray-600 mt-1">Pendientes</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.accepted}</div>
            <div className="text-sm text-gray-600 mt-1">Aceptados</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600 mt-1">Rechazados</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-gray-600">{stats.total}</div>
            <div className="text-sm text-gray-600 mt-1">Total</div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {/* Tab exclusivo para administradores */}
        {user.isAdmin && (
          <Button
            variant={activeTab === 'admin-all' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('admin-all')}
          >
            <Shield size={18} className="mr-1" />
            Todos ({allExchanges.length})
          </Button>
        )}
        
        <Button
          variant={activeTab === 'received' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('received')}
        >
          Recibidas ({receivedExchanges.filter(e => e.status === 'pending').length})
        </Button>
        <Button
          variant={activeTab === 'sent' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('sent')}
        >
          Enviadas ({sentExchanges.length})
        </Button>
        <Button
          variant={activeTab === 'history' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('history')}
        >
          Historial
        </Button>
      </div>

      {/* Lista de intercambios */}
      <Card>
        {displayExchanges.length === 0 ? (
          <div className="text-center py-12">
            <ArrowLeftRight size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay intercambios
            </h3>
            <p className="text-gray-600">
              {activeTab === 'received' && 'No tienes solicitudes recibidas'}
              {activeTab === 'sent' && 'No has enviado solicitudes'}
              {activeTab === 'history' && 'No tienes historial de intercambios'}
              {activeTab === 'admin-all' && 'No hay intercambios en el sistema'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayExchanges.map((exchange) => (
              <div
                key={exchange.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedExchange(exchange);
                  setShowDetailsModal(true);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(exchange.status)}
                      <span className="text-sm text-gray-500">
                        {new Date(exchange.createdAt?.seconds * 1000).toLocaleDateString()}
                      </span>
                    </div>

                    {/* MOSTRAR USUARIOS EN VISTA DE ADMIN */}
                    {user.isAdmin && activeTab === 'admin-all' && (
                      <div className="flex items-center gap-4 mb-3 text-sm">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          <span className="font-medium text-gray-700">
                            {exchange.fromUser?.name || 'Usuario desconocido'}
                          </span>
                        </div>
                        <ArrowLeftRight size={16} className="text-gray-400" />
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          <span className="font-medium text-gray-700">
                            {exchange.toUser?.name || 'Usuario desconocido'}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {/* Semana ofrecida */}
                      <div>
                        <div className="text-sm text-gray-600 mb-1">
                          {activeTab === 'received' || (user.isAdmin && activeTab === 'admin-all') ? 'Ofrece' : 'Ofreces'}
                        </div>
                        <div className={`${getSerieColor(exchange.fromWeek.titleId)} px-3 py-2 rounded-lg`}>
                          <div className="font-medium">Semana {exchange.fromWeek.weekNumber}</div>
                          <div className="text-sm">{exchange.fromWeek.titleId}</div>
                        </div>
                      </div>

                      {/* Semana solicitada */}
                      <div>
                        <div className="text-sm text-gray-600 mb-1">
                          {activeTab === 'received' || (user.isAdmin && activeTab === 'admin-all') ? 'Solicita' : 'Solicitas'}
                        </div>
                        <div className={`${getSerieColor(exchange.toWeek.titleId)} px-3 py-2 rounded-lg`}>
                          <div className="font-medium">Semana {exchange.toWeek.weekNumber}</div>
                          <div className="text-sm">{exchange.toWeek.titleId}</div>
                        </div>
                      </div>
                    </div>

                    {exchange.message && (
                      <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                        <MessageSquare size={16} className="mt-0.5 flex-shrink-0" />
                        <p className="line-clamp-2">{exchange.message}</p>
                      </div>
                    )}
                  </div>

                  {/* Acciones rápidas solo si es intercambio propio y pendiente */}
                  {!user.isAdmin && activeTab === 'received' && exchange.status === 'pending' && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAccept(exchange.id);
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Aceptar"
                      >
                        <CheckCircle size={20} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(exchange.id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Rechazar"
                      >
                        <XCircle size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal de creación - sin cambios */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateForm({ myWeek: '', targetWeek: '', message: '' });
          setSelectedUser('');
          setSelectedUserWeeks([]);
        }}
        title="Nueva Solicitud de Intercambio"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona el usuario
            </label>
            <select
              value={selectedUser}
              onChange={(e) => handleUserSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
            >
              <option value="">-- Selecciona un usuario --</option>
              {otherUsers.map(u => (
                <option key={u.uid} value={u.uid}>{u.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tu semana a intercambiar
            </label>
            <select
              value={createForm.myWeek}
              onChange={(e) => setCreateForm({ ...createForm, myWeek: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
            >
              <option value="">-- Selecciona tu semana --</option>
              {myWeeks.map(week => (
                <option key={`${week.titleId}-${week.weekNumber}`} value={`${week.titleId}-${week.weekNumber}`}>
                  {week.titleId} - Semana {week.weekNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semana que solicitas
            </label>
            <select
              value={createForm.targetWeek}
              onChange={(e) => setCreateForm({ ...createForm, targetWeek: e.target.value })}
              disabled={!selectedUser}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none disabled:bg-gray-100"
            >
              <option value="">-- Selecciona la semana --</option>
              {selectedUserWeeks.map(week => (
                <option key={`${week.titleId}-${week.weekNumber}`} value={`${week.titleId}-${week.weekNumber}`}>
                  {week.titleId} - Semana {week.weekNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje (opcional)
            </label>
            <textarea
              value={createForm.message}
              onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none resize-none"
              placeholder="Añade un mensaje para el otro usuario..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleCreateExchange}
              disabled={submitting || !createForm.myWeek || !createForm.targetWeek}
              className="flex-1"
            >
              {submitting ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                setCreateForm({ myWeek: '', targetWeek: '', message: '' });
                setSelectedUser('');
                setSelectedUserWeeks([]);
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de detalles - agregar botones de admin si es necesario */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedExchange(null);
        }}
        title="Detalles del Intercambio"
      >
        {selectedExchange && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              {getStatusBadge(selectedExchange.status)}
              <span className="text-sm text-gray-500">
                {new Date(selectedExchange.createdAt?.seconds * 1000).toLocaleString()}
              </span>
            </div>

            {/* Información de usuarios (solo en vista admin) */}
            {user.isAdmin && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                  <Shield size={16} />
                  Información de Usuarios
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">De: </span>
                    <span className="font-medium">{selectedExchange.fromUser?.name}</span>
                    <span className="text-gray-500 ml-2">({selectedExchange.fromUser?.email})</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Para: </span>
                    <span className="font-medium">{selectedExchange.toUser?.name}</span>
                    <span className="text-gray-500 ml-2">({selectedExchange.toUser?.email})</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-2">Ofrece</div>
                <div className={`${getSerieColor(selectedExchange.fromWeek.titleId)} px-4 py-3 rounded-lg`}>
                  <div className="font-bold text-lg">Semana {selectedExchange.fromWeek.weekNumber}</div>
                  <div>{selectedExchange.fromWeek.titleId}</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-2">Solicita</div>
                <div className={`${getSerieColor(selectedExchange.toWeek.titleId)} px-4 py-3 rounded-lg`}>
                  <div className="font-bold text-lg">Semana {selectedExchange.toWeek.weekNumber}</div>
                  <div>{selectedExchange.toWeek.titleId}</div>
                </div>
              </div>
            </div>

            {selectedExchange.message && (
              <div>
                <div className="text-sm font-medium text-gray-600 mb-2">Mensaje</div>
                <div className="bg-gray-50 rounded-lg p-3 text-gray-700">
                  {selectedExchange.message}
                </div>
              </div>
            )}

            {/* Botones de acción */}
            {!user.isAdmin && activeTab === 'received' && selectedExchange.status === 'pending' && (
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => handleAccept(selectedExchange.id)}
                  disabled={submitting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle size={20} className="mr-2" />
                  Aceptar
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleReject(selectedExchange.id)}
                  disabled={submitting}
                  className="flex-1"
                >
                  <XCircle size={20} className="mr-2" />
                  Rechazar
                </Button>
              </div>
            )}

            {!user.isAdmin && activeTab === 'sent' && selectedExchange.status === 'pending' && (
              <div className="pt-4">
                <Button
                  variant="secondary"
                  onClick={() => handleCancel(selectedExchange.id)}
                  disabled={submitting}
                  className="w-full"
                >
                  Cancelar Solicitud
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}