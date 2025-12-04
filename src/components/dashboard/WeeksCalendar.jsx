import { useState, useEffect } from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  getWeek, 
  addDays,
  startOfYear
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
// ✅ NUEVA IMPORTACIÓN: Función centralizada para obtener Date de inicio
import { getFechaInicioSemana } from '../../services/weekCalculationService';


/**
 * Componente de Calendario estilo Google Calendar
 * Compatible con la estructura existente del proyecto
 */
const WeeksCalendar = ({ userWeeks = [], currentYear }) => {
  const [currentDate, setCurrentDate] = useState(new Date(currentYear, 0, 1));
  const [selectedWeek, setSelectedWeek] = useState(null);

  useEffect(() => {
    // Usar el mes actual para la vista inicial si es el año actual, o Enero si no
    const initialMonth = currentYear === new Date().getFullYear() ? new Date().getMonth() : 0;
    setCurrentDate(new Date(currentYear, initialMonth, 1));
  }, [currentYear]);

  // ❌ ELIMINADA: La función getWeekStartDate local fue eliminada de aquí.

  // Obtener días del mes con padding
  const getDaysInMonth = () => {
    // La semana en este componente empieza en Domingo (day 0) para el grid
    const start = startOfWeek(startOfMonth(currentDate), { locale: es, weekStartsOn: 0 }); 
    const end = endOfWeek(endOfMonth(currentDate), { locale: es, weekStartsOn: 0 }); 
    return eachDayOfInterval({ start, end });
  };

  // Verificar si un día tiene semanas del usuario
  const getWeeksForDay = (day) => {
    return userWeeks.filter(week => {
      // 💥 CORRECCIÓN CRÍTICA: Usar la función centralizada (devuelve Date)
      const weekStart = getFechaInicioSemana(currentYear, week.weekNumber);
      const weekEnd = addDays(weekStart, 6);
      
      // Comparación directa de objetos Date (día cae dentro del rango de la semana)
      return day >= weekStart && day <= weekEnd;
    });
  };

  // Obtener color por tipo de semana (adaptado a tu proyecto)
  const getWeekColor = (week) => {
    if (week.type === 'special') {
      return 'bg-orange-100 border-orange-500 text-orange-800';
    }
    
    // Color por serie para semanas regulares
    const serieColors = {
      'A': 'bg-serie-a border-green-600',
      'B': 'bg-serie-b border-blue-600',
      'C': 'bg-serie-c border-yellow-600',
      'D': 'bg-serie-d border-purple-600'
    };
    
    const serie = week.titleId?.charAt(0);
    return serieColors[serie] || 'bg-gray-100 border-gray-500';
  };

  // Navegar meses
  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date(currentYear, new Date().getMonth(), 1));

  const days = getDaysInMonth();
  const monthName = format(currentDate, 'MMMM yyyy', { locale: es });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <CalendarIcon className="w-6 h-6 text-gray-600" />
          <h3 className="text-xl font-bold text-gray-900 capitalize">
            {monthName}
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Hoy
          </button>
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1">
        {/* Usando Domingo como inicio de semana para el calendario visual */}
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-gray-600 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Días del mes */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const weeksForDay = getWeeksForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={index}
              className={`min-h-[80px] p-1.5 border rounded transition-all ${
                isCurrentMonth 
                  ? 'bg-white border-gray-200' 
                  : 'bg-gray-50 border-gray-100'
              } ${
                isToday 
                  ? 'ring-2 ring-blue-500' 
                  : ''
              }`}
            >
              {/* Número del día */}
              <div className={`text-xs font-semibold mb-1 ${
                isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              } ${
                isToday ? 'text-blue-600' : ''
              }`}>
                {format(day, 'd')}
              </div>

              {/* Semanas del usuario */}
              <div className="space-y-0.5">
                {weeksForDay.map((week, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedWeek(week)}
                    className={`text-[10px] px-1.5 py-0.5 rounded border-l-2 cursor-pointer hover:shadow transition-all ${getWeekColor(week)}`}
                    title={`${week.titleId} - Semana ${week.weekNumber}`}
                  >
                    <div className="font-semibold truncate">
                      {week.titleId}
                    </div>
                    {week.type === 'special' && (
                      <div className="text-[9px]">⭐</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="pt-3 border-t border-gray-200">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Leyenda:</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-serie-a border-l-2 border-green-600 rounded"></div>
            <span className="text-gray-600">Serie A</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-serie-b border-l-2 border-blue-600 rounded"></div>
            <span className="text-gray-600">Serie B</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-serie-c border-l-2 border-yellow-600 rounded"></div>
            <span className="text-gray-600">Serie C</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-serie-d border-l-2 border-purple-600 rounded"></div>
            <span className="text-gray-600">Serie D</span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <div className="w-3 h-3 bg-orange-100 border-l-2 border-orange-500 rounded"></div>
            <span className="text-gray-600">⭐ Semana VIP</span>
          </div>
        </div>
      </div>

      {/* Modal de detalles (simplificado) */}
      {selectedWeek && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedWeek(null)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4">Detalles de la Semana</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Título:</strong> {selectedWeek.titleId}</p>
              <p><strong>Semana:</strong> {selectedWeek.weekNumber}</p>
              <p><strong>Tipo:</strong> {selectedWeek.type === 'special' ? `⭐ VIP - ${selectedWeek.specialName || selectedWeek.specialType}` : 'Regular'}</p>
              {selectedWeek.startDate && (
                <p><strong>Fechas:</strong> {selectedWeek.startDate} - {selectedWeek.endDate}</p>
              )}
            </div>
            <button
              onClick={() => setSelectedWeek(null)}
              className="mt-4 w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeksCalendar;