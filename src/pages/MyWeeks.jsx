import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Calendar, Download, Filter, RefreshCw } from 'lucide-react';
import { getTitlesByUser, getUserWeeksForYear } from '../services/titleService';

export default function MyWeeks() {
  const { user } = useAuth();
  const [userTitles, setUserTitles] = useState([]);
  const [userWeeks, setUserWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2027);
  const [filterType, setFilterType] = useState('all'); // all, regular, special

  const years = Array.from({ length: 10 }, (_, i) => 2027 + i); // 2027-2036

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

      // Cargar títulos y semanas
      const [titlesData, weeksData] = await Promise.all([
        getTitlesByUser(user.uid),
        getUserWeeksForYear(user.uid, selectedYear)
      ]);

      setUserTitles(titlesData);
      
      // ✅ FIX: Extraer el array 'all' que contiene regulares + especiales
      if (weeksData && weeksData.all && Array.isArray(weeksData.all)) {
        setUserWeeks(weeksData.all);
      } else if (Array.isArray(weeksData)) {
        setUserWeeks(weeksData);
      } else {
        console.warn('Formato de weeksData no esperado:', weeksData);
        setUserWeeks([]);
      }
    } catch (error) {
      console.error('Error cargando semanas:', error);
      setUserWeeks([]);
    } finally {
      setLoading(false);
    }
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

  // ✅ FIX: Filtrar por tipo (all, regular, special)
  const filteredWeeks = userWeeks.filter(week => {
    if (filterType === 'all') return true;
    if (filterType === 'regular') return week.type === 'regular';
    if (filterType === 'special') return week.type === 'special';
    return true;
  });

  // Contar semanas por tipo
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

      {/* Si no tiene títulos */}
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
          {/* Controles y Filtros */}
          <Card className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Selector de año */}
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-gray-600" />
                <label className="font-medium text-gray-700">Año:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Filtro por tipo */}
              <div className="flex items-center gap-3">
                <Filter size={20} className="text-gray-600" />
                <label className="font-medium text-gray-700">Tipo:</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  <option value="all">Todas ({userWeeks.length})</option>
                  <option value="regular">Regulares ({regularCount})</option>
                  <option value="special">VIP ({specialCount})</option>
                </select>
              </div>

              {/* Botón exportar (deshabilitado por ahora) */}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExport}
                disabled
              >
                <Download size={16} className="mr-2" />
                Exportar
              </Button>
            </div>
          </Card>

          {/* Estadísticas rápidas */}
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

          {/* Lista de semanas */}
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
                  No hay semanas {filterType === 'regular' ? 'regulares' : filterType === 'special' ? 'VIP' : ''} para este año
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredWeeks.map((week, index) => {
                  // ✅ Validar semana
                  if (!week || typeof week.weekNumber === 'undefined') {
                    console.warn('Semana inválida:', week);
                    return null;
                  }

                  const isSpecial = week.type === 'special';
                  const colorClass = getSerieColor(week.titleId);

                  return (
                    <div
                      key={`${week.titleId}-${week.weekNumber}-${week.type}-${index}`}
                      className={`${colorClass} rounded-lg p-4 transition-all hover:shadow-md ${
                        isSpecial ? 'ring-2 ring-orange-500 ring-opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <p className="text-lg font-bold text-gray-900">
                              Semana {week.weekNumber}
                            </p>
                            
                            {/* ✅ Badge VIP para semanas especiales */}
                            {isSpecial && (
                              <span className="px-3 py-1 bg-orange-500 text-white text-sm font-bold rounded-full flex items-center gap-1">
                                ⭐ VIP: {week.specialName || week.specialType}
                              </span>
                            )}
                            
                            {/* Badge de tipo regular */}
                            {!isSpecial && (
                              <span className="px-2 py-0.5 bg-gray-600 text-white text-xs font-semibold rounded">
                                Regular
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-700">
                            <span className="font-medium">
                              📍 Título: {week.titleId}
                            </span>
                            {week.fecha && (
                              <span className="text-gray-600">
                                📅 {week.fecha}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Indicador visual de tipo */}
                        <div className="flex-shrink-0 ml-4">
                          {isSpecial ? (
                            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl">
                              ⭐
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center text-white">
                              <Calendar size={24} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }).filter(Boolean)}
              </div>
            )}
          </Card>

          {/* Leyenda */}
          <Card className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Leyenda</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-serie-a rounded"></div>
                <span>Serie A</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-serie-b rounded"></div>
                <span>Serie B</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-serie-c rounded"></div>
                <span>Serie C</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-serie-d rounded"></div>
                <span>Serie D</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded">⭐ VIP</span>
                <span>Semana especial</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-gray-600 text-white text-xs font-semibold rounded">Regular</span>
                <span>Semana regular</span>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}