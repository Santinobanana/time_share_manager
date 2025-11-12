import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { 
  getAllTitles,
  getTitleById,
  getTitleOwner,
  getTitleStats
} from '../../services/titleService';
import { 
  Home, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle,
  User,
  Calendar,
  RefreshCw
} from 'lucide-react';

export default function AdminTitles() {
  const [titles, setTitles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSerie, setFilterSerie] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedYear, setSelectedYear] = useState(2027);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [titleOwner, setTitleOwner] = useState(null);

  const years = [2027, 2028, 2029, 2030, 2031, 2032, 2033];

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [titlesData, statsData] = await Promise.all([
        getAllTitles(),
        getTitleStats()
      ]);
      
      setTitles(titlesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar los datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar títulos
  const filteredTitles = titles.filter(title => {
    // Filtrar por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesId = title.id.toLowerCase().includes(search);
      if (!matchesId) return false;
    }

    // Filtrar por serie
    if (filterSerie !== 'all' && title.serie !== filterSerie) {
      return false;
    }

    // Filtrar por estado
    if (filterStatus === 'assigned' && !title.ownerId) {
      return false;
    }
    if (filterStatus === 'available' && title.ownerId) {
      return false;
    }

    return true;
  });

  const getSerieColor = (serie) => {
    return {
      'A': 'bg-serie-a',
      'B': 'bg-serie-b',
      'C': 'bg-serie-c',
      'D': 'bg-serie-d'
    }[serie];
  };

  const handleViewDetails = async (title) => {
    setSelectedTitle(title);
    setShowDetailsModal(true);
    
    // Cargar información del dueño si tiene
    if (title.ownerId) {
      try {
        const owner = await getTitleOwner(title.id);
        setTitleOwner(owner);
      } catch (error) {
        console.error('Error cargando dueño:', error);
        setTitleOwner(null);
      }
    } else {
      setTitleOwner(null);
    }
  };

  // Agrupar títulos por subserie para mejor visualización
  const groupedTitles = {};
  filteredTitles.forEach(title => {
    const key = `${title.serie}-${title.subserie}`;
    if (!groupedTitles[key]) {
      groupedTitles[key] = [];
    }
    groupedTitles[key].push(title);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Títulos</h1>
          <p className="text-gray-600 mt-1">
            Visualiza y administra todos los títulos del condominio
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
              <p className="text-gray-600 mt-1">Total de títulos</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{stats.assigned}</p>
              <p className="text-gray-600 mt-1">Asignados</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.available}</p>
              <p className="text-gray-600 mt-1">Disponibles</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{stats.occupancyRate}%</p>
              <p className="text-gray-600 mt-1">Ocupación</p>
            </div>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por ID (ej: A-1-1)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
            />
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

          {/* Filtro por estado */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
            >
              <option value="all">Todos los estados</option>
              <option value="assigned">Solo asignados</option>
              <option value="available">Solo disponibles</option>
            </select>
          </div>
        </div>

        {/* Selector de año */}
        <div className="mt-4 flex items-center gap-2">
          <Calendar size={20} className="text-gray-600" />
          <span className="text-sm text-gray-600">Ver semanas del año:</span>
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

      {/* Matriz de títulos agrupados por subserie */}
      <div className="space-y-6">
        {Object.keys(groupedTitles).sort().map((subserieKey) => {
          const titlesInSubserie = groupedTitles[subserieKey];
          const [serie, subserie] = subserieKey.split('-');
          
          return (
            <Card key={subserieKey}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Subserie {serie}-{subserie}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {titlesInSubserie.map((title) => (
                  <div
                    key={title.id}
                    className={`${getSerieColor(title.serie)} rounded-lg p-4 transition-all hover:shadow-md cursor-pointer`}
                    onClick={() => handleViewDetails(title)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Home size={20} />
                        <h4 className="font-bold text-lg">{title.id}</h4>
                      </div>
                      {title.ownerId ? (
                        <CheckCircle size={18} className="text-green-700" />
                      ) : (
                        <XCircle size={18} className="text-gray-400" />
                      )}
                    </div>

                    {/* Semanas del año seleccionado */}
                    <div className="bg-white/40 backdrop-blur-sm rounded-lg p-2 mb-2 text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {title.weeksByYear?.[selectedYear] || '-'}
                      </p>
                      <p className="text-xs text-gray-700">semana en {selectedYear}</p>
                    </div>

                    {/* Estado */}
                    <div className="text-center">
                      {title.ownerId ? (
                        <span className="text-xs bg-white/50 px-2 py-1 rounded-full font-medium">
                          Asignado
                        </span>
                      ) : (
                        <span className="text-xs bg-white/50 px-2 py-1 rounded-full font-medium">
                          Disponible
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Información si no hay resultados */}
      {filteredTitles.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <Home size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No se encontraron títulos con los filtros seleccionados</p>
          </div>
        </Card>
      )}

      {/* Modal de detalles */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setTitleOwner(null);
        }}
        title={`Detalles del título ${selectedTitle?.id}`}
      >
        {selectedTitle && (
          <div className="space-y-6">
            {/* Información básica */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Información General
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Título:</span>
                  <span className="ml-2 font-bold text-lg">{selectedTitle.id}</span>
                </div>
                <div>
                  <span className="text-gray-600">Serie:</span>
                  <span className={`ml-2 ${getSerieColor(selectedTitle.serie)} px-3 py-1 rounded-full font-medium`}>
                    {selectedTitle.serie}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Subserie:</span>
                  <span className="ml-2 font-medium">{selectedTitle.subserie}</span>
                </div>
                <div>
                  <span className="text-gray-600">Número:</span>
                  <span className="ml-2 font-medium">{selectedTitle.number}</span>
                </div>
                <div>
                  <span className="text-gray-600">Estado:</span>
                  <span className="ml-2">
                    {selectedTitle.ownerId ? (
                      <span className="text-green-600 font-medium flex items-center gap-1 inline-flex">
                        <CheckCircle size={14} />
                        Asignado
                      </span>
                    ) : (
                      <span className="text-blue-600 font-medium flex items-center gap-1 inline-flex">
                        <XCircle size={14} />
                        Disponible
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Propietario */}
            {titleOwner && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User size={18} />
                  Propietario
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Nombre:</span>
                    <span className="ml-2 font-medium">{titleOwner.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{titleOwner.email}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Semanas por año */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar size={18} />
                Semanas asignadas por año
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {years.map(year => (
                  <div
                    key={year}
                    className="bg-gray-50 rounded-lg p-3 text-center"
                  >
                    <p className="text-xs text-gray-600 mb-1">{year}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedTitle.weeksByYear?.[year] || '-'}
                    </p>
                    <p className="text-xs text-gray-500">semana</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}