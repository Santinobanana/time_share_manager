import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import { Calendar, Home } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  // Datos simulados - En Fase 2 vendrán de Firebase
  const nextWeek = {
    weekNumber: 15,
    dates: '12-18 Abril 2027',
    title: 'A-1-1',
    daysUntil: 45
  };

  const userWeeks2027 = [
    { weekNumber: 5, dates: '2-8 Feb', title: 'A-1-1', type: 'regular' },
    { weekNumber: 15, dates: '12-18 Abr', title: 'A-2-3', type: 'regular' },
    { weekNumber: null, dates: '21-28 Mar', title: 'A-1-1', type: 'special', name: 'SANTA' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido, {user?.name}
        </h1>
        <p className="text-gray-600 mt-1">
          Aquí está el resumen de tus semanas asignadas
        </p>
      </div>

      {/* Próxima semana - Card destacada */}
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
              <p className="text-xl text-gray-200">
                📅 {nextWeek.dates}
              </p>
              <p className="text-lg text-gray-300">
                🏠 Título: {nextWeek.title}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3">
              <p className="text-sm text-gray-200">Faltan</p>
              <p className="text-4xl font-bold">{nextWeek.daysUntil}</p>
              <p className="text-sm text-gray-200">días</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendario */}
        <Card title="Calendario 2027">
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
        <Card title="Tus semanas en 2027" subtitle={`${userWeeks2027.length} semanas asignadas`}>
          <div className="space-y-3">
            {userWeeks2027.map((week, index) => {
              const serie = week.title.charAt(0);
              const colorClass = {
                'A': 'bg-serie-a',
                'B': 'bg-serie-b',
                'C': 'bg-serie-c',
                'D': 'bg-serie-d'
              }[serie];
              
              return (
                <div
                  key={index}
                  className={`${colorClass} rounded-lg p-4 flex items-center justify-between`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      {week.type === 'special' && (
                        <span className="text-lg">⭐</span>
                      )}
                      <p className="font-semibold text-gray-900">
                        {week.type === 'special' ? week.name : `Semana ${week.weekNumber}`}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700">
                      {week.dates}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {week.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Información adicional */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">
              {user?.titles?.length || 0}
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
              {userWeeks2027.length}
            </p>
            <p className="text-gray-600 mt-1">Semanas este año</p>
          </div>
        </Card>
      </div>
    </div>
  );
}