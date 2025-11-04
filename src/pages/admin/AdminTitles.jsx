import { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { 
  Home, 
  Search, 
  Filter, 
  Calendar,
  User,
  Mail,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function AdminTitles() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSerie, setFilterSerie] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // all, assigned, available
  const [selectedYear, setSelectedYear] = useState(2027);
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const years = [2027, 2028, 2029, 2030, 2031, 2032, 2033];

  // Datos simulados - En Fase 2 vendrán de Firebase
  const allTitles = [
    // Serie A
    { id: 'A-1-1', serie: 'A', subserie: '1', number: '1', owner: { name: 'Alberto Retano', email: 'alberto@example.com' }, weeks: { 2027: 4, 2028: 3, 2029: 4, 2030: 4, 2031: 3, 2032: 4, 2033: 3 } },
    { id: 'A-1-2', serie: 'A', subserie: '1', number: '2', owner: { name: 'Alberto Retano', email: 'alberto@example.com' }, weeks: { 2027: 3, 2028: 4, 2029: 3, 2030: 3, 2031: 4, 2032: 3, 2033: 4 } },
    { id: 'A-1-3', serie: 'A', subserie: '1', number: '3', owner: null, weeks: { 2027: 4, 2028: 3, 2029: 4, 2030: 4, 2031: 3, 2032: 4, 2033: 3 } },
    { id: 'A-1-4', serie: 'A', subserie: '1', number: '4', owner: null, weeks: { 2027: 3, 2028: 4, 2029: 3, 2030: 3, 2031: 4, 2032: 3, 2033: 4 } },
    { id: 'A-2-1', serie: 'A', subserie: '2', number: '1', owner: { name: 'Mónica Martínez', email: 'monica@example.com' }, weeks: { 2027: 2, 2028: 3, 2029: 2, 2030: 3, 2031: 2, 2032: 3, 2033: 2 } },
    { id: 'A-2-2', serie: 'A', subserie: '2', number: '2', owner: null, weeks: { 2027: 3, 2028: 2, 2029: 3, 2030: 2, 2031: 3, 2032: 2, 2033: 3 } },
    { id: 'A-2-3', serie: 'A', subserie: '2', number: '3', owner: { name: 'Usuario Demo', email: 'usuario@test.com' }, weeks: { 2027: 3, 2028: 4, 2029: 3, 2030: 4, 2031: 3, 2032: 4, 2033: 3 } },
    { id: 'A-2-4', serie: 'A', subserie: '2', number: '4', owner: null, weeks: { 2027: 4, 2028: 3, 2029: 4, 2030: 3, 2031: 4, 2032: 3, 2033: 4 } },
    { id: 'A-3-1', serie: 'A', subserie: '3', number: '1', owner: { name: 'Luis Miguel Sánchez', email: 'luis@example.com' }, weeks: { 2027: 3, 2028: 4, 2029: 3, 2030: 4, 2031: 3, 2032: 4, 2033: 3 } },
    { id: 'A-3-2', serie: 'A', subserie: '3', number: '2', owner: null, weeks: { 2027: 4, 2028: 3, 2029: 4, 2030: 3, 2031: 4, 2032: 3, 2033: 4 } },
    { id: 'A-3-3', serie: 'A', subserie: '3', number: '3', owner: null, weeks: { 2027: 3, 2028: 4, 2029: 3, 2030: 4, 2031: 3, 2032: 4, 2033: 3 } },
    { id: 'A-3-4', serie: 'A', subserie: '3', number: '4', owner: null, weeks: { 2027: 4, 2028: 3, 2029: 4, 2030: 3, 2031: 4, 2032: 3, 2033: 4 } },
    
    // Serie B
    { id: 'B-1-1', serie: 'B', subserie: '1', number: '1', owner: { name: 'Luis Miguel Sánchez', email: 'luis@example.com' }, weeks: { 2027: 3, 2028: 4, 2029: 3, 2030: 4, 2031: 3, 2032: 4, 2033: 3 } },
    { id: 'B-1-2', serie: 'B', subserie: '1', number: '2', owner: null, weeks: { 2027: 4, 2028: 3, 2029: 4, 2030: 3, 2031: 4, 2032: 3, 2033: 4 } },
    { id: 'B-1-3', serie: 'B', subserie: '1', number: '3', owner: null, weeks: { 2027: 3, 2028: 4, 2029: 3, 2030: 4, 2031: 3, 2032: 4, 2033: 3 } },
    { id: 'B-1-4', serie: 'B', subserie: '1', number: '4', owner: null, weeks: { 2027: 4, 2028: 3, 2029: 4, 2030: 3, 2031: 4, 2032: 3, 2033: 4 } },
    { id: 'B-2-1', serie: 'B', subserie: '2', number: '1', owner: null, weeks: { 2027: 2, 2028: 3, 2029: 2, 2030: 3, 2031: 2, 2032: 3, 2033: 2 } },
    { id: 'B-2-2', serie: 'B', subserie: '2', number: '2', owner: null, weeks: { 2027: 3, 2028: 2, 2029: 3, 2030: 2, 2031: 3, 2032: 2, 2033: 3 } },
    { id: 'B-2-3', serie: 'B', subserie: '2', number: '3', owner: { name: 'Carmen López', email: 'carmen@example.com' }, weeks: { 2027: 2, 2028: 3, 2029: 2, 2030: 3, 2031: 2, 2032: 3, 2033: 2 } },
    { id: 'B-2-4', serie: 'B', subserie: '2', number: '4', owner: null, weeks: { 2027: 3, 2028: 2, 2029: 3, 2030: 2, 2031: 3, 2032: 2, 2033: 3 } },
    { id: 'B-3-1', serie: 'B', subserie: '3', number: '1', owner: null, weeks: { 2027: 4, 2028: 3, 2029: 4, 2030: 3, 2031: 4, 2032: 3, 2033: 4 } },
    { id: 'B-3-2', serie: 'B', subserie: '3', number: '2', owner: null, weeks: { 2027: 3, 2028: 4, 2029: 3, 2030: 4, 2031: 3, 2032: 4, 2033: 3 } },
    { id: 'B-3-3', serie: 'B', subserie: '3', number: '3', owner: null, weeks: { 2027: 4, 2028: 3, 2029: 4, 2030: 3, 2031: 4, 2032: 3, 2033: 4 } },
    { id: 'B-3-4', serie: 'B', subserie: '3', number: '4', owner: null, weeks: { 2027: 3, 2028: 4, 2029: 3, 2030: 4, 2031: 3, 2032: 4, 2033: 3 } },

    // Serie C
    { id: 'C-1-1', serie: 'C', subserie: '1', number: '1', owner: { name: 'Roberto García', email: 'roberto@example.com' }, weeks: { 2027: 3, 2028: 4, 2029: 3, 2030: 4, 2031: 3, 2032: 4, 2033: 3 } },
    { id: 'C-1-2', serie: 'C', subserie: '1', number: '2', owner: null, weeks: { 2027: 4, 2028: 3, 2029: 4, 2030: 3, 2031: 4, 2032: 3, 2033: 4 } },
    { id: 'C-1-3', serie: 'C', subserie: '1', number: '3', owner: null, weeks: { 2027: 3, 2028: 4, 2029: 3, 2030: 4, 2031: 3, 2032: 4, 2033: 3 } },
    { id: 'C-1-4', serie: 'C', subserie: '1', number: '4', owner: null, weeks: { 2027: 4, 2028: 3, 2029: 4, 2030: 3, 2031: 4, 2032: 3, 2033: 4 } },
    { id: 'C-2-1', serie: 'C', subserie: '2', number: '1', owner: null, weeks: { 2027: 2, 2028: 3, 2029: 2, 2030: 3, 2031: 2, 2032: 3, 2033: 2 } },
    { id: 'C-2-2', serie: 'C', subserie: '2', number: '2', owner: { name: 'Roberto García', email: 'roberto@example.com' }, weeks: { 2027: 3, 2028: 2, 2029: 3, 2030: 2, 2031: 3, 2032: 2, 2033: 3 } },
    { id: 'C-2-3', serie: 'C', subserie: '2', number: '3', owner: null, weeks: { 2027: 4, 2028: 3, 2029: 4, 2030: 3, 2031: 4, 2032: 3, 2033: 4 } },
    { id: 'C-2-4', serie: 'C', subserie: '2', number: '4', owner: null, weeks: { 2027: 3, 2028: 4, 2029: 3, 2030: 4, 2031: 3, 2032: 4, 2033: 3 } },
    { id: 'C-3-1', serie: 'C', subserie: '3', number: '1', owner: null, weeks: { 2027: 4, 2028: 3, 2029: 4, 2030: 3, 2031: 4, 2032: 3, 2033: 4 } },
    { id: 'C-3-2', serie: 'C', subserie: '3', number: '2', owner: null, weeks: { 2027: 3, 2028: 4, 2029: 3, 2030: 4, 2031: 3, 2032: 4, 2033: 3 } },
    { id: 'C-3-3', serie: 'C', subserie: '3', number: '3', owner: null, weeks: { 2027: 4, 2028: 3, 2029: 4, 2030: 3, 2031: 4, 2032: 3, 2033: 4 } },
    { id: 'C-3-4', serie: 'C', subserie: '3', number: '4', owner: null, weeks: { 2027: 3, 2028: 4, 2029: 3, 2030: 4, 2031: 3, 2032: 4, 2033: 3 } },

    // Serie D
    { id: 'D-1-1', serie: 'D', subserie: '1', number: '1', owner: { name: 'Patricia Hernández', email: 'patricia@example.com' }, weeks: { 2027: 2, 2028: 3, 2029: 2, 2030: 3, 2031: 2, 2032: 3, 2033: 2 } },
    { id: 'D-1-2', serie: 'D', subserie: '1', number: '2', owner: null, weeks: { 2027: 3, 2028: 2, 2029: 3, 2030: 2, 2031: 3, 2032: 2, 2033: 3 } },
    { id: 'D-1-3', serie: 'D', subserie: '1', number: '3', owner: null, weeks: { 2027: 4, 2028: 3, 2029: 4, 2030: 3, 2031: 4, 2032: 3, 2033: 4 } },
    { id: 'D-1-4', serie: 'D', subserie: '1', number: '4', owner: null, weeks: { 2027: 3, 2028: 4, 2029: 3, 2030: 4, 2031: 3, 2032: 4, 2033: 3 } },
    { id: 'D-2-1', serie: 'D', subserie: '2', number: '1', owner: null, weeks: { 2027: 2, 2028: 3, 2029: 2, 2030: 3, 2031: 2, 2032: 3, 2033: 2 } },
    { id: 'D-2-2', serie: 'D', subserie: '2', number: '2', owner: null, weeks: { 2027: 3, 2028: 2, 2029: 3, 2030: 2, 2031: 3, 2032: 2, 2033: 3 } },
    { id: 'D-2-3', serie: 'D', subserie: '2', number: '3', owner: null, weeks: { 2027: 4, 2028: 3, 2029: 4, 2030: 3, 2031: 4, 2032: 3, 2033: 4 } },
    { id: 'D-2-4', serie: 'D', subserie: '2', number: '4', owner: null, weeks: { 2027: 3, 2028: 4, 2029: 3, 2030: 4, 2031: 3, 2032: 4, 2033: 3 } },
    { id: 'D-3-1', serie: 'D', subserie: '3', number: '1', owner: null, weeks: { 2027: 4, 2028: 3, 2029: 4, 2030: 3, 2031: 4, 2032: 3, 2033: 4 } },
    { id: 'D-3-2', serie: 'D', subserie: '3', number: '2', owner: null, weeks: { 2027: 3, 2028: 4, 2029: 3, 2030: 4, 2031: 3, 2032: 4, 2033: 3 } },
    { id: 'D-3-3', serie: 'D', subserie: '3', number: '3', owner: null, weeks: { 2027: 4, 2028: 3, 2029: 4, 2030: 3, 2031: 4, 2032: 3, 2033: 4 } },
    { id: 'D-3-4', serie: 'D', subserie: '3', number: '4', owner: null, weeks: { 2027: 3, 2028: 4, 2029: 3, 2030: 4, 2031: 3, 2032: 4, 2033: 3 } },
  ];

  // Filtrar títulos
  const filteredTitles = allTitles.filter(title => {
    // Filtrar por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesId = title.id.toLowerCase().includes(search);
      const matchesOwner = title.owner?.name.toLowerCase().includes(search) || false;
      if (!matchesId && !matchesOwner) return false;
    }

    // Filtrar por serie
    if (filterSerie !== 'all' && title.serie !== filterSerie) {
      return false;
    }

    // Filtrar por estado
    if (filterStatus === 'assigned' && !title.owner) {
      return false;
    }
    if (filterStatus === 'available' && title.owner) {
      return false;
    }

    return true;
  });

  const totalTitles = allTitles.length;
  const assignedTitles = allTitles.filter(t => t.owner).length;
  const availableTitles = totalTitles - assignedTitles;
  const occupancyRate = ((assignedTitles / totalTitles) * 100).toFixed(1);

  const getSerieColor = (serie) => {
    return {
      'A': 'bg-serie-a',
      'B': 'bg-serie-b',
      'C': 'bg-serie-c',
      'D': 'bg-serie-d'
    }[serie];
  };

  const handleViewDetails = (title) => {
    setSelectedTitle(title);
    setShowDetailsModal(true);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Títulos</h1>
        <p className="text-gray-600 mt-1">
          Visualiza y administra todos los títulos del condominio
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{totalTitles}</p>
            <p className="text-gray-600 mt-1">Total de títulos</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{assignedTitles}</p>
            <p className="text-gray-600 mt-1">Asignados</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{availableTitles}</p>
            <p className="text-gray-600 mt-1">Disponibles</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{occupancyRate}%</p>
            <p className="text-gray-600 mt-1">Tasa de ocupación</p>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por título o propietario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Selector de año */}
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-600" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
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
      </Card>

      {/* Matriz de títulos agrupados por subserie */}
      <div className="space-y-6">
        {Object.keys(groupedTitles).sort().map((subserieKey) => {
          const titles = groupedTitles[subserieKey];
          const [serie, subserie] = subserieKey.split('-');
          
          return (
            <Card key={subserieKey}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Subserie {serie}-{subserie}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {titles.map((title) => (
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
                      {title.owner ? (
                        <CheckCircle size={18} className="text-green-700" />
                      ) : (
                        <XCircle size={18} className="text-gray-400" />
                      )}
                    </div>

                    {/* Semanas del año seleccionado - SIEMPRE visible */}
                    <div className="bg-white/40 backdrop-blur-sm rounded-lg p-2 mb-2 text-center">
                      <p className="text-2xl font-bold text-gray-900">{title.weeks[selectedYear]}</p>
                      <p className="text-xs text-gray-700">semanas en {selectedYear}</p>
                    </div>

                    {title.owner ? (
                      <div className="bg-white/30 backdrop-blur-sm rounded-lg p-2">
                        <p className="text-xs text-gray-700 mb-1">Propietario:</p>
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {title.owner.name}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white/30 backdrop-blur-sm rounded-lg p-2 text-center">
                        <p className="text-sm font-medium text-gray-700">
                          Disponible
                        </p>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(title);
                      }}
                      className="mt-3 w-full text-sm flex items-center justify-center gap-2"
                    >
                      <Eye size={14} />
                      Ver detalles
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}

        {filteredTitles.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <Home size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                No se encontraron títulos con los filtros aplicados
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Leyenda */}
      <Card className="mt-8">
        <h3 className="font-semibold text-gray-900 mb-4">Leyenda</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-serie-a rounded-lg"></div>
            <span className="text-sm text-gray-700">Serie A</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-serie-b rounded-lg"></div>
            <span className="text-sm text-gray-700">Serie B</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-serie-c rounded-lg"></div>
            <span className="text-sm text-gray-700">Serie C</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-serie-d rounded-lg"></div>
            <span className="text-sm text-gray-700">Serie D</span>
          </div>
        </div>
        <div className="flex items-center gap-6 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-green-700" />
            <span className="text-sm text-gray-700">Título asignado</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle size={18} className="text-gray-400" />
            <span className="text-sm text-gray-700">Título disponible</span>
          </div>
        </div>
      </Card>

      {/* Modal: Detalles del título */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`Detalles del título ${selectedTitle?.id}`}
        size="lg"
      >
        {selectedTitle && (
          <div className="space-y-4">
            <div className={`${getSerieColor(selectedTitle.serie)} rounded-lg p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <Home size={32} />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedTitle.id}</h3>
                  <p className="text-sm text-gray-700">
                    Serie {selectedTitle.serie} · Subserie {selectedTitle.subserie} · Número {selectedTitle.number}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white/30 backdrop-blur-sm rounded-lg p-3">
                <span className="text-sm text-gray-700">Estado:</span>
                <span className="font-semibold text-gray-900">
                  {selectedTitle.owner ? 'Asignado' : 'Disponible'}
                </span>
              </div>
            </div>

            {selectedTitle.owner ? (
              <>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User size={20} className="text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Propietario</h4>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-600">Nombre</p>
                      <p className="font-medium text-gray-900">{selectedTitle.owner.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Email</p>
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        <Mail size={14} />
                        {selectedTitle.owner.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={20} className="text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Semanas en {selectedYear}</h4>
                  </div>
                  <div className="text-center py-6 bg-white rounded-lg border border-gray-200">
                    <p className="text-5xl font-bold text-gray-900">{selectedTitle.weeks[selectedYear]}</p>
                    <p className="text-sm text-gray-600 mt-2">semanas asignadas</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <XCircle size={48} className="mx-auto text-blue-600 mb-3" />
                  <p className="font-medium text-blue-900">Título disponible</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Este título no está asignado a ningún usuario
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={20} className="text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Semanas en {selectedYear}</h4>
                  </div>
                  <div className="text-center py-6 bg-white rounded-lg border border-gray-200">
                    <p className="text-5xl font-bold text-gray-900">{selectedTitle.weeks[selectedYear]}</p>
                    <p className="text-sm text-gray-600 mt-2">semanas disponibles</p>
                  </div>
                </div>
              </>
            )}

            <div className="pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowDetailsModal(false)}
                fullWidth
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}