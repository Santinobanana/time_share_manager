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

  const years = [2027, 2028, 2029, 2030, 2031, 2032, 2033];

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
      setUserWeeks(weeksData.all || []);
    } catch (error) {
      console.error('Error cargando semanas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSerieColor = (titleId) => {
    const serie = titleId?.charAt(0);
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

  // Filtrar semanas (por ahora solo tenemos regulares, las especiales se implementarán después)
  const filteredWeeks = userWeeks;

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
          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {userTitles.length}
                </p>
                <p className="text-gray-600 mt-1">Títulos</p>
              </div>
            </Card>

            <Card>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {filteredWeeks.length}
                </p>
                <p className="text-gray-600 mt-1">Semanas regulares</p>
              </div>
            </Card>

            <Card>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">0</p>
                <p className="text-gray-600 mt-1">Semanas especiales</p>
              </div>
            </Card>
          </div>

          {/* Filtros y acciones */}
          <Card className="mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
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

                <div className="flex items-center gap-2">
                  <Filter size={20} className="text-gray-600" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  >
                    <option value="all">Todas las semanas</option>
                    <option value="regular">Solo regulares</option>
                    <option value="special">Solo especiales</option>
                  </select>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <Download size={16} />
                Exportar
              </Button>
            </div>
          </Card>

          {/* Lista de semanas */}
          <Card 
            title={`Semanas en ${selectedYear}`}
            subtitle={`${filteredWeeks.length} semanas`}
          >
            {filteredWeeks.length === 0 ? (
              <div className="text-center py-12">
                <Calendar size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">
                  No hay semanas asignadas para este año
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredWeeks.map((week, index) => {
                  const colorClass = getSerieColor(week.titleId);
                  
                  return (
                    <div
                      key={index}
                      className={`${colorClass} rounded-lg p-4`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Semana {week.weekNumber}
                            </h3>
                          </div>
                          <p className="text-gray-700 text-sm">
                            Título: {week.titleId}
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="bg-white/30 backdrop-blur-sm rounded-lg px-4 py-2">
                            <p className="text-sm text-gray-700 font-medium">
                              {selectedYear}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Información adicional */}
          <div className="mt-8">
            <Card>
              <div className="flex items-start gap-4">
                <div className="bg-gray-100 rounded-lg p-3">
                  <Calendar size={24} className="text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Sobre tus semanas asignadas
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Las semanas regulares rotan cada año según tu título</li>
                    <li>• Las semanas especiales (Santa, Pascua, Navidad, Fin de Año) se asignan por serie</li>
                    <li>• Puedes intercambiar semanas con otros usuarios en la sección de Intercambios</li>
                    <li>• Los intercambios son válidos solo para el año en curso</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}