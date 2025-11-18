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
  checkDuplicateExchange
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
  const [activeTab, setActiveTab] = useState('received'); // received, sent, history
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
      
      const [exchangesData, statsData, usersData] = await Promise.all([
        getUserExchanges(user.uid),
        getExchangeStats(user.uid),
        getAllUsers()
      ]);
      
      setSentExchanges(exchangesData.sent || []);
      setReceivedExchanges(exchangesData.received || []);
      setStats(statsData);
      
      // Cargar semanas del usuario actual
      try {
        const weeksData = await getUserWeeksForYear(user.uid, currentYear);
        // Convertir a formato array si es objeto
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
      // Convertir a formato array si es objeto
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

      // Encontrar detalles de las semanas seleccionadas
      const myWeekData = myWeeks.find(w => `${w.titleId}-${w.weekNumber}` === createForm.myWeek);
      const targetWeekData = selectedUserWeeks.find(w => `${w.titleId}-${w.weekNumber}` === createForm.targetWeek);

      if (!myWeekData || !targetWeekData) {
        alert('Error: No se encontraron los datos de las semanas');
        return;
      }

      // Verificar duplicados
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

      // Crear intercambio
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
    if (!confirm('¿Estás seguro de cancelar esta solicitud?')) {
      return;
    }

    try {
      setSubmitting(true);
      await cancelExchange(exchangeId);
      alert('Solicitud cancelada');
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

  const displayExchanges = activeTab === 'sent' ? sentExchanges : 
                           activeTab === 'received' ? receivedExchanges :
                           [...sentExchanges, ...receivedExchanges];

  const filteredExchanges = displayExchanges.filter(ex => {
    if (activeTab === 'history') {
      return ex.status !== 'pending';
    }
    return ex.status === 'pending';
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin text-gray-400" size={32} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle size={64} className="text-red-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar datos</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadData}>
              Intentar de nuevo
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Intercambios</h1>
          <p className="text-gray-600 mt-1">Gestiona tus solicitudes de intercambio de semanas</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Send size={20} className="mr-2" />
          Nueva solicitud
        </Button>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending || 0}</p>
              </div>
              <Clock size={32} className="text-yellow-400" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aceptados</p>
                <p className="text-3xl font-bold text-green-600">{stats.accepted || 0}</p>
              </div>
              <CheckCircle size={32} className="text-green-400" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rechazados</p>
                <p className="text-3xl font-bold text-red-600">{stats.rejected || 0}</p>
              </div>
              <XCircle size={32} className="text-red-400" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total || 0}</p>
              </div>
              <ArrowLeftRight size={32} className="text-gray-400" />
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Card className="mb-6">
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('received')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'received'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Recibidas ({receivedExchanges.filter(ex => ex.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'sent'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Enviadas ({sentExchanges.filter(ex => ex.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Historial
          </button>
        </div>
      </Card>

      {/* Lista de intercambios */}
      <Card>
        {filteredExchanges.length === 0 ? (
          <div className="text-center py-12">
            <ArrowLeftRight size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {activeTab === 'history' ? 'No hay intercambios en el historial' : 'No hay solicitudes pendientes'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExchanges.map((exchange) => (
              <div
                key={exchange.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <User size={20} className="text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {activeTab === 'sent' ? exchange.toUserName : exchange.fromUserName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(exchange.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(exchange.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-2">
                      {activeTab === 'received' ? 'Ofrece' : 'Ofreces'}
                    </p>
                    <div className={`${getSerieColor(exchange.fromWeek.titleId)} rounded-lg p-3`}>
                      <p className="text-lg font-bold text-gray-900">
                        Semana {exchange.fromWeek.weekNumber}
                      </p>
                      <p className="text-sm text-gray-700">{exchange.fromWeek.titleId}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-2">
                      {activeTab === 'received' ? 'Solicita' : 'Solicitas'}
                    </p>
                    <div className={`${getSerieColor(exchange.toWeek.titleId)} rounded-lg p-3`}>
                      <p className="text-lg font-bold text-gray-900">
                        Semana {exchange.toWeek.weekNumber}
                      </p>
                      <p className="text-sm text-gray-700">{exchange.toWeek.titleId}</p>
                    </div>
                  </div>
                </div>

                {exchange.message && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-600 flex items-start gap-2">
                      <MessageSquare size={16} className="mt-0.5 flex-shrink-0" />
                      {exchange.message}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedExchange(exchange);
                      setShowDetailsModal(true);
                    }}
                  >
                    Ver detalles
                  </Button>
                  
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
                Semana que deseas
              </label>
              {selectedUserWeeks.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">
                  Este usuario no tiene semanas disponibles
                </p>
              ) : (
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
              )}
            </div>
          )}

          {/* Mensaje opcional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje (opcional)
            </label>
            <textarea
              value={createForm.message}
              onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
              placeholder="Agrega un mensaje para el usuario..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateExchange}
              disabled={submitting || !createForm.myWeek || !createForm.targetWeek}
              className="flex-1"
            >
              Enviar solicitud
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal detalles */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedExchange(null);
        }}
        title="Detalles del intercambio"
      >
        {selectedExchange && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Estado</h3>
                {getStatusBadge(selectedExchange.status)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  {activeTab === 'received' ? 'Usuario ofrece' : 'Ofreces'}
                </p>
                <div className={`${getSerieColor(selectedExchange.fromWeek.titleId)} rounded-lg p-4`}>
                  <p className="text-2xl font-bold text-gray-900">
                    Semana {selectedExchange.fromWeek.weekNumber}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    {selectedExchange.fromWeek.titleId}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">
                  {activeTab === 'received' ? 'Usuario solicita' : 'Solicitas'}
                </p>
                <div className={`${getSerieColor(selectedExchange.toWeek.titleId)} rounded-lg p-4`}>
                  <p className="text-2xl font-bold text-gray-900">
                    Semana {selectedExchange.toWeek.weekNumber}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    {selectedExchange.toWeek.titleId}
                  </p>
                </div>
              </div>
            </div>

            {selectedExchange.message && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Mensaje:</p>
                <p className="text-gray-900">{selectedExchange.message}</p>
              </div>
            )}

            <div className="text-sm text-gray-500">
              <p>Creado: {new Date(selectedExchange.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
              {selectedExchange.resolvedAt && (
                <p>Resuelto: {new Date(selectedExchange.resolvedAt.seconds * 1000).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              )}
            </div>

            {activeTab === 'received' && selectedExchange.status === 'pending' && (
              <div className="flex gap-2 pt-4">
                <Button
                  variant="danger"
                  onClick={() => handleReject(selectedExchange.id)}
                  disabled={submitting}
                  className="flex-1"
                >
                  Rechazar
                </Button>
                <Button
                  onClick={() => handleAccept(selectedExchange.id)}
                  disabled={submitting}
                  className="flex-1"
                >
                  Aceptar
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Información */}
      <div className="mt-8">
        <Card>
          <div className="flex items-start gap-4">
            <div className="bg-gray-100 rounded-lg p-3">
              <ArrowLeftRight size={24} className="text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Sobre los intercambios
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Los intercambios solo son válidos para el año en curso ({currentYear})</li>
                <li>• Ambas partes deben aceptar para que el intercambio sea efectivo</li>
                <li>• Puedes cancelar una solicitud enviada si aún está pendiente</li>
                <li>• Una vez realizado el intercambio, las semanas vuelven a su estado original el siguiente año</li>
                <li>• Las solicitudes rechazadas no se pueden reenviar</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}