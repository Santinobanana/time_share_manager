import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Calendar, Filter, Download } from 'lucide-react';

export default function MyWeeks() {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState(2027);
  const [filterType, setFilterType] = useState('all'); // all, regular, special

  // Datos simulados - En Fase 2 vendrán de Firebase
  const years = [2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];
  
  const allWeeks = {
    2027: [
      { weekNumber: 2, dates: '11-17 Ene', title: 'A-1-1', type: 'regular', startDate: '2027-01-11', endDate: '2027-01-17' },
      { weekNumber: 5, dates: '1-7 Feb', title: 'A-2-3', type: 'regular', startDate: '2027-02-01', endDate: '2027-02-07' },
      { weekNumber: null, dates: '21-28 Mar', title: 'A-1-1', type: 'special', name: 'SANTA', startDate: '2027-03-21', endDate: '2027-03-28' },
      { weekNumber: 8, dates: '22-28 Mar', title: 'A-1-1', type: 'regular', startDate: '2027-03-22', endDate: '2027-03-28' },
      { weekNumber: 15, dates: '10-16 May', title: 'A-2-3', type: 'regular', startDate: '2027-05-10', endDate: '2027-05-16' },
      { weekNumber: 20, dates: '14-20 Jun', title: 'A-1-1', type: 'regular', startDate: '2027-06-14', endDate: '2027-06-20' },
    ],
    2028: [
      { weekNumber: 3, dates: '16-22 Ene', title: 'A-1-1', type: 'regular', startDate: '2028-01-16', endDate: '2028-01-22' },
      { weekNumber: null, dates: '10-17 Abr', title: 'A-2-3', type: 'special', name: 'PASCUA', startDate: '2028-04-10', endDate: '2028-04-17' },
      { weekNumber: 12, dates: '20-26 Mar', title: 'A-1-1', type: 'regular', startDate: '2028-03-20', endDate: '2028-03-26' },
    ],
    2029: [
      { weekNumber: 4, dates: '21-27 Ene', title: 'A-1-1', type: 'regular', startDate: '2029-01-21', endDate: '2029-01-27' },
      { weekNumber: 10, dates: '4-10 Mar', title: 'A-2-3', type: 'regular', startDate: '2029-03-04', endDate: '2029-03-10' },
      { weekNumber: null, dates: '24-31 Dic', title: 'A-1-1', type: 'special', name: 'NAVIDAD', startDate: '2029-12-24', endDate: '2029-12-31' },
    ]
  };

  const currentYearWeeks = allWeeks[selectedYear] || [];
  
  const filteredWeeks = currentYearWeeks.filter(week => {
    if (filterType === 'all') return true;
    return week.type === filterType;
  });

  const getSerieColor = (title) => {
    const serie = title.charAt(0);
    return {
      'A': 'bg-serie-a',
      'B': 'bg-serie-b',
      'C': 'bg-serie-c',
      'D': 'bg-serie-d'
    }[serie];
  };

  const handleExport = () => {
    // Simulación de exportación - En Fase 2 generará PDF o Excel
    alert('Función de exportación próximamente');
  };

  const regularWeeksCount = currentYearWeeks.filter(w => w.type === 'regular').length;
  const specialWeeksCount = currentYearWeeks.filter(w => w.type === 'special').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mis Semanas</h1>
        <p className="text-gray-600 mt-1">
          Visualiza todas tus semanas asignadas por año
        </p>
      </div>

      {/* Filtros y acciones */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-3">
          {/* Selector de año */}
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

          {/* Filtro por tipo */}
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

        {/* Botón exportar */}
        <Button
          variant="outline"
          onClick={handleExport}
          className="flex items-center gap-2"
        >
          <Download size={18} />
          Exportar
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">
              {currentYearWeeks.length}
            </p>
            <p className="text-gray-600 mt-1">Total de semanas</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">
              {regularWeeksCount}
            </p>
            <p className="text-gray-600 mt-1">Semanas regulares</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">
              {specialWeeksCount}
            </p>
            <p className="text-gray-600 mt-1">Semanas especiales</p>
          </div>
        </Card>
      </div>

      {/* Lista de semanas */}
      <Card title={`Semanas en ${selectedYear}`} subtitle={`${filteredWeeks.length} semanas`}>
        {filteredWeeks.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No hay semanas asignadas para este año</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredWeeks.map((week, index) => (
              <div
                key={index}
                className={`${getSerieColor(week.title)} rounded-lg p-4 transition-all hover:shadow-md`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {week.type === 'special' && (
                        <span className="text-2xl">⭐</span>
                      )}
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">
                          {week.type === 'special' ? week.name : `Semana ${week.weekNumber}`}
                        </h3>
                        <p className="text-gray-700 text-sm">
                          {week.dates} · {week.title}
                        </p>
                      </div>
                    </div>
                    
                    {week.type === 'special' && (
                      <div className="inline-block bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full">
                        <p className="text-xs font-medium text-gray-800">
                          Semana Especial
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="bg-white/30 backdrop-blur-sm rounded-lg px-4 py-2">
                      <p className="text-sm text-gray-700 font-medium">
                        {new Date(week.startDate).toLocaleDateString('es-ES', { weekday: 'short' })}
                      </p>
                      <p className="text-xs text-gray-600">
                        a {new Date(week.endDate).toLocaleDateString('es-ES', { weekday: 'short' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
    </div>
  );
}