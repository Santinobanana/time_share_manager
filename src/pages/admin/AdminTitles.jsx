import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import PDFDownloadButton from '../../components/common/PDFDownloadButton';
import { Sparkles } from 'lucide-react';
import AnnualWeeksCalendar from '../../components/admin/AnnualWeeksCalendar';
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
import { format, addDays, startOfYear } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminTitles() {
  const { user } = useAuth();
  
  const [titles, setTitles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSerie, setFilterSerie] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // ✅ CORRECCIÓN: Inicializar con año actual en lugar de null
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [titleOwner, setTitleOwner] = useState(null);
  const [showAnnualCalendar, setShowAnnualCalendar] = useState(false);

  // Generar años dinámicamente
  const years = Array.from({ length: 12 }, (_, i) => currentYear + i);

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

  /**
   * Calcular fecha de inicio de semana (Domingo) - Sistema ISO
   */
  const getWeekStartDate = (year, weekNumber) => {
    if (weekNumber === 51) {
      const christmas = new Date(year, 11, 25);
      const christmasDayOfWeek = christmas.getDay();
      const daysToSunday = christmasDayOfWeek === 0 ? 14 : (christmasDayOfWeek + 7);
      const week51Start = new Date(year, 11, 25 - daysToSunday);
      return format(week51Start, 'dd/MM', { locale: es });
    }
    
    const firstDayOfYear = new Date(year, 0, 1);
    let primerDomingo = new Date(firstDayOfYear);
    const diaSemana = primerDomingo.getDay();
    
    if (diaSemana !== 0) {
      primerDomingo.setDate(primerDomingo.getDate() + (7 - diaSemana));
    }
    
    const diasDesdeInicio = (weekNumber - 1) * 7;
    const weekStart = addDays(primerDomingo, diasDesdeInicio);
    
    return format(weekStart, 'dd/MM', { locale: es });
  };

  /**
   * Calcular fecha de fin de semana (Sábado) - Sistema ISO
   */
  const getWeekEndDate = (year, weekNumber) => {
    if (weekNumber === 51) {
      const christmas = new Date(year, 11, 25);
      const christmasDayOfWeek = christmas.getDay();
      const daysToSunday = christmasDayOfWeek === 0 ? 14 : (christmasDayOfWeek + 7);
      const week51End = new Date(year, 11, 25 - daysToSunday + 6);
      return format(week51End, 'dd/MM', { locale: es });
    }
    
    const firstDayOfYear = new Date(year, 0, 1);
    let primerDomingo = new Date(firstDayOfYear);
    const diaSemana = primerDomingo.getDay();
    
    if (diaSemana !== 0) {
      primerDomingo.setDate(primerDomingo.getDate() + (7 - diaSemana));
    }
    
    const diasDesdeInicio = (weekNumber - 1) * 7 + 6;
    const weekEnd = addDays(primerDomingo, diasDesdeInicio);
    
    return format(weekEnd, 'dd/MM', { locale: es });
  };

  const filteredTitles = titles.filter(title => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesId = title.id.toLowerCase().includes(search);
      if (!matchesId) return false;
    }

    if (filterSerie !== 'all' && title.serie !== filterSerie) {
      return false;
    }

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
    const { enrichTitleWithLeapWeeks } = await import('../../services/titleLeapWeeksHelper');
    const enrichedTitle = await enrichTitleWithLeapWeeks(title);
    
    setSelectedTitle(enrichedTitle);
    setShowDetailsModal(true);
    
    if (enrichedTitle.ownerId) {
      try {
        const owner = await getTitleOwner(enrichedTitle.id);
        setTitleOwner(owner);
      } catch (error) {
        console.error('Error cargando dueño:', error);
        setTitleOwner(null);
      }
    } else {
      setTitleOwner(null);
    }
  };

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
          <p className="text-gray-600 mt-1">Administra todos los títulos del sistema</p>
        </div>

        <Button 
          onClick={() => setShowAnnualCalendar(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Sparkles size={20} className="mr-2" />
          Calendario de Semanas
        </Button>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Home size={32} className="text-gray-400" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Asignados</p>
                <p className="text-3xl font-bold text-green-600">{stats.assigned}</p>
              </div>
              <CheckCircle size={32} className="text-green-400" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Disponibles</p>
                <p className="text-3xl font-bold text-blue-600">{stats.available}</p>
              </div>
              <XCircle size={32} className="text-blue-400" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">% Asignados</p>
                <p className="text-3xl font-bold text-gray-900">{stats.percentAssigned}%</p>
              </div>
            </div>
          </Card>

          <Card>
            <div>
              <p className="text-sm text-gray-600 mb-2">Por Serie</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-serie-a rounded px-2 py-1 font-medium">A: {stats.bySerie.A}</div>
                <div className="bg-serie-b rounded px-2 py-1 font-medium">B: {stats.bySerie.B}</div>
                <div className="bg-serie-c rounded px-2 py-1 font-medium">C: {stats.bySerie.C}</div>
                <div className="bg-serie-d rounded px-2 py-1 font-medium">D: {stats.bySerie.D}</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por ID (ej: A-1-1)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filterSerie}
              onChange={(e) => setFilterSerie(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none appearance-none"
            >
              <option value="all">Todas las series</option>
              <option value="A">Serie A</option>
              <option value="B">Serie B</option>
              <option value="C">Serie C</option>
              <option value="D">Serie D</option>
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none appearance-none"
            >
              <option value="all">Todos los estados</option>
              <option value="assigned">Asignados</option>
              <option value="available">Disponibles</option>
            </select>
          </div>
        </div>

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

                    <div className="bg-white/40 backdrop-blur-sm rounded-lg p-2 mb-2 text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {title.weeksByYear?.[selectedYear] || '-'}
                      </p>
                      <p className="text-xs text-gray-700">semana en {selectedYear}</p>
                    </div>

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
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle size={16} />
                        Asignado
                      </span>
                    ) : (
                      <span className="text-gray-600 flex items-center gap-1">
                        <XCircle size={16} />
                        Disponible
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Propietario */}
            {titleOwner && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Propietario
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <User size={20} className="text-gray-600" />
                    <span className="font-medium text-gray-900">{titleOwner.name}</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">{titleOwner.email}</p>
                  {titleOwner.phone && (
                    <p className="text-sm text-gray-600 ml-8">{titleOwner.phone}</p>
                  )}
                </div>
              </div>
            )}

            {/* Semanas CON FECHAS - UNA CARD POR SEMANA */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Semanas Asignadas (Próximos 12 años)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(() => {
                  const currentYear = new Date().getFullYear();
                  
                  const yearsInWeeksByYear = selectedTitle.weeksByYear 
                    ? Object.keys(selectedTitle.weeksByYear).map(Number)
                    : [];
                  
                  const yearsInSpecialWeeks = selectedTitle.specialWeeksByYear
                    ? Object.keys(selectedTitle.specialWeeksByYear).map(Number)
                    : [];
                  
                  const allAvailableYears = [...new Set([...yearsInWeeksByYear, ...yearsInSpecialWeeks])];
                  
                  const futureYears = allAvailableYears
                    .filter(year => year >= currentYear)
                    .sort((a, b) => a - b);
                  
                  const yearsToShow = futureYears.slice(0, 12);
                  
                  return yearsToShow.flatMap(year => {
                    const weekCards = [];
                    const weekNumber = selectedTitle.weeksByYear?.[year];
                    const specialWeeks = selectedTitle.specialWeeksByYear?.[year] || [];
                    
                    if (weekNumber) {
                      weekCards.push(
                        <div key={`${year}-regular`} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-gray-600">{year}</p>
                            <p className="text-xl font-bold text-gray-900">{weekNumber}</p>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="flex justify-between">
                              <span>Inicio:</span>
                              <span className="font-medium">{getWeekStartDate(year, weekNumber)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Fin:</span>
                              <span className="font-medium">{getWeekEndDate(year, weekNumber)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    specialWeeks.forEach((special, idx) => {
                      const isVIP = ['NAVIDAD', 'FIN_ANO', 'SANTA', 'PASCUA'].includes(special.type);
                      const isBisiesta = special.type === 'BISIESTA';
                      
                      weekCards.push(
                        <div 
                          key={`${year}-special-${idx}`} 
                          className={`rounded-lg p-3 ${
                            isBisiesta 
                              ? 'bg-purple-50 border-2 border-purple-300' 
                              : 'bg-orange-50 border-2 border-orange-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1">
                              <p className="text-xs font-semibold text-gray-600">{year}</p>
                              {isBisiesta && <span className="text-purple-600">🎰</span>}
                              {isVIP && <span className="text-orange-600">⭐</span>}
                            </div>
                            <p className="text-xl font-bold text-gray-900">{special.week}</p>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="flex justify-between">
                              <span>Inicio:</span>
                              <span className="font-medium">{getWeekStartDate(year, special.week)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Fin:</span>
                              <span className="font-medium">{getWeekEndDate(year, special.week)}</span>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-300">
                            <p className={`text-xs font-semibold ${
                              isBisiesta ? 'text-purple-700' : 'text-orange-700'
                            }`}>
                              {isBisiesta ? '🎰 Semana 53 (Bisiesta)' : `⭐ Semana VIP`}
                            </p>
                          </div>
                        </div>
                      );
                    });
                    
                    return weekCards;
                  });
                })()}
              </div>
            </div>

            {/* Botón descargar PDF */}
            <div className="pt-4 border-t">
              <PDFDownloadButton
                data={selectedTitle}
                userName={titleOwner?.name || ''}
                variant="primary"
                size="md"
                className="w-full"
                label="Descargar calendario completo (hasta 2100)"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Calendario de Semanas */}
      <AnnualWeeksCalendar
        isOpen={showAnnualCalendar}
        onClose={() => setShowAnnualCalendar(false)}
        year={selectedYear}
        titles={titles}
        onSuccess={() => {
          setShowAnnualCalendar(false);
          loadData();
        }}
        currentUserId={user?.uid}
      />
    </div>
  );
}