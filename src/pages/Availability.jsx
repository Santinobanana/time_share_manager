import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { Users, Search, Filter, Calendar, RefreshCw } from 'lucide-react';
import { getAllUsers } from '../services/userService';
import { getUserWeeksForYear } from '../services/titleService';
import { addDays, startOfYear, format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Availability() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSerie, setFilterSerie] = useState('all');
  const [selectedYear, setSelectedYear] = useState(2027);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserWeeks, setSelectedUserWeeks] = useState([]);
  const [loadingWeeks, setLoadingWeeks] = useState(false);

  const years = [2027, 2028, 2029, 2030, 2031, 2032, 2033];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getAllUsers();
      
      // Filtrar solo usuarios aprobados y activos con títulos
      const activeUsers = usersData.filter(u => 
        u.isApproved && 
        u.isActive && 
        u.titles && 
        u.titles.length > 0 &&
        u.uid !== user?.uid // Excluir al usuario actual
      );
      
      setUsers(activeUsers);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      alert('Error al cargar usuarios: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calcular fecha de inicio de semana (Lunes)
   */
  const getWeekStartDate = (year, weekNumber) => {
    const firstDayOfYear = startOfYear(new Date(year, 0, 1));
    const daysToAdd = (weekNumber - 1) * 7;
    const weekStart = addDays(firstDayOfYear, daysToAdd);
    
    const dayOfWeek = weekStart.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = addDays(weekStart, daysUntilMonday);
    
    return format(monday, 'dd/MM/yyyy', { locale: es });
  };

  /**
   * Calcular fecha de fin de semana (Domingo)
   */
  const getWeekEndDate = (year, weekNumber) => {
    const firstDayOfYear = startOfYear(new Date(year, 0, 1));
    const daysToAdd = (weekNumber - 1) * 7 + 6;
    const weekEnd = addDays(firstDayOfYear, daysToAdd);
    
    const dayOfWeek = weekEnd.getDay();
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const sunday = addDays(weekEnd, daysUntilSunday);
    
    return format(sunday, 'dd/MM/yyyy', { locale: es });
  };

  const handleViewDetails = async (selectedUser) => {
    setSelectedUser(selectedUser);
    setShowDetailsModal(true);
    setLoadingWeeks(true);
    
    try {
      // Cargar semanas del usuario seleccionado
      const weeksData = await getUserWeeksForYear(selectedUser.uid, selectedYear);
      
      // Manejar diferentes formatos de respuesta y agregar fechas
      let weeks = [];
      
      if (weeksData) {
        if (weeksData.all && Array.isArray(weeksData.all)) {
          weeks = weeksData.all;
        } else if (Array.isArray(weeksData)) {
          weeks = weeksData;
        } else if (typeof weeksData === 'object') {
          weeks = [
            ...(weeksData.regular || []),
            ...(weeksData.special || [])
          ];
        }
      }

      // Agregar fechas calculadas a cada semana
      const weeksWithDates = weeks.map(week => ({
        ...week,
        startDate: getWeekStartDate(selectedYear, week.weekNumber),
        endDate: getWeekEndDate(selectedYear, week.weekNumber)
      }));

      setSelectedUserWeeks(weeksWithDates);
    } catch (error) {
      console.error('Error cargando semanas:', error);
      setSelectedUserWeeks([]);
    } finally {
      setLoadingWeeks(false);
    }
  };

  // Filtrar usuarios
  const filteredUsers = users.filter(u => {
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
    const serie = title?.charAt(0);
    return {
      'A': 'bg-serie-a',
      'B': 'bg-serie-b',
      'C': 'bg-serie-c',
      'D': 'bg-serie-d'
    }[serie] || 'bg-gray-200';
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
              {users.length}
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
                ? 'No se encontraron usuarios con estos filtros'
                : 'No hay otros usuarios con títulos asignados'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((userItem) => (
              <div
                key={userItem.uid}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewDetails(userItem)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {userItem.name}
                    </h3>
                    
                    {/* Títulos */}
                    <div className="flex items-center gap-2 flex-wrap">
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

                  <div className="text-sm text-gray-600">
                    <p>{userItem.titles.length} título{userItem.titles.length > 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal de detalles CON FECHAS */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedUserWeeks([]);
          setSelectedUser(null);
        }}
        title={`Semanas de ${selectedUser?.name}`}
      >
        {selectedUser && (
          <div className="space-y-4">
            {/* Títulos */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Títulos</h3>
              <div className="flex gap-2 flex-wrap">
                {selectedUser.titles.map(title => (
                  <span
                    key={title}
                    className={`${getSerieColor(title)} px-3 py-1 rounded-full text-sm font-medium`}
                  >
                    {title}
                  </span>
                ))}
              </div>
            </div>

            {/* Semanas del año seleccionado CON FECHAS */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Semanas en {selectedYear}
              </h3>
              
              {loadingWeeks ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="animate-spin text-gray-400" size={24} />
                  <p className="text-gray-500 text-sm ml-2">Cargando semanas...</p>
                </div>
              ) : selectedUserWeeks.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No hay semanas asignadas para este año
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedUserWeeks.map((week, index) => {
                    // Validar que week tiene los campos necesarios
                    if (!week || typeof week.weekNumber === 'undefined') {
                      console.warn('Semana inválida:', week);
                      return null;
                    }

                    const isSpecial = week.type === 'special';
                    const colorClass = getSerieColor(week.titleId);

                    return (
                      <div
                        key={`${week.titleId}-${week.weekNumber}-${index}`}
                        className={`${colorClass} rounded-lg p-3 ${
                          isSpecial ? 'ring-2 ring-orange-400' : ''
                        }`}
                      >
                        <div className="flex flex-col gap-2">
                          {/* Línea 1: Semana y Badge */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-gray-900 text-lg">
                                Semana {week.weekNumber}
                              </p>
                              {isSpecial && (
                                <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded">
                                  ⭐ VIP: {week.specialName || week.specialType}
                                </span>
                              )}
                              {!isSpecial && (
                                <span className="px-2 py-0.5 bg-gray-600 text-white text-xs font-bold rounded">
                                  Regular
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Línea 2: Fechas */}
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Calendar size={14} />
                            <span className="font-medium">
                              {week.startDate} - {week.endDate}
                            </span>
                          </div>

                          {/* Línea 3: Título */}
                          <p className="text-sm text-gray-700">
                            🎫 Título: <strong>{week.titleId}</strong>
                          </p>
                        </div>
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
              )}
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