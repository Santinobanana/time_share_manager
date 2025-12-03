import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Calendar, Download, Filter, RefreshCw, FileText, X } from 'lucide-react';
import { getTitlesByUser, getUserWeeksForYear } from '../services/titleService';
import { addDays, startOfYear, format } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  getFechaInicioSemana,
  getFechaFinSemana,
  calcularSemanasEspeciales,
  NOMBRES_SEMANAS_ESPECIALES
} from '../services/weekCalculationService';

export default function MyWeeks() {
  const { user } = useAuth();
  const [userTitles, setUserTitles] = useState([]);
  const [userWeeks, setUserWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2027);
  const [filterType, setFilterType] = useState('all');
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  const years = Array.from({ length: 10 }, (_, i) => 2027 + i);

  useEffect(() => {
    if (user) {
      loadUserWeeks();
    }
  }, [user, selectedYear]);

  const loadUserWeeks = async () => {
    try {
      setLoading(true);
      
      if (!user.titles || user.titles.length === 0) {
        setUserTitles([]);
        setUserWeeks([]);
        return;
      }

      const [titlesData, weeksData] = await Promise.all([
        getTitlesByUser(user.uid),
        getUserWeeksForYear(user.uid, selectedYear)
      ]);

      setUserTitles(titlesData);
      
      if (weeksData && weeksData.all && Array.isArray(weeksData.all)) {
        const weeksWithDates = weeksData.all.map(week => ({
          ...week,
          startDate: format(getFechaInicioSemana(selectedYear, week.weekNumber), 'dd/MM', { locale: es }),
          endDate: format(getFechaFinSemana(selectedYear, week.weekNumber), 'dd/MM/yyyy', { locale: es })
        }));
        setUserWeeks(weeksWithDates);
      } else if (Array.isArray(weeksData)) {
        const weeksWithDates = weeksData.map(week => ({
          ...week,
          startDate: format(getFechaInicioSemana(selectedYear, week.weekNumber), 'dd/MM', { locale: es }),
          endDate: format(getFechaFinSemana(selectedYear, week.weekNumber), 'dd/MM/yyyy', { locale: es })
        }));
        setUserWeeks(weeksWithDates);
      } else {
        setUserWeeks([]);
      }
    } catch (error) {
      console.error('Error cargando semanas:', error);
      setUserWeeks([]);
    } finally {
      setLoading(false);
    }
  };

  const getSerieColor = (titleId) => {
    if (!titleId) return 'bg-gray-200';
    const serie = typeof titleId === 'string' ? titleId.charAt(0) : titleId.serie;
    return {
      'A': 'bg-serie-a',
      'B': 'bg-serie-b',
      'C': 'bg-serie-c',
      'D': 'bg-serie-d'
    }[serie] || 'bg-gray-200';
  };

  /**
   * Exportar a CSV
   */
  const handleExportCSV = () => {
    try {
      setExporting(true);
      
      const csvData = filteredWeeks.map(week => ({
        'Título': week.titleId,
        'Serie': week.serie,
        'Subserie': week.subserie || '',
        'Número': week.number,
        'Semana': week.weekNumber,
        'Tipo': week.type === 'special' ? `VIP (${week.specialName})` : 'Regular',
        'Fecha Inicio': week.startDate,
        'Fecha Fin': week.endDate,
        'Intercambiado': week.isExchanged ? 'Sí' : 'No'
      }));

      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',') 
              ? `"${value}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `Mis_Semanas_${selectedYear}_${format(new Date(), 'yyyyMMdd')}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowExportModal(false);
      alert('Archivo CSV descargado exitosamente');
    } catch (error) {
      console.error('Error exportando CSV:', error);
      alert('Error al exportar archivo CSV');
    } finally {
      setExporting(false);
    }
  };

  /**
   * NUEVO: Exportar a PDF
   */
  const handleExportPDF = () => {
    try {
      setExporting(true);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Encabezado
      doc.setFillColor(79, 70, 229); // Indigo
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('MIS SEMANAS', pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(`Año ${selectedYear}`, pageWidth / 2, 25, { align: 'center' });

      // Información del usuario
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`Usuario: ${user.name || user.email}`, 14, 50);
      doc.text(`Títulos: ${userTitles.length}`, 14, 56);
      doc.text(`Total Semanas: ${filteredWeeks.length}`, 14, 62);
      doc.text(`Filtro: ${filterType === 'all' ? 'Todas' : filterType === 'regular' ? 'Regulares' : 'VIP'}`, 14, 68);
      doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, 14, 74);

      // Tabla de semanas
      const tableData = filteredWeeks.map(week => [
        week.weekNumber.toString(),
        week.titleId,
        week.serie,
        week.number.toString(),
        week.type === 'special' ? `VIP (${week.specialName})` : 'Regular',
        `${week.startDate} - ${week.endDate}`,
        week.isExchanged ? 'Sí' : 'No'
      ]);

      doc.autoTable({
        startY: 82,
        head: [['Sem.', 'Título', 'Serie', 'Núm.', 'Tipo', 'Fechas', 'Intercamb.']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 25 },
          2: { cellWidth: 15, halign: 'center' },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 35 },
          5: { cellWidth: 50 },
          6: { cellWidth: 20, halign: 'center' }
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        didParseCell: function(data) {
          // Resaltar semanas VIP
          if (data.row.index >= 0 && data.column.index === 4) {
            const cellValue = data.cell.raw;
            if (cellValue && cellValue.toString().startsWith('VIP')) {
              data.cell.styles.fillColor = [255, 237, 213]; // Naranja claro
              data.cell.styles.textColor = [194, 65, 12]; // Naranja oscuro
              data.cell.styles.fontStyle = 'bold';
            }
          }
          
          // Resaltar intercambiadas
          if (data.row.index >= 0 && data.column.index === 6) {
            if (data.cell.raw === 'Sí') {
              data.cell.styles.fillColor = [219, 234, 254]; // Azul claro
              data.cell.styles.textColor = [29, 78, 216]; // Azul oscuro
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });

      // Footer en todas las páginas
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Página ${i} de ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Descargar
      doc.save(`Mis_Semanas_${selectedYear}_${format(new Date(), 'yyyyMMdd')}.pdf`);

      setShowExportModal(false);
      alert('Archivo PDF descargado exitosamente');
    } catch (error) {
      console.error('Error exportando PDF:', error);
      alert('Error al exportar archivo PDF: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const handleWeekClick = (week) => {
    setSelectedWeek(week);
    setShowDetailsModal(true);
  };

  const filteredWeeks = userWeeks.filter(week => {
    if (filterType === 'all') return true;
    if (filterType === 'regular') return week.type === 'regular';
    if (filterType === 'special') return week.type === 'special';
    return true;
  });

  const regularCount = userWeeks.filter(w => w.type === 'regular').length;
  const specialCount = userWeeks.filter(w => w.type === 'special').length;

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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mis Semanas</h1>
        <p className="text-gray-600 mt-1">
          Visualiza todas las semanas asignadas a tus títulos
        </p>
      </div>

      {userTitles.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Calendar size={64} className="mx-auto text-gray-300 mb-4" />
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
          {/* Controles */}
          <Card className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-gray-600" />
                <label className="font-medium text-gray-700">Año:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-gray-500"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <Filter size={20} className="text-gray-600" />
                <label className="font-medium text-gray-700">Tipo:</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-gray-500"
                >
                  <option value="all">Todas ({userWeeks.length})</option>
                  <option value="regular">Regulares ({regularCount})</option>
                  <option value="special">VIP ({specialCount})</option>
                </select>
              </div>

              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setShowExportModal(true)}
                disabled={filteredWeeks.length === 0}
              >
                <Download size={16} className="mr-2" />
                Exportar
              </Button>
            </div>
          </Card>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{userTitles.length}</p>
                <p className="text-sm text-gray-600 mt-1">Títulos</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{userWeeks.length}</p>
                <p className="text-sm text-gray-600 mt-1">Total Semanas</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{regularCount}</p>
                <p className="text-sm text-gray-600 mt-1">Regulares</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{specialCount}</p>
                <p className="text-sm text-gray-600 mt-1">VIP</p>
              </div>
            </Card>
          </div>

          {/* Lista de semanas */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">
              Semanas del {selectedYear} ({filteredWeeks.length})
            </h3>
            
            {filteredWeeks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay semanas con los filtros seleccionados
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredWeeks.map((week, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleWeekClick(week)}
                    className={`
                      ${getSerieColor(week.titleId)}
                      p-4 rounded-lg cursor-pointer
                      hover:shadow-md transition-shadow
                      border-2 ${week.type === 'special' ? 'border-orange-400' : 'border-transparent'}
                      relative
                    `}
                  >
                    {week.type === 'special' && (
                      <div className="absolute top-2 right-2 text-orange-600">
                        <span className="text-xl">⭐</span>
                      </div>
                    )}
                    {week.isExchanged && (
                      <div className="absolute top-2 left-2 text-blue-600" title="Semana intercambiada">
                        <span className="text-sm">🔄</span>
                      </div>
                    )}
                    <div className="font-bold text-lg">Semana {week.weekNumber}</div>
                    <div className="text-sm mt-1">{week.titleId}</div>
                    {week.type === 'special' && (
                      <div className="text-xs mt-1 font-medium text-orange-700">
                        {week.specialName}
                      </div>
                    )}
                    <div className="text-xs mt-2 opacity-75">
                      {week.startDate} - {week.endDate}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Modal de opciones de exportación */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Exportar Semanas</h3>
              <button 
                onClick={() => setShowExportModal(false)} 
                className="text-gray-400 hover:text-gray-600"
                disabled={exporting}
              >
                <X size={24} />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              Selecciona el formato para exportar tus {filteredWeeks.length} semanas del año {selectedYear}
            </p>

            <div className="space-y-3">
              <Button
                variant="primary"
                className="w-full justify-start"
                onClick={handleExportPDF}
                disabled={exporting}
              >
                <FileText size={20} className="mr-3" />
                <div className="text-left">
                  <div className="font-medium">Exportar como PDF</div>
                  <div className="text-xs opacity-75">Documento profesional con tabla</div>
                </div>
              </Button>

              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={handleExportCSV}
                disabled={exporting}
              >
                <Download size={20} className="mr-3" />
                <div className="text-left">
                  <div className="font-medium">Exportar como CSV</div>
                  <div className="text-xs opacity-75">Compatible con Excel y Google Sheets</div>
                </div>
              </Button>
            </div>

            <Button
              variant="secondary"
              className="w-full mt-4"
              onClick={() => setShowExportModal(false)}
              disabled={exporting}
            >
              {exporting ? 'Exportando...' : 'Cancelar'}
            </Button>
          </div>
        </div>
      )}

      {/* Modal de detalles de semana */}
      {showDetailsModal && selectedWeek && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Detalles de Semana</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className={`${getSerieColor(selectedWeek.titleId)} p-4 rounded-lg mb-4`}>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">Semana {selectedWeek.weekNumber}</div>
                {selectedWeek.type === 'special' && <span className="text-2xl">⭐</span>}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Título:</label>
                <p className="text-lg">{selectedWeek.titleId}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Serie:</label>
                  <p>{selectedWeek.serie}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Subserie:</label>
                  <p>{selectedWeek.subserie || 'N/A'}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Tipo:</label>
                <p>{selectedWeek.type === 'special' ? `VIP - ${selectedWeek.specialName}` : 'Regular'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Fechas:</label>
                <p>{selectedWeek.startDate} - {selectedWeek.endDate}</p>
              </div>

              {selectedWeek.isExchanged && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    🔄 Esta semana fue obtenida mediante un intercambio
                  </p>
                </div>
              )}
            </div>

            <Button
              variant="secondary"
              className="w-full mt-6"
              onClick={() => setShowDetailsModal(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}