import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import { ArrowLeftRight, Plus, Clock, CheckCircle, XCircle, History, Send, Inbox } from 'lucide-react';

export default function Exchanges() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('received'); // received, sent, history
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState(null);
  
  // Form para crear intercambio
  const [createForm, setCreateForm] = useState({
    myWeek: '',
    targetUser: '',
    targetWeek: '',
    message: ''
  });

  // Datos simulados - En Fase 2 vendrán de Firebase
  const myWeeks2027 = [
    { id: 'w1', weekNumber: 2, dates: '11-17 Ene', title: 'A-1-1', type: 'regular' },
    { id: 'w2', weekNumber: 5, dates: '1-7 Feb', title: 'A-2-3', type: 'regular' },
    { id: 'w3', weekNumber: null, dates: '21-28 Mar', title: 'A-1-1', type: 'special', name: 'SANTA' },
  ];

  const otherUsers = [
    { id: '1', name: 'Alberto Retano', email: 'alberto@example.com' },
    { id: '2', name: 'Mónica Martínez', email: 'monica@example.com' },
    { id: '3', name: 'Luis Miguel Sánchez', email: 'luis@example.com' },
  ];

  const receivedExchanges = [
    {
      id: 'ex1',
      from: { id: '1', name: 'Alberto Retano', email: 'alberto@example.com' },
      fromWeek: { weekNumber: 2, dates: '11-17 Ene', title: 'A-1-1' },
      toWeek: { weekNumber: 5, dates: '1-7 Feb', title: 'A-2-3' },
      status: 'pending',
      message: 'Me gustaría intercambiar esta semana, ¿te parece bien?',
      createdAt: '2027-01-05',
      year: 2027
    },
    {
      id: 'ex2',
      from: { id: '2', name: 'Mónica Martínez', email: 'monica@example.com' },
      fromWeek: { weekNumber: 1, dates: '3-9 Ene', title: 'A-2-1' },
      toWeek: { weekNumber: 2, dates: '11-17 Ene', title: 'A-1-1' },
      status: 'pending',
      message: 'Hola, necesito esa semana por motivos familiares.',
      createdAt: '2027-01-03',
      year: 2027
    },
  ];

  const sentExchanges = [
    {
      id: 'ex3',
      to: { id: '3', name: 'Luis Miguel Sánchez', email: 'luis@example.com' },
      fromWeek: { weekNumber: 5, dates: '1-7 Feb', title: 'A-2-3' },
      toWeek: { weekNumber: 9, dates: '28 Feb - 6 Mar', title: 'A-3-1' },
      status: 'pending',
      message: 'Me interesa tu semana, ¿podemos intercambiar?',
      createdAt: '2027-01-04',
      year: 2027
    },
  ];

  const historyExchanges = [
    {
      id: 'ex4',
      with: { id: '1', name: 'Alberto Retano', email: 'alberto@example.com' },
      fromWeek: { weekNumber: 8, dates: '22-28 Feb', title: 'A-1-1' },
      toWeek: { weekNumber: 10, dates: '8-14 Mar', title: 'A-1-2' },
      status: 'accepted',
      resolvedAt: '2026-12-15',
      year: 2026
    },
    {
      id: 'ex5',
      with: { id: '2', name: 'Mónica Martínez', email: 'monica@example.com' },
      fromWeek: { weekNumber: 15, dates: '10-16 Abr', title: 'A-2-3' },
      toWeek: { weekNumber: 12, dates: '22-28 Mar', title: 'A-2-1' },
      status: 'rejected',
      resolvedAt: '2026-11-20',
      year: 2026
    },
  ];

  const getSerieColor = (title) => {
    const serie = title.charAt(0);
    return {
      'A': 'bg-serie-a',
      'B': 'bg-serie-b',
      'C': 'bg-serie-c',
      'D': 'bg-serie-d'
    }[serie];
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    
    const labels = {
      pending: 'Pendiente',
      accepted: 'Aceptado',
      rejected: 'Rechazado',
      cancelled: 'Cancelado'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const handleCreateExchange = () => {
    // Simulación - En Fase 2 guardará en Firebase
    console.log('Crear intercambio:', createForm);
    alert('Solicitud de intercambio enviada');
    setShowCreateModal(false);
    setCreateForm({ myWeek: '', targetUser: '', targetWeek: '', message: '' });
  };

  const handleAcceptExchange = (exchangeId) => {
    // Simulación - En Fase 2 actualizará Firebase
    console.log('Aceptar intercambio:', exchangeId);
    alert('Intercambio aceptado');
    setShowDetailsModal(false);
  };

  const handleRejectExchange = (exchangeId) => {
    // Simulación - En Fase 2 actualizará Firebase
    console.log('Rechazar intercambio:', exchangeId);
    alert('Intercambio rechazado');
    setShowDetailsModal(false);
  };

  const handleCancelExchange = (exchangeId) => {
    // Simulación - En Fase 2 actualizará Firebase
    console.log('Cancelar intercambio:', exchangeId);
    if (confirm('¿Estás seguro de cancelar esta solicitud?')) {
      alert('Solicitud cancelada');
      setShowDetailsModal(false);
    }
  };

  const handleViewDetails = (exchange) => {
    setSelectedExchange(exchange);
    setShowDetailsModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Intercambios</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tus solicitudes de intercambio de semanas
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          Nueva solicitud
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">
              {receivedExchanges.filter(e => e.status === 'pending').length}
            </p>
            <p className="text-gray-600 mt-1">Solicitudes recibidas</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">
              {sentExchanges.filter(e => e.status === 'pending').length}
            </p>
            <p className="text-gray-600 mt-1">Solicitudes enviadas</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">
              {historyExchanges.length}
            </p>
            <p className="text-gray-600 mt-1">Historial total</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('received')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'received'
                  ? 'border-gray-700 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Inbox size={18} />
              Recibidas ({receivedExchanges.length})
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'sent'
                  ? 'border-gray-700 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Send size={18} />
              Enviadas ({sentExchanges.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'border-gray-700 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <History size={18} />
              Historial ({historyExchanges.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Contenido según tab activo */}
      <Card>
        {/* Tab: Recibidas */}
        {activeTab === 'received' && (
          <div className="space-y-4">
            {receivedExchanges.length === 0 ? (
              <div className="text-center py-12">
                <Inbox size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No tienes solicitudes recibidas</p>
              </div>
            ) : (
              receivedExchanges.map((exchange) => (
                <div
                  key={exchange.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {exchange.from.name}
                        </h3>
                        {getStatusBadge(exchange.status)}
                      </div>
                      <p className="text-sm text-gray-600">{exchange.from.email}</p>
                    </div>
                    <Clock size={16} className="text-gray-400" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div className={`${getSerieColor(exchange.fromWeek.title)} rounded-lg p-3`}>
                      <p className="text-xs text-gray-700 mb-1">Te ofrece:</p>
                      <p className="font-semibold text-gray-900">Semana {exchange.fromWeek.weekNumber}</p>
                      <p className="text-sm text-gray-700">{exchange.fromWeek.dates}</p>
                    </div>

                    <div className="flex items-center justify-center">
                      <ArrowLeftRight size={24} className="text-gray-400" />
                    </div>

                    <div className={`${getSerieColor(exchange.toWeek.title)} rounded-lg p-3`}>
                      <p className="text-xs text-gray-700 mb-1">Por tu:</p>
                      <p className="font-semibold text-gray-900">Semana {exchange.toWeek.weekNumber}</p>
                      <p className="text-sm text-gray-700">{exchange.toWeek.dates}</p>
                    </div>
                  </div>

                  {exchange.message && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-700">{exchange.message}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={() => handleViewDetails(exchange)}
                      className="flex-1"
                    >
                      Ver detalles
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Enviadas */}
        {activeTab === 'sent' && (
          <div className="space-y-4">
            {sentExchanges.length === 0 ? (
              <div className="text-center py-12">
                <Send size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No has enviado solicitudes</p>
              </div>
            ) : (
              sentExchanges.map((exchange) => (
                <div
                  key={exchange.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          Para: {exchange.to.name}
                        </h3>
                        {getStatusBadge(exchange.status)}
                      </div>
                      <p className="text-sm text-gray-600">{exchange.to.email}</p>
                    </div>
                    <Clock size={16} className="text-gray-400" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div className={`${getSerieColor(exchange.fromWeek.title)} rounded-lg p-3`}>
                      <p className="text-xs text-gray-700 mb-1">Ofreces:</p>
                      <p className="font-semibold text-gray-900">Semana {exchange.fromWeek.weekNumber}</p>
                      <p className="text-sm text-gray-700">{exchange.fromWeek.dates}</p>
                    </div>

                    <div className="flex items-center justify-center">
                      <ArrowLeftRight size={24} className="text-gray-400" />
                    </div>

                    <div className={`${getSerieColor(exchange.toWeek.title)} rounded-lg p-3`}>
                      <p className="text-xs text-gray-700 mb-1">Por:</p>
                      <p className="font-semibold text-gray-900">Semana {exchange.toWeek.weekNumber}</p>
                      <p className="text-sm text-gray-700">{exchange.toWeek.dates}</p>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    onClick={() => handleViewDetails(exchange)}
                    fullWidth
                  >
                    Ver detalles
                  </Button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Historial */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {historyExchanges.length === 0 ? (
              <div className="text-center py-12">
                <History size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No hay historial de intercambios</p>
              </div>
            ) : (
              historyExchanges.map((exchange) => (
                <div
                  key={exchange.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {exchange.with.name}
                        </h3>
                        {getStatusBadge(exchange.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(exchange.resolvedAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`${getSerieColor(exchange.fromWeek.title)} rounded-lg p-3`}>
                      <p className="font-semibold text-gray-900">Semana {exchange.fromWeek.weekNumber}</p>
                      <p className="text-sm text-gray-700">{exchange.fromWeek.dates}</p>
                    </div>

                    <div className="flex items-center justify-center">
                      <ArrowLeftRight size={24} className="text-gray-400" />
                    </div>

                    <div className={`${getSerieColor(exchange.toWeek.title)} rounded-lg p-3`}>
                      <p className="font-semibold text-gray-900">Semana {exchange.toWeek.weekNumber}</p>
                      <p className="text-sm text-gray-700">{exchange.toWeek.dates}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      {/* Modal: Crear intercambio */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nueva solicitud de intercambio"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tu semana a ofrecer
            </label>
            <select
              value={createForm.myWeek}
              onChange={(e) => setCreateForm({...createForm, myWeek: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
            >
              <option value="">Selecciona una semana</option>
              {myWeeks2027.map((week) => (
                <option key={week.id} value={week.id}>
                  {week.type === 'special' ? week.name : `Semana ${week.weekNumber}`} - {week.dates} ({week.title})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuario destino
            </label>
            <select
              value={createForm.targetUser}
              onChange={(e) => setCreateForm({...createForm, targetUser: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
            >
              <option value="">Selecciona un usuario</option>
              {otherUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Semana que deseas"
            placeholder="Ej: Semana 8, PASCUA, etc."
            value={createForm.targetWeek}
            onChange={(e) => setCreateForm({...createForm, targetWeek: e.target.value})}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje (opcional)
            </label>
            <textarea
              value={createForm.message}
              onChange={(e) => setCreateForm({...createForm, message: e.target.value})}
              rows={3}
              placeholder="Agrega un mensaje para el usuario..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              fullWidth
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateExchange}
              fullWidth
              disabled={!createForm.myWeek || !createForm.targetUser || !createForm.targetWeek}
            >
              Enviar solicitud
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Detalles de intercambio */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Detalles del intercambio"
        size="lg"
      >
        {selectedExchange && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">
                {activeTab === 'received' ? 'De' : activeTab === 'sent' ? 'Para' : 'Con'}
              </p>
              <p className="font-semibold text-gray-900">
                {selectedExchange.from?.name || selectedExchange.to?.name || selectedExchange.with?.name}
              </p>
              <p className="text-sm text-gray-600">
                {selectedExchange.from?.email || selectedExchange.to?.email || selectedExchange.with?.email}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  {activeTab === 'received' ? 'Te ofrece' : 'Ofreces'}
                </p>
                <div className={`${getSerieColor(selectedExchange.fromWeek.title)} rounded-lg p-3`}>
                  <p className="font-semibold text-gray-900">
                    Semana {selectedExchange.fromWeek.weekNumber}
                  </p>
                  <p className="text-sm text-gray-700">{selectedExchange.fromWeek.dates}</p>
                  <p className="text-sm text-gray-700">{selectedExchange.fromWeek.title}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">
                  {activeTab === 'received' ? 'Por tu' : 'Por'}
                </p>
                <div className={`${getSerieColor(selectedExchange.toWeek.title)} rounded-lg p-3`}>
                  <p className="font-semibold text-gray-900">
                    Semana {selectedExchange.toWeek.weekNumber}
                  </p>
                  <p className="text-sm text-gray-700">{selectedExchange.toWeek.dates}</p>
                  <p className="text-sm text-gray-700">{selectedExchange.toWeek.title}</p>
                </div>
              </div>
            </div>

            {selectedExchange.message && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Mensaje:</p>
                <p className="text-gray-900">{selectedExchange.message}</p>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Estado: {getStatusBadge(selectedExchange.status)}</p>
            </div>

            {selectedExchange.status === 'pending' && activeTab === 'received' && (
              <div className="flex gap-3 pt-4">
                <Button
                  variant="danger"
                  onClick={() => handleRejectExchange(selectedExchange.id)}
                  fullWidth
                  className="flex items-center justify-center gap-2"
                >
                  <XCircle size={18} />
                  Rechazar
                </Button>
                <Button
                  onClick={() => handleAcceptExchange(selectedExchange.id)}
                  fullWidth
                  className="flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  Aceptar
                </Button>
              </div>
            )}

            {selectedExchange.status === 'pending' && activeTab === 'sent' && (
              <div className="pt-4">
                <Button
                  variant="danger"
                  onClick={() => handleCancelExchange(selectedExchange.id)}
                  fullWidth
                >
                  Cancelar solicitud
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
                <li>• Los intercambios solo son válidos para el año en curso</li>
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