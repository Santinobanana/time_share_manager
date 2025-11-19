import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import { Calendar, Home, RefreshCw } from 'lucide-react';
import { getTitlesByUser, getUserWeeksForYear } from '../services/titleService';

export default function Dashboard() {
  const { user } = useAuth();
  const [userTitles, setUserTitles] = useState([]);
  const [userWeeks, setUserWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentYear = 2027;

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      if (!user.titles || user.titles.length === 0) {
        setUserTitles([]);
        setUserWeeks([]);
        return;
      }

      // Cargar títulos del usuario
      const titlesData = await getTitlesByUser(user.uid);
      setUserTitles(titlesData);

      // Cargar semanas del año actual
      const weeksData = await getUserWeeksForYear(user.uid, currentYear);
      
      // ✅ FIX: Manejar diferentes formatos de weeksData
      if (weeksData) {
        // Si viene como objeto con propiedades 'regular', 'special', 'all'
        if (weeksData.all && Array.isArray(weeksData.all)) {
          setUserWeeks(weeksData.all);
        } 
        // Si viene como array directamente
        else if (Array.isArray(weeksData)) {
          setUserWeeks(weeksData);
        }
        // Si viene como objeto sin 'all'
        else if (typeof weeksData === 'object') {
          // Intentar extraer arrays
          const allWeeks = [
            ...(weeksData.regular || []),
            ...(weeksData.special || [])
          ];
          setUserWeeks(allWeeks);
        }
        else {
          console.warn('Formato de weeksData no reconocido:', weeksData);
          setUserWeeks([]);
        }
      } else {
        setUserWeeks([]);
      }
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
      setUserWeeks([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: Calcular próxima semana con validación robusta
  const getNextWeek = () => {
    // Validar que userWeeks existe y es array
    if (!userWeeks || !Array.isArray(userWeeks) || userWeeks.length === 0) {
      return null;
    }
    
    // Validar que la primera semana tiene los campos necesarios
    const firstWeek = userWeeks[0];
    if (!firstWeek || typeof firstWeek.weekNumber === 'undefined') {
      console.warn('Primera semana no tiene formato válido:', firstWeek);
      return null;
    }
    
    return {
      weekNumber: firstWeek.weekNumber,
      title: firstWeek.titleId || 'N/A',
      daysUntil: '...' // Cálculo de días pendiente
    };
  };

  const nextWeek = getNextWeek();

  const getSerieColor = (title) => {
    // Manejar diferentes formatos de title
    const serieChar = typeof title === 'string' 
      ? title.charAt(0) 
      : title?.serie || (title?.titleId ? title.titleId.charAt(0) : null);
    
    return {
      'A': 'bg-serie-a',
      'B': 'bg-serie-b',
      'C': 'bg-serie-c',
      'D': 'bg-serie-d'
    }[serieChar] || 'bg-gray-200';
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido, {user?.name}
        </h1>
        <p className="text-gray-600 mt-1">
          {userTitles.length > 0 
            ? `Aquí está el resumen de tus ${userTitles.length} título${userTitles.length > 1 ? 's' : ''}`
            : 'Aún no tienes títulos asignados'}
        </p>
      </div>

      {/* Si no tiene títulos */}
      {userTitles.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Home size={64} className="mx-auto text-gray-300 mb-4" />
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
          {/* Próxima semana - Card destacada */}
          {nextWeek && (
            <Card className="mb-8 bg-gradient-to-r from-gray-700 to-gray-800 text-white border-none">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="text-white" size={24} />
                    <h2 className="text-2xl font-bold">Tu próxima semana</h2>
                  </div>
                  <div className="space-y-2">
                    <p className="text-3xl font-bold">
                      Semana {nextWeek.weekNumber}
                    </p>
                    <p className="text-lg text-gray-300">
                      🏠 Título: {nextWeek.title}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3">
                    <p className="text-sm text-gray-200">Año</p>
                    <p className="text-4xl font-bold">{currentYear}</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calendario */}
            <Card title={`Calendario ${currentYear}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">
                      Vista de calendario próximamente
                    </p>
                  </div>
                </div>
                
                {/* Leyenda */}
                <div className="grid grid-cols-2 gap-2 text-sm">
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
                </div>
              </div>
            </Card>

            {/* Lista de semanas */}
            <Card 
              title={`Tus semanas en ${currentYear}`} 
              subtitle={`${userWeeks.length} semana${userWeeks.length !== 1 ? 's' : ''} asignada${userWeeks.length !== 1 ? 's' : ''}`}
            >
              {userWeeks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay semanas asignadas para este año</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {userWeeks.map((week, index) => {
                    // ✅ FIX: Validar que week tiene los campos necesarios
                    if (!week || typeof week.weekNumber === 'undefined') {
                      console.warn('Semana inválida en índice', index, week);
                      return null;
                    }

                    const colorClass = getSerieColor(week.titleId || week);
                    const isSpecial = week.type === 'special';
                    
                    return (
                      <div
                        key={`${week.titleId}-${week.weekNumber}-${index}`}
                        className={`${colorClass} rounded-lg p-4 flex items-center justify-between ${
                          isSpecial ? 'ring-2 ring-orange-400' : ''
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">
                              Semana {week.weekNumber}
                            </p>
                            {isSpecial && (
                              <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded">
                                VIP: {week.specialName || week.specialType}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mt-1">
                            Título: {week.titleId || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600">
                            {isSpecial ? '⭐ Especial' : 'Regular'}
                          </p>
                        </div>
                      </div>
                    );
                  }).filter(Boolean)} {/* Filtrar nulls */}
                </div>
              )}
            </Card>
          </div>

          {/* Información adicional */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {userTitles.length}
                </p>
                <p className="text-gray-600 mt-1">Título{userTitles.length !== 1 ? 's' : ''} en propiedad</p>
              </div>
            </Card>

            <Card>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-gray-600 mt-1">Intercambios pendientes</p>
              </div>
            </Card>

            <Card>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {userWeeks.length}
                </p>
                <p className="text-gray-600 mt-1">Semanas este año</p>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}