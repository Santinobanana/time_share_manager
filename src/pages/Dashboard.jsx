import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import WeeksCalendar from '../components/dashboard/WeeksCalendar';
import { Calendar, Home, RefreshCw } from 'lucide-react';
import { getTitlesByUser, getUserWeeksForYear } from '../services/titleService';
import { addDays, startOfYear, format } from 'date-fns';
import { es } from 'date-fns/locale';
// ✅ NUEVA IMPORTACIÓN: Funciones centralizadas de cálculo de fechas
import {
  getFechaInicioSemana,
  getFechaFinSemana
} from '../services/weekCalculationService';


export default function Dashboard() {
  const { user } = useAuth();
  const [userTitles, setUserTitles] = useState([]);
  const [userWeeks, setUserWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ CORRECCIÓN 1: Usar año actual
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // ✅ Generar años dinámicamente desde año actual
  const years = Array.from({ length: 12 }, (_, i) => currentYear + i);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user, selectedYear]);

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
      
      // ✅ Enriquecer títulos con semanas bisiestas
      const { enrichTitleWithLeapWeeks } = await import('../services/titleLeapWeeksHelper');
      const enrichedTitles = await Promise.all(
        titlesData.map(title => enrichTitleWithLeapWeeks(title))
      );
      
      setUserTitles(enrichedTitles);

      // Cargar semanas del usuario para el año seleccionado
      const weeksData = await getUserWeeksForYear(user.uid, selectedYear);
      
      // ✅ Procesar semanas y agregar semanas bisiestas manualmente
      let allWeeks = [];
      
      if (weeksData) {
        if (weeksData.all && Array.isArray(weeksData.all)) {
          allWeeks = weeksData.all;
        } else if (Array.isArray(weeksData)) {
          allWeeks = weeksData;
        } else if (typeof weeksData === 'object') {
          allWeeks = [
            ...(weeksData.regular || []),
            ...(weeksData.special || [])
          ];
        }
      }
      
      // ✅ NUEVO: Agregar semanas bisiestas de los títulos enriquecidos
      enrichedTitles.forEach(title => {
        if (title.specialWeeksByYear && title.specialWeeksByYear[selectedYear]) {
          title.specialWeeksByYear[selectedYear].forEach(specialWeek => {
            // Solo agregar si es semana bisiesta (BISIESTA)
            if (specialWeek.type === 'BISIESTA') {
              // Verificar que no esté ya en la lista
              const exists = allWeeks.some(
                w => w.titleId === title.id && w.weekNumber === specialWeek.week
              );
              
              if (!exists) {
                allWeeks.push({
                  titleId: title.id,
                  serie: title.serie,
                  subserie: title.subserie,
                  number: title.number,
                  weekNumber: specialWeek.week,
                  type: 'special',
                  specialType: 'BISIESTA',
                  specialName: 'Rifa'
                });
              }
            }
          });
        }
      });
      
      // ✅ CORRECCIÓN CRÍTICA: Usar funciones centralizadas y formatear
      const weeksWithDates = allWeeks.map(week => ({
        ...week,
        startDate: format(getFechaInicioSemana(selectedYear, week.weekNumber), 'dd/MM/yyyy', { locale: es }),
        endDate: format(getFechaFinSemana(selectedYear, week.weekNumber), 'dd/MM/yyyy', { locale: es })
      }));
      
      setUserWeeks(weeksWithDates);
      
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
      setUserWeeks([]);
    } finally {
      setLoading(false);
    }
  };

  // ❌ ELIMINADAS: getWeekStartDate y getWeekEndDate fueron eliminadas de aquí
  // ... (código previo a línea 110)

  const getNextWeek = () => {
    if (!userWeeks || !Array.isArray(userWeeks) || userWeeks.length === 0) {
      return null;
    }
    
    const firstWeek = userWeeks[0];
    if (!firstWeek || typeof firstWeek.weekNumber === 'undefined') {
      return null;
    }
    
    return firstWeek;
  };

  const getSerieColor = (title) => {
    const serieChar = typeof title === 'string' 
      ? title.charAt(0) 
      : title?.serie || title?.id?.charAt(0);
    
    return {
      'A': 'bg-serie-a',
      'B': 'bg-serie-b',
      'C': 'bg-serie-c',
      'D': 'bg-serie-d'
    }[serieChar] || 'bg-gray-200';
  };

  const nextWeek = getNextWeek();

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
        <div className="space-y-8">
          {/* Próxima semana */}
          {nextWeek && (
            <Card>
              <div className="flex items-center gap-4">
                <div className="bg-gray-700 rounded-full p-3">
                  <Home size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm text-gray-600">Tu próxima semana</h3>
                  <div className="flex items-baseline gap-3 mt-1">
                    <p className="text-3xl font-bold text-gray-900">
                      Semana {nextWeek.weekNumber}
                    </p>
                    <span className="text-gray-500">Año {selectedYear}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                    <span>🏠 Título: {nextWeek.titleId}</span>
                    <span>📅 {nextWeek.startDate} - {nextWeek.endDate}</span>
                    {nextWeek.type === 'special' && (
                      <span className="text-orange-600 font-medium">
                        ⭐ {nextWeek.specialName || 'Semana VIP'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Selector de año */}
          <Card>
            <div className="flex items-center gap-4">
              <Calendar size={20} className="text-gray-700" />
              <label className="text-sm font-medium text-gray-700">Ver año:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-gray-500"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calendario */}
            <Card title={`Calendario ${selectedYear}`}>
              <WeeksCalendar 
                userWeeks={userWeeks} 
                currentYear={selectedYear}
              />
            </Card>

            {/* Lista de semanas */}
            <Card 
              title={`Tus semanas en ${selectedYear}`} 
              subtitle={`${userWeeks.length} semana${userWeeks.length !== 1 ? 's' : ''} asignada${userWeeks.length !== 1 ? 's' : ''}`}
            >
              {userWeeks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay semanas asignadas para este año</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {userWeeks.map((week, index) => {
                    if (!week || typeof week.weekNumber === 'undefined') {
                      return null;
                    }

                    const colorClass = getSerieColor(week.titleId || week);
                    const isSpecial = week.type === 'special';
                    const isBisiesta = week.specialType === 'BISIESTA';
                    
                    return (
                      <div
                        key={`${week.titleId}-${week.weekNumber}-${index}`}
                        className={`${colorClass} rounded-lg p-4 flex items-center justify-between ${
                          isSpecial ? 'border-l-4 border-orange-500' : ''
                        } ${isBisiesta ? 'border-l-4 border-purple-500' : ''}`}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-lg">Semana {week.weekNumber}</p>
                            {isBisiesta && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                🎰 Rifa
                              </span>
                            )}
                            {isSpecial && !isBisiesta && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                                ⭐ {week.specialName || week.specialType}
                              </span>
                            )}
                          </div>
                          <p className="text-sm">Título: {week.titleId}</p>
                          <p className="text-xs mt-1 opacity-75">
                            📅 {week.startDate} - {week.endDate}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600">
                            {isSpecial ? (isBisiesta ? 'Rifa' : 'Especial') : 'Regular'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Resumen de títulos */}
          <Card title="Tus títulos">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {userTitles.map((title) => (
                <div
                  key={title.id}
                  className={`${getSerieColor(title)} rounded-lg p-4 text-center`}
                >
                  <Home size={24} className="mx-auto mb-2" />
                  <p className="font-bold">{title.id}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}