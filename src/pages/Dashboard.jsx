import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import WeeksCalendar from '../components/dashboard/WeeksCalendar';
import { Calendar, Home, RefreshCw } from 'lucide-react';
import { getTitlesByUser, getUserWeeksForYear } from '../services/titleService';
import { addDays, startOfYear, format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Dashboard() {
  const { user } = useAuth();
  const [userTitles, setUserTitles] = useState([]);
  const [userWeeks, setUserWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2027);

  const years = [2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];

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

      const titlesData = await getTitlesByUser(user.uid);
      setUserTitles(titlesData);

      const weeksData = await getUserWeeksForYear(user.uid, selectedYear);
      
      if (weeksData) {
        if (weeksData.all && Array.isArray(weeksData.all)) {
          // Agregar fechas calculadas
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
        } else if (typeof weeksData === 'object') {
          const allWeeks = [
            ...(weeksData.regular || []),
            ...(weeksData.special || [])
          ].map(week => ({
            ...week,
            startDate: getWeekStartDate(selectedYear, week.weekNumber),
            endDate: getWeekEndDate(selectedYear, week.weekNumber)
          }));
          setUserWeeks(allWeeks);
        } else {
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

  const getWeekStartDate = (year, weekNumber) => {
    const firstDayOfYear = startOfYear(new Date(year, 0, 1));
    const daysToAdd = (weekNumber - 1) * 7;
    const weekStart = addDays(firstDayOfYear, daysToAdd);
    
    const dayOfWeek = weekStart.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = addDays(weekStart, daysUntilMonday);
    
    return format(monday, 'dd/MM/yyyy', { locale: es });
  };

  const getWeekEndDate = (year, weekNumber) => {
    const firstDayOfYear = startOfYear(new Date(year, 0, 1));
    const daysToAdd = (weekNumber - 1) * 7 + 6;
    const weekEnd = addDays(firstDayOfYear, daysToAdd);
    
    const dayOfWeek = weekEnd.getDay();
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const sunday = addDays(weekEnd, daysUntilSunday);
    
    return format(sunday, 'dd/MM/yyyy', { locale: es });
  };

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
        <>
          {/* Próxima semana */}
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
                      🏠 Título: {nextWeek.titleId}
                    </p>
                    {nextWeek.startDate && (
                      <p className="text-sm text-gray-300">
                        📅 {nextWeek.startDate} - {nextWeek.endDate}
                      </p>
                    )}
                    {nextWeek.type === 'special' && (
                      <p className="text-sm bg-orange-500 inline-block px-3 py-1 rounded-full font-semibold">
                        ⭐ {nextWeek.specialName || nextWeek.specialType}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3">
                    <p className="text-sm text-gray-200">Año</p>
                    <p className="text-4xl font-bold">{selectedYear}</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Selector de año */}
          <Card className="mb-6">
            <div className="flex items-center gap-4">
              <Calendar className="text-gray-600" size={20} />
              <label className="font-medium text-gray-700">Ver año:</label>
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
            {/* ✅ CALENDARIO IMPLEMENTADO - Reemplaza el placeholder */}
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
                          {week.startDate && (
                            <p className="text-xs text-gray-600 mt-1">
                              📅 {week.startDate} - {week.endDate}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600">
                            {isSpecial ? '⭐ Especial' : 'Regular'}
                          </p>
                        </div>
                      </div>
                    );
                  }).filter(Boolean)}
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