import { X, Download, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns'; // ⚠️ Solo necesitamos format, addDays y startOfYear ya no son necesarios localmente
import { es } from 'date-fns/locale';
import { generarPDFTitulo } from '../../utils/PdfGenerator';
import Button from './Button';
import { 
  getFechaInicioSemana, // Importar del servicio
  getFechaFinSemana,   // Importar del servicio
  NOMBRES_SEMANAS_ESPECIALES // Importar nombres
} from '../../services/weekCalculationService'; // ✅ Servicio centralizado

/**
 * Modal para mostrar calendario completo de un título (2027-2100)
 * Tabla con: Año | Tipo de Semana | Número | Fechas
 */
const TitleCalendarModal = ({ isOpen, onClose, title, userName = '' }) => {
  if (!isOpen || !title) return null;

  // Generar datos de calendario para todos los años (2027-2100)
  const generateFullCalendar = () => {
    const START_YEAR = 2027;
    const END_YEAR = 2100;
    const calendar = [];

    for (let year = START_YEAR; year <= END_YEAR; year++) {
      // Semana regular
      const regularWeek = title.weeksByYear?.[year];
      if (regularWeek) {
        const fechaInicio = getFechaInicioSemana(year, regularWeek);
        const fechaFin = getFechaFinSemana(year, regularWeek);

        calendar.push({
          year,
          weekNumber: regularWeek,
          type: 'regular',
          startDate: format(fechaInicio, 'dd/MM/yyyy', { locale: es }),
          endDate: format(fechaFin, 'dd/MM/yyyy', { locale: es })
        });
      }

      // Semanas especiales
      const specialWeeks = title.specialWeeksByYear?.[year] || [];
      specialWeeks.forEach(special => {
        const fechaInicio = getFechaInicioSemana(year, special.week);
        const fechaFin = getFechaFinSemana(year, special.week);
        
        calendar.push({
          year,
          weekNumber: special.week,
          type: 'special',
          specialType: special.type,
          specialName: NOMBRES_SEMANAS_ESPECIALES[special.type] || special.type,
          startDate: format(fechaInicio, 'dd/MM/yyyy', { locale: es }),
          endDate: format(fechaFin, 'dd/MM/yyyy', { locale: es })
        });
      });
    }

    return calendar.sort((a, b) => a.year - b.year || a.weekNumber - b.weekNumber);
  };

  const handleDownloadPDF = () => {
    try {
      const doc = generarPDFTitulo(title, userName);
      doc.save(`Calendario_${title.id}_2027-2100.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF');
    }
  };

  const fullCalendar = generateFullCalendar();

  // Agrupar por año para vista de tabla
  const calendarByYear = fullCalendar.reduce((acc, entry) => {
    if (!acc[entry.year]) {
      acc[entry.year] = [];
    }
    acc[entry.year].push(entry);
    return acc;
  }, {});

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <CalendarIcon size={28} />
            <div>
              <h2 className="text-2xl font-bold">
                Calendario Completo - Título {title.id}
              </h2>
              <p className="text-gray-200 text-sm mt-1">
                Vista de 74 años (2027 - 2100)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Info del título */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              <div>
                <span className="text-sm text-gray-600">Serie:</span>
                <span className="ml-2 font-bold text-gray-900">{title.serie}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Subserie:</span>
                <span className="ml-2 font-bold text-gray-900">{title.subserie}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Número:</span>
                <span className="ml-2 font-bold text-gray-900">{title.number}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Total entradas:</span>
                <span className="ml-2 font-bold text-gray-900">{fullCalendar.length}</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadPDF}
              >
                <Download size={16} className="mr-2" />
                Descargar PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Contenido scrollable - TABLA */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {Object.entries(calendarByYear).map(([year, entries]) => (
              <div key={year} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Header del año */}
                <div className="bg-gray-800 text-white px-4 py-2 font-bold text-lg">
                  Año {year}
                </div>
                
                {/* Tabla de semanas */}
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-1/4">
                        Tipo de Semana
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-1/6">
                        Semana #
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-7/12">
                        Fechas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {entries.map((entry, idx) => (
                      <tr 
                        key={idx}
                        className={`${
                          entry.type === 'special' 
                            ? 'bg-orange-50 hover:bg-orange-100' 
                            : idx % 2 === 0 
                            ? 'bg-white hover:bg-gray-50' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        } transition-colors`}
                      >
                        <td className="px-4 py-3">
                          {entry.type === 'special' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-500 text-white">
                              ⭐ {entry.specialName}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-600 text-white">
                              Regular
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-gray-900">
                          {entry.weekNumber}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <span className="font-semibold">{entry.startDate}</span>
                          <span className="mx-2 text-gray-400">→</span>
                          <span className="font-semibold">{entry.endDate}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex items-center justify-between rounded-b-lg">
          <div className="text-sm text-gray-600">
            <strong>{fullCalendar.filter(e => e.type === 'regular').length}</strong> semanas regulares • 
            <strong className="ml-2">{fullCalendar.filter(e => e.type === 'special').length}</strong> semanas VIP
          </div>
          <Button onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TitleCalendarModal;