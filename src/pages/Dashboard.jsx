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
      setUserWeeks(weeksData);
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular próxima semana (simplificado para esta versión)
  const getNextWeek = () => {
    if (userWeeks.length === 0) return null;
    
    // Por ahora retornamos la primera semana
    // En una versión completa, calcularíamos cuál es la próxima según la fecha actual
    const firstWeek = userWeeks[0];
    return {
      weekNumber: firstWeek.weekNumber,
      title: firstWeek.titleId,
      daysUntil: '...' // Cálculo de días pendiente
    };
  };

  const nextWeek = getNextWeek();

  const getSerieColor = (title) => {
    const serie = title?.charAt(0) || title?.serie;
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
              subtitle={`${userWeeks.length} semanas asignadas`}
            >
              {userWeeks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay semanas asignadas para este año</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userWeeks.map((week, index) => {
                    const colorClass = getSerieColor(week.titleId);
                    
                    return (
                      <div
                        key={index}
                        className={`${colorClass} rounded-lg p-4 flex items-center justify-between`}
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            Semana {week.weekNumber}
                          </p>
                          <p className="text-sm text-gray-700">
                            Título: {week.titleId}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {week.titleId}
                          </p>
                        </div>
                      </div>
                    );
                  })}
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
                <p className="text-gray-600 mt-1">Títulos en propiedad</p>
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