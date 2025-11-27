import { useState, useEffect } from 'react';
import { X, Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';

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
 */
export default function AnnualWeeksCalendar({ isOpen, onClose, year, titles, onSuccess, currentUserId }) {
  // ✅ TODOS LOS HOOKS AL INICIO
  const initialYear = year || new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [isDownloading, setIsDownloading] = useState(false);
  
  useEffect(() => {
    if (year) {
      setSelectedYear(year);
    }
  }, [year]);

  // ✅ AHORA SÍ el return condicional
  if (!isOpen) return null;

  const titlesList = titles || [];
  const has53Weeks = YEARS_WITH_53_WEEKS.includes(selectedYear);
  const totalWeeks = has53Weeks ? 53 : 52;
  
  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const startYear = Math.max(2027, currentYear);
    const endYear = 2100;
    
    const years = [];
    for (let y = startYear; y <= endYear; y++) {
      years.push(y);
    }
    return years;
  };
  
  const availableYears = getAvailableYears();
  
  const handlePreviousYear = () => {
    const currentIndex = availableYears.indexOf(selectedYear);
    if (currentIndex > 0) {
      setSelectedYear(availableYears[currentIndex - 1]);
    }
  };
  
  const handleNextYear = () => {
    const currentIndex = availableYears.indexOf(selectedYear);
    if (currentIndex < availableYears.length - 1) {
      setSelectedYear(availableYears[currentIndex + 1]);
    }
  };
  
  const handleYearChange = (e) => {
    setSelectedYear(Number(e.target.value));
  };
  
  const isFirstYear = selectedYear === availableYears[0];
  const isLastYear = selectedYear === availableYears[availableYears.length - 1];

  /**
   * Descargar calendario como PDF generado directamente
   */
  const handleDownloadPDF = () => {
    try {
      setIsDownloading(true);
      
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = 300; // A4 landscape width
      const pageHeight = 210; // A4 landscape height
      const margin = 5;
      const usableWidth = pageWidth - (margin * 2);
      const usableHeight = pageHeight - (margin * 2);
      
      // Título del documento
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Calendario de Semanas ${selectedYear}`, pageWidth / 2, margin + 5, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${totalWeeks} semanas • ${titlesList.length} títulos asignados`, pageWidth / 2, margin + 12, { align: 'center' });
      
      // Calcular dimensiones del grid (3 columnas x 4 filas para 12 meses)
      const cols = 3;
      const rows = 4;
      const cellWidth = usableWidth / cols;
      const cellHeight = (usableHeight - 20) / rows; // 20mm para el título
      
      const assignments = getWeekAssignments();
      let currentPage = 0;
      
      // Colores RGB para las series
      const serieColorsRGB = {
        'A': [144, 238, 144], // green-200
        'B': [173, 216, 230], // blue-200
        'C': [255, 255, 153], // yellow-200
        'D': [221, 160, 221]  // purple-200
      };
      
      MONTH_NAMES.forEach((monthName, monthIndex) => {
        const col = monthIndex % cols;
        const row = Math.floor(monthIndex / cols);
        
        // Si es un nuevo grupo de meses, crear nueva página
        if (monthIndex > 0 && monthIndex % 12 === 0) {
          pdf.addPage();
          currentPage++;
        }
        
        const startX = margin + (col * cellWidth);
        const startY = margin + 20 + (row * cellHeight);
        
        // Nombre del mes
        pdf.setFillColor(240, 240, 240);
        pdf.rect(startX, startY, cellWidth - 2, 8, 'F');
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(monthName, startX + (cellWidth - 2) / 2, startY + 5.5, { align: 'center' });
        
        // Obtener semanas del mes
        const monthWeeks = [];
        for (let week = 1; week <= totalWeeks; week++) {
          const days = getWeekDays(week);
          const monday = days.find(d => d.dayOfWeek === 1) || days[0];
          
          if (monday.month === monthIndex) {
            monthWeeks.push({
              ...assignments[week],
              days: days,
              weekNumber: week
            });
          }
        }
        
        // Headers de días
        const headerY = startY + 8;
        const dayWidth = (cellWidth - 2) / 9; // 9 columnas (Sem + Título + 7 días)
        
        pdf.setFillColor(250, 250, 250);
        pdf.rect(startX, headerY, cellWidth - 2, 5, 'F');
        
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        
        // Headers
        const headers = ['S', 'T', 'D', 'L', 'M', 'M', 'J', 'V', 'S'];
        headers.forEach((header, i) => {
          pdf.text(header, startX + (i * dayWidth) + (dayWidth / 2), headerY + 3.5, { align: 'center' });
        });
        
        // Filas de semanas
        let weekY = headerY + 5;
        const rowHeight = Math.min(6, (cellHeight - 13) / Math.max(monthWeeks.length, 1));
        
        monthWeeks.forEach((week) => {
          // Color de fondo según serie
          if (week.serie && serieColorsRGB[week.serie]) {
            const [r, g, b] = serieColorsRGB[week.serie];
            pdf.setFillColor(r, g, b);
            pdf.rect(startX, weekY, cellWidth - 2, rowHeight, 'F');
          }
          
          pdf.setFontSize(6);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          
          // Número de semana
          pdf.text(String(week.weekNumber), startX + (dayWidth / 2), weekY + (rowHeight / 2) + 1.5, { align: 'center' });
          
          // Título (abreviado si es muy largo)
          const titleText = week.title ? (week.title.length > 5 ? week.title.substring(0, 5) : week.title) : '-';
          pdf.text(titleText, startX + dayWidth + (dayWidth / 2), weekY + (rowHeight / 2) + 1.5, { align: 'center' });
          
          // Días de la semana
          week.days.forEach((day, dayIndex) => {
            const isCurrentMonth = day.month === monthIndex;
            
            if (!isCurrentMonth) {
              pdf.setTextColor(180, 180, 180); // Gris para días de otros meses
            } else {
              pdf.setTextColor(0, 0, 0);
            }
            
            pdf.text(
              day.day, 
              startX + (dayIndex + 2) * dayWidth + (dayWidth / 2), 
              weekY + (rowHeight / 2) + 1.5, 
              { align: 'center' }
            );
          });
          
          weekY += rowHeight;
        });
        
        // Borde del mes
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(startX, startY, cellWidth - 2, cellHeight - 2);
      });
      
      // Leyenda en la última página
      const legendY = pageHeight - margin;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      
      let legendX = margin;
      
      Object.entries(serieColorsRGB).forEach(([serie, [r, g, b]]) => {
        pdf.setFillColor(r, g, b);
        pdf.rect(legendX, legendY, 5, 5, 'F');
        pdf.text(`Serie ${serie}`, legendX + 7, legendY + 3.5);
        legendX += 35;
      });
      
      // Guardar PDF
      pdf.save(`Calendario_${selectedYear}.pdf`);
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const getWeekAssignments = () => {
    const assignments = {};

    for (let week = 1; week <= totalWeeks; week++) {
      assignments[week] = {
        weekNumber: week,
        title: null,
        isSpecial: false,
        specialType: null
      };
    }

    if (!Array.isArray(titlesList)) {
      console.error('titles debe ser un array');
      return assignments;
    }

    titlesList.forEach(title => {
      if (title.weeksByYear && title.weeksByYear[selectedYear]) {
        const weekNum = title.weeksByYear[selectedYear];
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

      if (title.specialWeeksByYear && title.specialWeeksByYear[selectedYear]) {
        title.specialWeeksByYear[selectedYear].forEach(special => {
          const weekNum = special.week;
          
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

  const getWeekDays = (weekNumber) => {
    const firstDayOfYear = new Date(selectedYear, 0, 1);
    const firstDayWeekday = firstDayOfYear.getDay();
    
    let firstSunday;
    if (firstDayWeekday === 0) {
      firstSunday = new Date(selectedYear, 0, 1);
    } else {
      const daysUntilSunday = 7 - firstDayWeekday;
      firstSunday = new Date(selectedYear, 0, 1 + daysUntilSunday);
    }
    
    const weeksFromFirst = weekNumber - 1;
    const sundayOfWeek = addDays(firstSunday, weeksFromFirst * 7);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(sundayOfWeek, i);
      days.push({
        date: day,
        day: format(day, 'd'),
        month: day.getMonth(),
        dayOfWeek: day.getDay()
      });
    }
    
    return days;
  };

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
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-4">
            <Calendar size={28} className="text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Calendario de Semanas
              </h2>
              <p className="text-sm text-gray-600">
                {totalWeeks} semanas • {titlesList.length} títulos asignados
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Botón Descargar PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isDownloading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              title="Descargar PDF"
            >
              <Download size={20} />
              {isDownloading ? 'Generando...' : 'Descargar PDF'}
            </button>

            {/* Selector de año */}
            <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-2">
              <button
                onClick={handlePreviousYear}
                disabled={isFirstYear}
                className={`p-2 rounded-lg transition-colors ${
                  isFirstYear 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title="Año anterior"
              >
                <ChevronLeft size={20} />
              </button>
              
              <select
                value={selectedYear}
                onChange={handleYearChange}
                className="px-3 py-1 text-lg font-bold text-gray-900 bg-transparent border-none focus:outline-none cursor-pointer"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              
              <button
                onClick={handleNextYear}
                disabled={isLastYear}
                className={`p-2 rounded-lg transition-colors ${
                  isLastYear 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title="Año siguiente"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Contenido - Grid de meses */}
        <div className="flex-1 overflow-y-auto p-6" id="calendar-content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {monthGroups.map((weeks, monthIndex) => {
              if (weeks.length === 0) return null;

              return (
                <div key={monthIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 border-b border-gray-200 p-3">
                    <h3 className="font-bold text-center text-gray-800">
                      {MONTH_NAMES[monthIndex]}
                    </h3>
                  </div>

                  <div className="grid grid-cols-9 bg-white border-b border-gray-200">
                    <div className="p-1 text-xs font-semibold text-center bg-gray-50 border-r border-gray-200">
                      Sem
                    </div>
                    <div className="p-1 text-xs font-semibold text-center bg-gray-50 border-r border-gray-200">
                      Título
                    </div>
                    {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map((day, i) => (
                      <div key={i} className="p-1 text-xs font-semibold text-center bg-gray-50">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="bg-white">
                    {weeks.map((week) => (
                      <div key={week.weekNumber} className="grid grid-cols-9 border-b border-gray-100 last:border-b-0">
                        <div className="p-1 text-xs font-bold text-center bg-gray-50 border-r border-gray-200 flex items-center justify-center">
                          {week.weekNumber}
                        </div>

                        <div className={`p-1 text-xs font-semibold text-center border-r border-gray-200 flex items-center justify-center ${
                          week.serie ? SERIE_COLORS[week.serie] : 'bg-white'
                        }`}>
                          {week.title || '-'}
                        </div>

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

                  {weeks.some(w => w.isSpecial) && (
                    <div className="bg-gray-50 p-2 text-xs space-y-1 border-t border-gray-200">
                      <p className="font-semibold text-gray-700">Semanas especiales:</p>
                      {weeks
                        .filter(w => w.isSpecial)
                        .map((week) => (
                          <div key={week.weekNumber} className="flex items-center gap-2">
                            <span className="font-bold text-gray-600">S{week.weekNumber}:</span>
                            <span className={`px-1.5 py-0.5 rounded ${SERIE_COLORS[week.serie]} font-semibold`}>
                              {week.title}
                            </span>
                            <span className="text-orange-600 font-medium">
                              {getSpecialLabel(week.specialType)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
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