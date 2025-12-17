import { useState, useEffect, useRef } from 'react';
import { X, Calendar, ChevronLeft, ChevronRight, Download, ChevronDown } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import {
  obtenerNumeroSemana,
  calcularSemanasEspeciales,
  getTotalWeeksInYear,
  has53Weeks,
  crearMapeoSemanasDisponibles,
  SERIE_COLORS,
  SERIE_COLORS_RGB
} from '../../services/weekCalculationService';
import {
  getYearsWith53Weeks,
  getAllWeek53Assignments,
  assignWeek53WithExchange,
  getWeek53Assignment,
  cancelWeek53Assignment
} from '../../services/week53Service';


/**
 * Nombres de meses en español
 */
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Modal de Calendario Anual de Semanas
 */
export default function AnnualWeeksCalendar({ isOpen, onClose, year, titles, onSuccess, currentUserId }) {
  // ✅ TODOS LOS HOOKS AL INICIO
  const initialYear = year || new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Nuevo estado para almacenar el conteo de semanas por serie
  const [serieWeekCounts, setSerieWeekCounts] = useState({ A: 0, B: 0, C: 0, D: 0 });

  // ========== NUEVOS ESTADOS PARA SEMANA EXTRA ==========
  const [showYearsDropdown, setShowYearsDropdown] = useState(false);
  const [yearsWith53, setYearsWith53] = useState([]);
  const [week53Assignments, setWeek53Assignments] = useState({});
  
  // Estados para Intercambio
  const [showExchangeDropdown, setShowExchangeDropdown] = useState(false);
  const [selectedTitleForExchange, setSelectedTitleForExchange] = useState('');
  const [selectedWeekForExchange, setSelectedWeekForExchange] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Estados para Cancelación
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Refs para dropdowns
  const yearsDropdownRef = useRef(null);
  const exchangeDropdownRef = useRef(null);
  // ========== FIN NUEVOS ESTADOS ==========

  const totalWeeks = has53Weeks(selectedYear) ? 53 : 52;

  useEffect(() => {
    if (year) {
      setSelectedYear(year);
    }
  }, [year]);

  // ========== NUEVO: Cargar años con semana 53 y asignaciones ==========
  useEffect(() => {
    if (isOpen) {
      loadWeek53Data();
    }
  }, [isOpen]);

  const loadWeek53Data = async () => {
    try {
      const years = getYearsWith53Weeks();
      const assignments = await getAllWeek53Assignments();
      setYearsWith53(years);
      setWeek53Assignments(assignments);
    } catch (error) {
      console.error('Error cargando datos de semana 53:', error);
    }
  };
  // ========== FIN NUEVO ==========

  // Ejecutar el cálculo de conteo cada vez que cambia el año o los títulos
  useEffect(() => {
    if (isOpen) {
      const assignments = getWeekAssignments();
      setSerieWeekCounts(getSerieWeekCounts(assignments));
    }
  }, [selectedYear, titles, isOpen, totalWeeks]); // Incluir totalWeeks en dependencias

  // ========== NUEVO: Cerrar dropdowns al hacer clic fuera ==========
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearsDropdownRef.current && !yearsDropdownRef.current.contains(event.target)) {
        setShowYearsDropdown(false);
      }
      if (exchangeDropdownRef.current && !exchangeDropdownRef.current.contains(event.target)) {
        setShowExchangeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  // ========== FIN NUEVO ==========

  // ✅ AHORA SÍ el return condicional
  if (!isOpen) return null;

  const titlesList = titles || [];
  
  // ✅ NUEVA VALIDACIÓN: Esperar a que titles tenga datos
  if (titlesList.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando títulos...</p>
          </div>
        </div>
      </div>
    );
  }
  
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

  // ========== NUEVAS FUNCIONES PARA SEMANA EXTRA ==========
  const handleYearWith53Click = (year) => {
    setSelectedYear(year);
    setShowYearsDropdown(false);
  };

  const getTitleWeeksInYear = (titleId) => {
    const assignments = getWeekAssignments();
    const weeks = [];
    
    for (let week = 1; week <= totalWeeks; week++) {
      if (assignments[week].title === titleId) {
        weeks.push(week);
      }
    }
    
    // Excluir semanas 51, 52 y 53 (especiales en años con 53 semanas)
    return weeks.filter(w => w !== 51 && w !== 52 && w !== 53);
  };

  const handleExchangeSubmit = async () => {
    if (!selectedTitleForExchange || !selectedWeekForExchange) {
      alert('Por favor selecciona un título y una semana');
      return;
    }

    setIsProcessing(true);
    try {
      await assignWeek53WithExchange(
        selectedYear,
        selectedTitleForExchange,
        selectedWeekForExchange,
        currentUserId
      );

      // Recargar datos
      await loadWeek53Data();
      
      // Limpiar formulario
      setSelectedTitleForExchange('');
      setSelectedWeekForExchange('');
      setShowConfirmation(false);
      setShowExchangeDropdown(false);

      if (onSuccess) {
        onSuccess();
      }

      alert(`Semana 51 asignada exitosamente a ${selectedTitleForExchange}`);
    } catch (error) {
      console.error('Error en intercambio:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelAssignment = async () => {
    setIsCancelling(true);
    try {
      await cancelWeek53Assignment(selectedYear, currentUserId);

      // Recargar datos
      await loadWeek53Data();
      
      // Cerrar modales
      setShowCancelConfirmation(false);
      setShowExchangeDropdown(false);

      if (onSuccess) {
        onSuccess();
      }

      alert(`Asignación de semana extra del año ${selectedYear} cancelada exitosamente`);
    } catch (error) {
      console.error('Error cancelando asignación:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsCancelling(false);
    }
  };

  const currentYearHas53Weeks = has53Weeks(selectedYear);
  const currentAssignment = week53Assignments[selectedYear];
  // ========== FIN NUEVAS FUNCIONES ==========

  /**
   * FUNCIÓN NUEVA: Calcula el resumen de semanas asignadas por serie.
   */
  const getSerieWeekCounts = (assignments) => {
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    
    // Contar solo las semanas que tienen un título asignado y una serie válida
    Object.values(assignments).forEach(assignment => {
      if (assignment.title && assignment.serie && counts.hasOwnProperty(assignment.serie)) {
        counts[assignment.serie]++;
      }
    });
    
    return counts;
  };

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
      
      // MOSTRAR CONTEO EN EL PDF
      const countSummary = `Semanas asignadas: A: ${serieWeekCounts.A} | B: ${serieWeekCounts.B} | C: ${serieWeekCounts.C} | D: ${serieWeekCounts.D}`;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      //pdf.text(`${totalWeeks} semanas • ${countSummary}`, pageWidth / 2, margin + 12, { align: 'center' });
      
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

    // 💥 CORRECCIÓN: Inicializar el objeto hasta totalWeeks (52 o 53)
    for (let week = 1; week <= totalWeeks; week++) {
      assignments[week] = {
        weekNumber: week,
        title: null,
        serie: null, // Asegurar que serie es null por defecto
        isSpecial: false,
        specialType: null
      };
    }

    if (!Array.isArray(titlesList)) {
      console.error('titles debe ser un array');
      return assignments;
    }

    titlesList.forEach(title => {
      // Asignación de semana regular
      if (title.weeksByYear && title.weeksByYear[selectedYear]) {
        const weekNum = title.weeksByYear[selectedYear];
        if (assignments[weekNum] && !assignments[weekNum].title) {
          assignments[weekNum] = {
            weekNumber: weekNum,
            title: title.id,
            serie: title.serie,
            isSpecial: false,
            specialType: null
          };
        }
      }

      // Asignación de semanas especiales (VIP/Bisiesta/Extra)
      if (title.specialWeeksByYear && title.specialWeeksByYear[selectedYear]) {
        title.specialWeeksByYear[selectedYear].forEach(special => {
          const weekNum = special.week;
          
          // Verificar explícitamente si assignments[weekNum] existe antes de acceder a .title
          if (assignments[weekNum]) {
             // La lógica aquí parece dar prioridad a la semana regular sobre la especial
             // si ya hay un título asignado.
             if (!assignments[weekNum].title || special.type === 'BISIESTA' || special.type === 'WEEK_53' || special.type === 'WEEK_51') {
                // Si no hay título, o si es una Bisiesta/Extra (que debe sobrescribir), asignar.
               assignments[weekNum] = {
                 weekNumber: weekNum,
                 title: title.id,
                 serie: title.serie,
                 isSpecial: true,
                 specialType: special.type,
                 isManual: special.type === 'WEEK_53' || special.type === 'BISIESTA' || special.type === 'WEEK_51'
               };
             }
          }
        });
      }
    });

    // ========== NUEVO: Agregar asignación de semana 51 si existe ==========
    if (currentAssignment) {
      assignments[51] = {
        weekNumber: 51,
        title: currentAssignment.titleId,
        serie: currentAssignment.titleId ? currentAssignment.titleId[0] : null,
        isSpecial: true,
        specialType: 'WEEK_51',
        isManual: true
      };
    }
    // ========== FIN NUEVO ==========

    return assignments;
  };

  const getWeekDays = (weekNumber) => {
    // Esta lógica de fechas es la misma que la de AdminTitles/PdfGenerator (Domingo-Sábado)
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
        dayOfWeek: day.getDay() // 0=Domingo, 6=Sábado
      });
    }
    
    return days;
  };

  const groupWeeksByMonth = () => {
    const assignments = getWeekAssignments();
    const monthGroups = Array(12).fill(null).map(() => []);

    for (let week = 1; week <= totalWeeks; week++) {
      const days = getWeekDays(week);
      
      // La lógica original usa el LUNES (dayOfWeek === 1) o el Domingo si no hay Lunes
      const monday = days.find(d => d.dayOfWeek === 1) || days[0];
      let monthIndex = monday.month;
      
      if (week >= 52 && monthIndex === 0) { // monthIndex 0 es Enero
        monthIndex = 11;
      }
      
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
      'WEEK_51': '✋ Extra',
      'WEEK_53': '✋ Manual',
      'BISIESTA': '🎰 Rifa'
    };
    return labels[specialType] || '';
  };

  const monthGroups = groupWeeksByMonth();

  // ----------------------------------------------------------------------
  // RENDERIZADO
  // ----------------------------------------------------------------------
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-4 p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        {/* Fila 1: Título y botón cerrar */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Calendar size={28} className="text-blue-600 flex-shrink-0" />
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                Calendario de Semanas
              </h2>
              <p className="text-xs md:text-sm text-gray-600">
                {totalWeeks} semanas • 
                <span className="ml-2 font-bold text-gray-800">Semanas Asignadas:</span>
                <span className="ml-1 text-green-600">A: {serieWeekCounts.A}</span>
                <span className="ml-1 text-blue-600">B: {serieWeekCounts.B}</span>
                <span className="ml-1 text-yellow-600">C: {serieWeekCounts.C}</span>
                <span className="ml-1 text-purple-600">D: {serieWeekCounts.D}</span>
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
          >
            <X size={24} />
          </button>
        </div>

        {/* Fila 2: Controles (responsive con wrap) */}
        <div className="flex flex-wrap items-center gap-2 justify-end">
          {/* ========== Botón Semana Extra / Intercambiar ========== */}
          {currentYearHas53Weeks ? (
            // Botón Intercambiar (solo en años con semana 53)
            <div className="relative" ref={exchangeDropdownRef}>
              <button
                onClick={() => setShowExchangeDropdown(!showExchangeDropdown)}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs md:text-sm font-medium whitespace-nowrap"
              >
                <span className="hidden sm:inline">Intercambiar Semana Extra</span>
                <span className="sm:hidden">Intercambiar</span>
                <ChevronDown size={16} />
              </button>

              {showExchangeDropdown && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm md:text-base">
                    Intercambiar Semana 51 (Extra) del Año {selectedYear}
                  </h3>

                  {currentAssignment && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs md:text-sm text-yellow-800 mb-2">
                        <strong>Asignación actual:</strong> {currentAssignment.titleId}
                        <br />
                        <span className="text-xs">Semana cedida: {currentAssignment.weekExchanged}</span>
                      </p>
                      <button
                        onClick={() => setShowCancelConfirmation(true)}
                        className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs md:text-sm font-medium"
                      >
                        Cancelar Asignación
                      </button>
                    </div>
                  )}

                  {/* Seleccionar título */}
                  <div className="mb-3">
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Título:
                    </label>
                    <select
                      value={selectedTitleForExchange}
                      onChange={(e) => {
                        setSelectedTitleForExchange(e.target.value);
                        setSelectedWeekForExchange('');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs md:text-sm"
                    >
                      <option value="">Seleccionar título...</option>
                      {titlesList.map(title => (
                        <option key={title.id} value={title.id}>
                          {title.id} ({title.serie}{title.subserie}-{title.number})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Seleccionar semana a intercambiar */}
                  {selectedTitleForExchange && (
                    <div className="mb-3">
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                        Semana a ceder:
                      </label>
                      <select
                        value={selectedWeekForExchange}
                        onChange={(e) => setSelectedWeekForExchange(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs md:text-sm"
                      >
                        <option value="">Seleccionar semana...</option>
                        {getTitleWeeksInYear(selectedTitleForExchange).map(week => (
                          <option key={week} value={week}>
                            Semana {week}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        if (selectedTitleForExchange && selectedWeekForExchange) {
                          setShowConfirmation(true);
                        }
                      }}
                      disabled={!selectedTitleForExchange || !selectedWeekForExchange || isProcessing}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-xs md:text-sm font-medium"
                    >
                      {isProcessing ? 'Procesando...' : 'Confirmar'}
                    </button>
                    <button
                      onClick={() => {
                        setShowExchangeDropdown(false);
                        setSelectedTitleForExchange('');
                        setSelectedWeekForExchange('');
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs md:text-sm font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Botón Semana Extra (en todos los demás años)
            <div className="relative" ref={yearsDropdownRef}>
              <button
                onClick={() => setShowYearsDropdown(!showYearsDropdown)}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs md:text-sm font-medium whitespace-nowrap"
              >
                <span className="hidden sm:inline">Semana Extra</span>
                <span className="sm:hidden">Extra</span>
                <ChevronDown size={16} />
              </button>

              {showYearsDropdown && (
                <div className="absolute right-0 mt-2 w-56 md:w-64 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 md:max-h-96 overflow-y-auto z-10">
                  <div className="p-2">
                    <h3 className="font-semibold text-gray-900 mb-2 px-2 text-xs md:text-sm">
                      Años con Semana 53
                    </h3>
                    {yearsWith53.map(year => {
                      const isAssigned = !!week53Assignments[year];
                      return (
                        <button
                          key={year}
                          onClick={() => handleYearWith53Click(year)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-xs md:text-sm ${
                            isAssigned
                              ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              : 'hover:bg-purple-50 text-gray-900'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{year}</span>
                            {isAssigned && (
                              <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                                {week53Assignments[year].titleId}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botón Descargar PDF */}
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-xs md:text-sm font-medium whitespace-nowrap ${
              isDownloading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
            title="Descargar PDF"
          >
            <Download size={18} />
            <span className="hidden sm:inline">{isDownloading ? 'Generando...' : 'Descargar PDF'}</span>
            <span className="sm:hidden">{isDownloading ? '...' : 'PDF'}</span>
          </button>

          {/* Selector de año */}
          <div className="flex items-center gap-1 md:gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-1 md:p-2">
            <button
              onClick={handlePreviousYear}
              disabled={isFirstYear}
              className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                isFirstYear 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Año anterior"
            >
              <ChevronLeft size={18} />
            </button>
            
            <select
              value={selectedYear}
              onChange={handleYearChange}
              className="px-2 md:px-3 py-1 text-base md:text-lg font-bold text-gray-900 bg-transparent border-none focus:outline-none cursor-pointer"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            
            <button
              onClick={handleNextYear}
              disabled={isLastYear}
              className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                isLastYear 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Año siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>
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
            {/* Mostrar leyenda de Semana 53 si aplica */}
            {totalWeeks === 53 && (
              <div className="flex items-center gap-2 ml-4 border-l pl-4">
                <span className="font-bold text-orange-600">🎰 Semana 53 </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========== NUEVO: Modal de confirmación ========== */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Confirmar Intercambio
            </h3>
            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-700">
                <strong>Año:</strong> {selectedYear}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Título:</strong> {selectedTitleForExchange}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Semana a ceder:</strong> {selectedWeekForExchange}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Semana a recibir:</strong> 51 (Extra)
              </p>
              {currentAssignment && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Esto reemplazará la asignación actual de la semana 51 a <strong>{currentAssignment.titleId}</strong>
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExchangeSubmit}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 transition-colors font-medium"
              >
                {isProcessing ? 'Procesando...' : 'Confirmar'}
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========== FIN NUEVO ========== */}

      {/* ========== NUEVO: Modal de confirmación de cancelación ========== */}
      {showCancelConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Confirmar Cancelación de Asignación
            </h3>
            <div className="space-y-3 mb-6">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 mb-2">
                  ⚠️ Esta acción cancelará la asignación de semana extra y <strong>restaurará</strong> las semanas originales.
                </p>
              </div>
              <p className="text-sm text-gray-700">
                <strong>Año:</strong> {selectedYear}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Título con asignación actual:</strong> {currentAssignment?.titleId}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Semana cedida (se restaurará):</strong> {currentAssignment?.weekExchanged}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Semana 51:</strong> Quedará sin asignar
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancelAssignment}
                disabled={isCancelling}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition-colors font-medium"
              >
                {isCancelling ? 'Cancelando...' : 'Confirmar Cancelación'}
              </button>
              <button
                onClick={() => setShowCancelConfirmation(false)}
                disabled={isCancelling}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========== FIN NUEVO ========== */}
    </div>
  );
}