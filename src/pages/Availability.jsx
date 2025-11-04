import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import { Search, Users, Calendar, Filter, Eye } from 'lucide-react';

export default function Availability() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(2027);
  const [filterSerie, setFilterSerie] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Datos simulados - En Fase 2 vendrán de Firebase
  const years = [2027, 2028, 2029, 2030, 2031, 2032];

  const allUsers = [
    {
      id: '1',
      name: 'Alberto Retano',
      email: 'alberto@example.com',
      titles: ['A-1-1', 'A-1-2'],
      weeks2027: [
        { weekNumber: 2, dates: '11-17 Ene', title: 'A-1-1', type: 'regular' },
        { weekNumber: null, dates: '21-28 Mar', title: 'A-1-1', type: 'special', name: 'SANTA' },
        { weekNumber: 5, dates: '1-7 Feb', title: 'A-1-2', type: 'regular' },
      ]
    },
    {
      id: '2',
      name: 'Mónica Martínez',
      email: 'monica@example.com',
      titles: ['A-2-1'],
      weeks2027: [
        { weekNumber: 1, dates: '3-9 Ene', title: 'A-2-1', type: 'regular' },
        { weekNumber: 8, dates: '21-27 Feb', title: 'A-2-1', type: 'regular' },
      ]
    },
    {
      id: '3',
      name: 'Luis Miguel Sánchez',
      email: 'luis@example.com',
      titles: ['A-3-1', 'B-1-1'],
      weeks2027: [
        { weekNumber: 9, dates: '28 Feb - 6 Mar', title: 'A-3-1', type: 'regular' },
        { weekNumber: 1, dates: '3-9 Ene', title: 'B-1-1', type: 'regular' },
        { weekNumber: null, dates: '10-17 Abr', title: 'B-1-1', type: 'special', name: 'PASCUA' },
      ]
    },
    {
      id: '4',
      name: 'Carmen López',
      email: 'carmen@example.com',
      titles: ['B-2-3'],
      weeks2027: [
        { weekNumber: 10, dates: '7-13 Mar', title: 'B-2-3', type: 'regular' },
        { weekNumber: 15, dates: '11-17 Abr', title: 'B-2-3', type: 'regular' },
      ]
    },
    {
      id: '5',
      name: 'Roberto García',
      email: 'roberto@example.com',
      titles: ['C-1-1', 'C-2-2'],
      weeks2027: [
        { weekNumber: 3, dates: '17-23 Ene', title: 'C-1-1', type: 'regular' },
        { weekNumber: null, dates: '20-27 Dic', title: 'C-1-1', type: 'special', name: 'NAVIDAD' },
        { weekNumber: 12, dates: '21-27 Mar', title: 'C-2-2', type: 'regular' },
      ]
    },
    {
      id: '6',
      name: 'Patricia Hernández',
      email: 'patricia@example.com',
      titles: ['D-1-1'],
      weeks2027: [
        { weekNumber: null, dates: '27 Dic - 2 Ene', title: 'D-1-1', type: 'special', name: 'FIN DE AÑO' },
        { weekNumber: 4, dates: '24-30 Ene', title: 'D-1-1', type: 'regular' },
      ]
    },
  ];

  // Filtrar usuarios
  const filteredUsers = allUsers.filter(u => {
    // Excluir al usuario actual
    if (u.email === user?.email) return false;

    // Filtrar por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesName = u.name.toLowerCase().includes(search);
      const matchesTitles = u.titles.some(t => t.toLowerCase().includes(search));
      if (!matchesName && !matchesTitles) return false;
    }

    // Filtrar por serie
    if (filterSerie !== 'all') {
      const hasSerie = u.titles.some(t => t.startsWith(filterSerie));
      if (!hasSerie) return false;
    }

    return true;
  });

  const getSerieColor = (title) => {
    const serie = title.charAt(0);
    return {
      'A': 'bg-serie-a',
      'B': 'bg-serie-b',
      'C': 'bg-serie-c',
      'D': 'bg-serie-d'
    }[serie];
  };

  const handleViewDetails = (userItem) => {
    setSelectedUser(userItem);
    setShowDetailsModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ver Disponibilidad</h1>
        <p className="text-gray-600 mt-1">
          Consulta las semanas asignadas de otros usuarios
        </p>
      </div>

      {/* Filtros y búsqueda */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por nombre o título (ej: Alberto, A-1-1)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Filtro por serie */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600" />
            <select
              value={filterSerie}
              onChange={(e) => setFilterSerie(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
            >
              <option value="all">Todas las series</option>
              <option value="A">Serie A</option>
              <option value="B">Serie B</option>
              <option value="C">Serie C</option>
              <option value="D">Serie D</option>
            </select>
          </div>
        </div>

        {/* Selector de año */}
        <div className="mt-4 flex items-center gap-2">
          <Calendar size={20} className="text-gray-600" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">
              {filteredUsers.length}
            </p>
            <p className="text-gray-600 mt-1">Usuarios encontrados</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">
              {allUsers.length - 1}
            </p>
            <p className="text-gray-600 mt-1">Total de usuarios</p>
          </div>
        </Card>
      </div>

      {/* Lista de usuarios */}
      <Card title="Usuarios y sus semanas" subtitle={`Mostrando ${filteredUsers.length} usuarios`}>
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {searchTerm || filterSerie !== 'all' 
                ? 'No se encontraron usuarios con los filtros aplicados'
                : 'No hay usuarios disponibles'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((userItem) => (
              <div
                key={userItem.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {userItem.name}
                    </h3>
                    <p className="text-sm text-gray-600">{userItem.email}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleViewDetails(userItem)}
                    className="flex items-center gap-2"
                  >
                    <Eye size={16} />
                    Ver detalles
                  </Button>
                </div>

                {/* Títulos */}
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-2">Títulos:</p>
                  <div className="flex flex-wrap gap-2">
                    {userItem.titles.map((title) => (
                      <span
                        key={title}
                        className={`${getSerieColor(title)} px-3 py-1 rounded-full text-sm font-medium`}
                      >
                        {title}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Resumen de semanas */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Semanas en {selectedYear}: {userItem.weeks2027.length}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {userItem.weeks2027.slice(0, 3).map((week, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-100 px-3 py-1 rounded-md text-xs text-gray-700"
                      >
                        {week.type === 'special' ? week.name : `Semana ${week.weekNumber}`}
                      </span>
                    ))}
                    {userItem.weeks2027.length > 3 && (
                      <span className="bg-gray-100 px-3 py-1 rounded-md text-xs text-gray-700">
                        +{userItem.weeks2027.length - 3} más
                      </span>
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
        title={`Semanas de ${selectedUser?.name}`}
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Email</p>
              <p className="font-medium">{selectedUser.email}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Títulos</p>
              <div className="flex flex-wrap gap-2">
                {selectedUser.titles.map((title) => (
                  <span
                    key={title}
                    className={`${getSerieColor(title)} px-3 py-1 rounded-full text-sm font-medium`}
                  >
                    {title}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Semanas en {selectedYear}
              </h4>
              <div className="space-y-2">
                {selectedUser.weeks2027.map((week, idx) => (
                  <div
                    key={idx}
                    className={`${getSerieColor(week.title)} rounded-lg p-3`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {week.type === 'special' ? `⭐ ${week.name}` : `Semana ${week.weekNumber}`}
                        </p>
                        <p className="text-sm text-gray-700">
                          {week.dates} · {week.title}
                        </p>
                      </div>
                      {week.type === 'special' && (
                        <span className="bg-white/50 px-2 py-1 rounded text-xs font-medium">
                          Especial
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Información */}
      <div className="mt-8">
        <Card>
          <div className="flex items-start gap-4">
            <div className="bg-gray-100 rounded-lg p-3">
              <Users size={24} className="text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Sobre la disponibilidad
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Puedes ver las semanas de todos los usuarios del condominio</li>
                <li>• Usa esta información para identificar posibles intercambios</li>
                <li>• Los intercambios se gestionan en la sección "Intercambios"</li>
                <li>• La información se actualiza automáticamente</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}