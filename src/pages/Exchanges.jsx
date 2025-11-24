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
  AlertCircle
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
  cancelAcceptedExchange
} from '../services/exchangeService';
import { getUserWeeksForYear } from '../services/titleService';
import { getAllUsers } from '../services/userService';

export default function Exchanges() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sentExchanges, setSentExchanges] = useState([]);
  const [receivedExchanges, setReceivedExchanges] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('received');
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

  // NUEVO: Estado para almacenar información de usuarios
  const [usersMap, setUsersMap] = useState({});

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
      
      const [exchangesData, statsData, usersData] = await Promise.all([
        getUserExchanges(user.uid),
        getExchangeStats(user.uid),
        getAllUsers()
      ]);
      
      setSentExchanges(exchangesData.sent || []);
      setReceivedExchanges(exchangesData.received || []);
      setStats(statsData);
      
      // NUEVO: Crear mapa de usuarios para acceso rápido
      const usersMapping = {};
      usersData.forEach(u => {
        usersMapping[u.uid] = {
          name: u.name,
          email: u.email
        };
      });
      setUsersMap(usersMapping);
      
      // Cargar semanas del usuario actual
      try {
        const weeksData = await getUserWeeksForYear(user.uid, currentYear);
        const weeksArray = weeksData.all || [];
        setMyWeeks(weeksArray);
      } catch (weeksError) {
        console.error('Error cargando semanas del usuario:', weeksError);
        setMyWeeks([]);
      }
      
      // Filtrar solo usuarios activos con títulos (excluir usuario actual)
      const activeUsers = usersData.filter(u => 
        u.isApproved && 
        u.isActive && 
        u.titles && 
        u.titles.length > 0 &&
        u.uid !== user.uid
      );
      setOtherUsers(activeUsers);
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
    if (!confirm('¿Estás seguro de cancelar este intercambio? Esta acción lo revertirá y ambos usuarios recuperarán sus semanas originales.')) {
      return;
    }

    try {
      setSubmitting(true);
      await cancelExchange(exchangeId, user.uid);
      alert('Intercambio cancelado y revertido exitosamente');
      await loadData();
    } catch (error) {
      console.error('Error cancelando intercambio:', error);
      alert('Error al cancelar intercambio: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlecancelAcceptedExchange = async (exchangeId) => {
    if (!confirm('¿Estás seguro de cancelar este intercambio? Esta acción lo revertirá y ambos usuarios recuperarán sus semanas originales.')) {
      return;
    }

    try {
      setSubmitting(true);
      await cancelAcceptedExchange(exchangeId, user.uid);
      alert('Intercambio cancelado y revertido exitosamente');
      await loadData();
    } catch (error) {
      console.error('Error cancelando intercambio:', error);
      alert('Error al cancelar intercambio: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-1"><Clock size={14} /> Pendiente</span>,
      accepted: <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1"><CheckCircle size={14} /> Aceptado</span>,
      rejected: <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center gap-1"><XCircle size={14} /> Rechazado</span>,
      cancelled: <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium flex items-center gap-1"><XCircle size={14} /> Cancelado</span>
    };
    return badges[status] || badges.pending;
  };

  const getSerieColor = (titleId) => {
    if (!titleId) return 'bg-gray-200';
    const serie = titleId.charAt(0);
    return {
      'A': 'bg-serie-a',
      'B': 'bg-serie-b',
      'C': 'bg-serie-c',
      'D': 'bg-serie-d'
    }[serie] || 'bg-gray-200';
  };

  // NUEVO: Función para obtener el nombre del usuario
  const getUserName = (userId) => {
    return usersMap[userId]?.name || 'Usuario desconocido';
  };

  const displayExchanges = activeTab === 'sent' ? sentExchanges : 
                           activeTab === 'received' ? receivedExchanges :
                           [...sentExchanges, ...receivedExchanges].filter(e => 
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
          <h1 className="text-3xl font-bold text-gray-900">Intercambios</h1>
          <p className="text-gray-600 mt-1">Gestiona tus solicitudes de intercambio</p>
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
      <div className="flex gap-2 mb-6">
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
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayExchanges.map((exchange) => (
              <div
                key={exchange.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(exchange.status)}
                      <span className="text-sm text-gray-500">
                        {new Date(exchange.createdAt?.seconds * 1000).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Semana ofrecida */}
                      <div>
                        <div className="text-sm text-gray-600 mb-1">
                          {activeTab === 'received' ? 'Ofrece' : 'Ofreces'}
                        </div>
                        <div className={`${getSerieColor(exchange.fromWeek.titleId)} px-3 py-2 rounded-lg`}>
                          <div className="font-medium">Semana {exchange.fromWeek.weekNumber}</div>
                          <div className="text-sm">{exchange.fromWeek.titleId}</div>
                          {/* NUEVO: Mostrar nombre del dueño */}
                          <div className="text-xs mt-1 flex items-center gap-1 opacity-75">
                            <User size={12} />
                            {getUserName(exchange.fromUserId)}
                          </div>
                        </div>
                      </div>

                      {/* Semana solicitada */}
                      <div>
                        <div className="text-sm text-gray-600 mb-1">
                          {activeTab === 'received' ? 'Solicita' : 'Solicitas'}
                        </div>
                        <div className={`${getSerieColor(exchange.toWeek.titleId)} px-3 py-2 rounded-lg`}>
                          <div className="font-medium">Semana {exchange.toWeek.weekNumber}</div>
                          <div className="text-sm">{exchange.toWeek.titleId}</div>
                          {/* NUEVO: Mostrar nombre del dueño */}
                          <div className="text-xs mt-1 flex items-center gap-1 opacity-75">
                            <User size={12} />
                            {getUserName(exchange.toUserId)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {exchange.message && (
                      <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                        <MessageSquare size={16} className="mt-0.5 flex-shrink-0" />
                        <span className="italic">"{exchange.message}"</span>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="ml-4 flex flex-col gap-2">
                    {activeTab === 'received' && exchange.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAccept(exchange.id)}
                          disabled={submitting}
                        >
                          Aceptar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleReject(exchange.id)}
                          disabled={submitting}
                        >
                          Rechazar
                        </Button>
                      </>
                    )}
                    
                    {activeTab === 'sent' && exchange.status === 'pending' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleCancel(exchange.id)}
                        disabled={submitting}
                      >
                        Cancelar
                      </Button>
                    )}

                    {/* Permitir cancelar intercambios aceptados */}
                    {exchange.status === 'accepted' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handlecancelAcceptedExchange(exchange.id)}
                        disabled={submitting}
                      >
                        Cancelar y Revertir
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal crear intercambio */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateForm({ myWeek: '', targetWeek: '', message: '' });
          setSelectedUser('');
          setSelectedUserWeeks([]);
        }}
        title="Nueva solicitud de intercambio"
      >
        <div className="space-y-4">
          {/* Seleccionar tu semana */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tu semana a intercambiar
            </label>
            <select
              value={createForm.myWeek}
              onChange={(e) => setCreateForm({ ...createForm, myWeek: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
            >
              <option value="">Selecciona una semana</option>
              {myWeeks.map((week, idx) => (
                <option key={idx} value={`${week.titleId}-${week.weekNumber}`}>
                  Semana {week.weekNumber} - {week.titleId} {week.type === 'special' && '⭐'}
                </option>
              ))}
            </select>
          </div>

          {/* Seleccionar usuario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuario con quien intercambiar
            </label>
            <select
              value={selectedUser}
              onChange={(e) => handleUserSelect(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
            >
              <option value="">Selecciona un usuario</option>
              {otherUsers.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.name} ({u.titles.length} título{u.titles.length > 1 ? 's' : ''})
                </option>
              ))}
            </select>
          </div>

          {/* Seleccionar semana del otro usuario */}
          {selectedUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semana que solicitas
              </label>
              <select
                value={createForm.targetWeek}
                onChange={(e) => setCreateForm({ ...createForm, targetWeek: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
              >
                <option value="">Selecciona una semana</option>
                {selectedUserWeeks.map((week, idx) => (
                  <option key={idx} value={`${week.titleId}-${week.weekNumber}`}>
                    Semana {week.weekNumber} - {week.titleId} {week.type === 'special' && '⭐'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mensaje opcional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje (opcional)
            </label>
            <Input
              as="textarea"
              rows={3}
              value={createForm.message}
              onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
              placeholder="Explica por qué te gustaría hacer este intercambio..."
            />
          </div>

          <div className="flex gap-3 pt-4">
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
            <Button
              onClick={handleCreateExchange}
              disabled={submitting || !createForm.myWeek || !createForm.targetWeek}
              className="flex-1"
            >
              {submitting ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}