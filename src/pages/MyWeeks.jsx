import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Calendar, Download, Filter, RefreshCw, FileText, X } from 'lucide-react';
import { getTitlesByUser, getUserWeeksForYear } from '../services/titleService';
import { addDays, startOfYear, format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function MyWeeks() {
  const { user } = useAuth();
  const [userTitles, setUserTitles] = useState([]);
  const [userWeeks, setUserWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2027);
  const [filterType, setFilterType] = useState('all');
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const years = Array.from({ length: 10 }, (_, i) => 2027 + i);

  useEffect(() => {
    if (user) {
      loadUserWeeks();
    }
  }, [user, selectedYear]);

  const loadUserWeeks = async () => {
    try {
      setLoading(true);
      
      if (!user.titles || user.titles.length === 0) {
        setUserTitles([]);
        setUserWeeks([]);
        return;
      }

      const [titlesData, weeksData] = await Promise.all([
        getTitlesByUser(user.uid),
        getUserWeeksForYear(user.uid, selectedYear)
      ]);

      setUserTitles(titlesData);
      
      if (weeksData && weeksData.all && Array.isArray(weeksData.all)) {
        // Agregar fechas a cada semana
        const weeksWithDates = weeksData.all.map(week => ({
          ...week,
          startDate: getWeekStartDate(selectedYear, week.weekNumber),
          endDate: getWeekEndDate(selectedYear, week.weekNumber)
        }));
        setUserWeeks(weeksWithDates);
      } else if (Array.isArray(weeksData)) {
        const weeksWithDates = weeksData.map(week => ({
          ...week,
          startDate: getWeekStartDate(selectedYear, week.weekNumber),
          endDate: getWeekEndDate(selectedYear, week.weekNumber)
        }));
        setUserWeeks(weeksWithDates);
      } else {
        setUserWeeks([]);
      }
    } catch (error) {
      console.error('Error cargando semanas:', error);
      setUserWeeks([]);
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

  const getSerieColor = (titleId) => {
    if (!titleId) return 'bg-gray-200';
    const serie = typeof titleId === 'string' ? titleId.charAt(0) : titleId.serie;
    return {
      'A': 'bg-serie-a',
      'B': 'bg-serie-b',
      'C': 'bg-serie-c',
      'D': 'bg-serie-d'
    }[serie] || 'bg-gray-200';
  };

  const handleExport = () => {
    alert('Función de exportación próximamente');
  };

  const handleWeekClick = (week) => {
    setSelectedWeek(week);
    setShowDetailsModal(true);
  };

  const filteredWeeks = userWeeks.filter(week => {
    if (filterType === 'all') return true;
    if (filterType === 'regular') return week.type === 'regular';
    if (filterType === 'special') return week.type === 'special';
    return true;
  });

  const regularCount = userWeeks.filter(w => w.type === 'regular').length;
  const specialCount = userWeeks.filter(w => w.type === 'special').length;

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
        <h1 className="text-3xl font-bold text-gray-900">Mis Semanas</h1>
        <p className="text-gray-600 mt-1">
          Visualiza todas las semanas asignadas a tus títulos
        </p>
      </div>

      {userTitles.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Calendar size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tienes títulos asignados
            </h3>
            <p className="text-gray-600">
              Contacta al administrador para que te asigne un título del condominio.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Controles */}
          <Card className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-gray-600" />
                <label className="font-medium text-gray-700">Año:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-gray-500"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <Filter size={20} className="text-gray-600" />
                <label className="font-medium text-gray-700">Tipo:</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-gray-500"
                >
                  <option value="all">Todas ({userWeeks.length})</option>
                  <option value="regular">Regulares ({regularCount})</option>
                  <option value="special">VIP ({specialCount})</option>
                </select>
              </div>

              <Button variant="secondary" size="sm" onClick={handleExport} disabled>
                <Download size={16} className="mr-2" />
                Exportar
              </Button>
            </div>
          </Card>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{userTitles.length}</p>
                <p className="text-sm text-gray-600 mt-1">Títulos</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{userWeeks.length}</p>
                <p className="text-sm text-gray-600 mt-1">Total Semanas</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{regularCount}</p>
                <p className="text-sm text-gray-600 mt-1">Regulares</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{specialCount}</p>
                <p className="text-sm text-gray-600 mt-1">VIP</p>
              </div>
            </Card>
          </div>

          {/* Lista de semanas con fechas completas */}
          <Card>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Semanas en {selectedYear}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Mostrando {filteredWeeks.length} de {userWeeks.length} semanas
              </p>
            </div>

            {filteredWeeks.length === 0 ? (
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">
                  No hay semanas disponibles
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredWeeks.map((week, index) => {
                  if (!week || typeof week.weekNumber === 'undefined') return null;

                  const isSpecial = week.type === 'special';
                  const colorClass = getSerieColor(week.titleId);

                  return (
                    <div
                      key={`${week.titleId}-${week.weekNumber}-${index}`}
                      onClick={() => handleWeekClick(week)}
                      className={`${colorClass} rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${
                        isSpecial ? 'ring-2 ring-orange-400' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xl font-bold text-gray-800">
                              Semana {week.weekNumber}
                            </span>
                            
                            <span className="text-sm text-gray-700 font-medium">
                              ({week.startDate} - {week.endDate})
                            </span>
                            
                            {isSpecial && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-500 text-white">
                                ⭐ VIP: {week.specialName || week.specialType}
                              </span>
                            )}
                            {!isSpecial && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-600 text-white">
                                Regular
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-700 mt-2">
                            🎫 Título: <strong>{week.titleId}</strong>
                          </p>
                        </div>

                        <div className="flex items-center">
                          <button className="p-2 hover:bg-white/50 rounded-full transition-colors">
                            <FileText size={20} className="text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Modal de detalles */}
      {showDetailsModal && selectedWeek && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetailsModal(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                Detalles de la Semana
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Título</label>
                  <p className="text-lg font-bold text-gray-900">{selectedWeek.titleId}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Número de Semana</label>
                  <p className="text-lg font-bold text-gray-900">{selectedWeek.weekNumber}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Tipo</label>
                <p className="text-lg font-bold text-gray-900">
                  {selectedWeek.type === 'special' 
                    ? `⭐ VIP: ${selectedWeek.specialName || selectedWeek.specialType}` 
                    : 'Regular'
                  }
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="text-sm font-semibold text-blue-800 block mb-2">
                  📅 Fechas
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Inicio (Lunes)</p>
                    <p className="text-lg font-bold text-blue-900">{selectedWeek.startDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Fin (Domingo)</p>
                    <p className="text-lg font-bold text-blue-900">{selectedWeek.endDate}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Año</label>
                <p className="text-lg font-bold text-gray-900">{selectedYear}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50">
              <Button
                onClick={() => setShowDetailsModal(false)}
                className="w-full"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}