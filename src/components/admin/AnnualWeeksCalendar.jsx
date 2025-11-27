import { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { startOfYear, addDays, format, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Años con 53 semanas según ISO 8601 (2027-2100)
 */
const YEARS_WITH_53_WEEKS = [
  2032, 2037, 2043, 2048, 2054, 2060, 2065, 2071, 2076, 2082,
  2088, 2093, 2099
];

/**
 * Nombres de meses en español
 */
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Colores por serie
 */
const SERIE_COLORS = {
  'A': 'bg-green-200',
  'B': 'bg-blue-200', 
  'C': 'bg-yellow-200',
  'D': 'bg-purple-200'
};

/**
 * Modal de Calendario Anual de Semanas
 * Muestra todas las semanas del año con el título asignado a cada una
 */
export default function AnnualWeeksCalendar({ isOpen, onClose, year, titles }) {
  if (!isOpen) return null;

  // Verificar si el año tiene 53 semanas
  const has53Weeks = YEARS_WITH_53_WEEKS.includes(year);
  const totalWeeks = has53Weeks ? 53 : 52;

  /**
   * Calcular qué título tiene cada semana del año
   */
  const getWeekAssignments = () => {
    const assignments = {};

    // Inicializar todas las semanas
    for (let week = 1; week <= totalWeeks; week++) {
      assignments[week] = {
        weekNumber: week,
        title: null,
        isSpecial: false,
        specialType: null
      };
    }

    // Asignar semanas regulares y especiales de cada título
    titles.forEach(title => {
      // Semana regular
      if (title.weeksByYear && title.weeksByYear[year]) {
        const weekNum = title.weeksByYear[year];
        if (!assignments[weekNum].title) {
          assignments[weekNum] = {
            weekNumber: weekNum,
            title: title.id,
            serie: title.serie,
            isSpecial: false,
            specialType: null
          };
        }
      }

      // Semanas especiales
      if (title.specialWeeksByYear && title.specialWeeksByYear[year]) {
        title.specialWeeksByYear[year].forEach(special => {
          const weekNum = special.week;
          
          // Si es semana 53, marcar como especial
          if (weekNum === 53) {
            assignments[weekNum] = {
              weekNumber: weekNum,
              title: title.id,
              serie: title.serie,
              isSpecial: true,
              specialType: 'WEEK_53',
              isManual: true
            };
          } else if (!assignments[weekNum].title) {
            assignments[weekNum] = {
              weekNumber: weekNum,
              title: title.id,
              serie: title.serie,
              isSpecial: true,
              specialType: special.type
            };
          }
        });
      }
    });

    return assignments;
  };

  /**
   * Obtener información de días de una semana
   */
  const getWeekDays = (weekNumber) => {
    const firstDayOfYear = startOfYear(new Date(year, 0, 1));
    const daysToAdd = (weekNumber - 1) * 7;
    const weekStart = addDays(firstDayOfYear, daysToAdd);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      days.push({
        date: day,
        day: format(day, 'd'),
        month: day.getMonth(),
        dayOfWeek: getDay(day)
      });
    }
    
    return days;
  };

  /**
   * Agrupar semanas por mes (basado en lunes de la semana)
   */
  const groupWeeksByMonth = () => {
    const assignments = getWeekAssignments();
    const monthGroups = Array(12).fill(null).map(() => []);

    for (let week = 1; week <= totalWeeks; week++) {
      const days = getWeekDays(week);
      const monday = days.find(d => d.dayOfWeek === 1) || days[0];
      const monthIndex = monday.month;
      
      monthGroups[monthIndex].push({
        ...assignments[week],
        days: days
      });
    }

    return monthGroups;
  };

  /**
   * Obtener etiqueta de semana especial
   */
  const getSpecialLabel = (specialType) => {
    const labels = {
      'NAVIDAD': '🎄 Navidad',
      'FIN_ANO': '🎆 Fin Año',
      'SANTA': '✝️ Santa',
      'PASCUA': '🐰 Pascua',
      'WEEK_53': '✋ Manual'
    };
    return labels[specialType] || '';
  };

  const monthGroups = groupWeeksByMonth();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Calendar size={28} className="text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Calendario de Semanas {year}
              </h2>
              <p className="text-sm text-gray-600">
                {totalWeeks} semanas • 48 títulos asignados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido - Grid de meses */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {monthGroups.map((weeks, monthIndex) => {
              if (weeks.length === 0) return null;

              return (
                <div key={monthIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Nombre del mes */}
                  <div className="bg-gray-100 border-b border-gray-200 p-3">
                    <h3 className="font-bold text-center text-gray-800">
                      {MONTH_NAMES[monthIndex]}
                    </h3>
                  </div>

                  {/* Encabezado de días */}
                  <div className="grid grid-cols-8 bg-white border-b border-gray-200">
                    <div className="p-1 text-xs font-semibold text-center bg-gray-50 border-r border-gray-200">
                      Semana
                    </div>
                    {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map((day, i) => (
                      <div key={i} className="p-1 text-xs font-semibold text-center bg-gray-50">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Filas de semanas */}
                  <div className="bg-white">
                    {weeks.map((week) => (
                      <div key={week.weekNumber} className="grid grid-cols-8 border-b border-gray-100 last:border-b-0">
                        {/* Número de semana */}
                        <div className="p-1 text-xs font-bold text-center bg-gray-50 border-r border-gray-200 flex items-center justify-center">
                          {week.weekNumber}
                        </div>

                        {/* Días de la semana */}
                        {week.days.map((day, dayIndex) => {
                          const isCurrentMonth = day.month === monthIndex;
                          const bgColor = week.serie ? SERIE_COLORS[week.serie] : 'bg-white';
                          
                          return (
                            <div
                              key={dayIndex}
                              className={`p-1 text-xs text-center ${
                                isCurrentMonth ? bgColor : 'bg-gray-50 text-gray-400'
                              } ${day.dayOfWeek === 0 || day.dayOfWeek === 6 ? 'font-semibold' : ''}`}
                              title={week.title ? `${week.title}${week.isSpecial ? ' - ' + getSpecialLabel(week.specialType) : ''}` : 'Sin asignar'}
                            >
                              {day.day}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Información de títulos del mes */}
                  <div className="bg-gray-50 p-2 text-xs space-y-1">
                    {weeks
                      .filter(w => w.title)
                      .map((week) => (
                        <div key={week.weekNumber} className="flex items-center gap-2">
                          <span className="font-bold text-gray-600">S{week.weekNumber}:</span>
                          <span className={`px-1.5 py-0.5 rounded ${SERIE_COLORS[week.serie]} font-semibold`}>
                            {week.title}
                          </span>
                          {week.isSpecial && (
                            <span className="text-orange-600 font-medium">
                              {getSpecialLabel(week.specialType)}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer con leyenda */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-200 rounded"></div>
              <span>Serie A</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-200 rounded"></div>
              <span>Serie B</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-200 rounded"></div>
              <span>Serie C</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-200 rounded"></div>
              <span>Serie D</span>
            </div>
            {has53Weeks && (
              <div className="flex items-center gap-2 ml-4 border-l pl-4">
                <span className="font-bold text-orange-600">✋ Semana 53: Asignación Manual</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}