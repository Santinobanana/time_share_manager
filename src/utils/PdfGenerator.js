import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
applyPlugin(jsPDF);
import { format, getWeek, startOfYear, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  calcularPascua, 
  obtenerNumeroSemana,
  NOMBRES_SEMANAS_ESPECIALES 
} from './specialweeks';

/**
 * Calcula la fecha de inicio de una semana específica en un año
 * @param {number} year - Año
 * @param {number} weekNumber - Número de semana (1-52)
 * @returns {Date} Fecha de inicio de la semana (lunes)
 */
const getFechaInicioSemana = (year, weekNumber) => {
  const inicioAno = startOfYear(new Date(year, 0, 1));
  const diasHastaLunes = (8 - inicioAno.getDay()) % 7 || 7;
  const primerLunes = addDays(inicioAno, diasHastaLunes);
  const diasDesdeInicio = (weekNumber - 1) * 7;
  return addDays(primerLunes, diasDesdeInicio);
};

/**
 * Calcula la fecha de fin de una semana específica en un año
 * @param {number} year - Año
 * @param {number} weekNumber - Número de semana (1-52)
 * @returns {Date} Fecha de fin de la semana (domingo)
 */
const getFechaFinSemana = (year, weekNumber) => {
  const inicioSemana = getFechaInicioSemana(year, weekNumber);
  return addDays(inicioSemana, 6);
};

/**
 * Obtiene información de semanas especiales para un año
 * @param {number} year - Año
 * @returns {Object} Mapeo de número de semana a tipo especial
 */
const getSemanasEspecialesDelAno = (year) => {
  const pascua = calcularPascua(year);
  const semanaSanta = new Date(pascua);
  semanaSanta.setDate(semanaSanta.getDate() - 7);

  const semanasEspeciales = {};
  semanasEspeciales[obtenerNumeroSemana(semanaSanta)] = 'SANTA';
  semanasEspeciales[obtenerNumeroSemana(pascua)] = 'PASCUA';
  semanasEspeciales[51] = 'NAVIDAD';
  semanasEspeciales[52] = 'FIN_ANO';

  return semanasEspeciales;
};

/**
 * Genera datos de calendario para un título en un rango de años
 * @param {Object} title - Datos del título
 * @param {number} startYear - Año inicial (default: 2027)
 * @param {number} endYear - Año final (default: 2074)
 * @returns {Array} Array de objetos con datos de cada año
 */
const generarDatosCalendario = (title, startYear = 2027, endYear = 2074) => {
  const datos = [];

  for (let year = startYear; year <= endYear; year++) {
    const semanasEspeciales = getSemanasEspecialesDelAno(year);
    
    // Semana regular
    const semanaRegular = title.weeksByYear?.[year];
    if (semanaRegular) {
      const tipoEspecial = semanasEspeciales[semanaRegular];
      const fechaInicio = getFechaInicioSemana(year, semanaRegular);
      const fechaFin = getFechaFinSemana(year, semanaRegular);

      datos.push({
        year,
        tipoSemana: tipoEspecial ? NOMBRES_SEMANAS_ESPECIALES[tipoEspecial] : 'Regular',
        numeroSemana: semanaRegular,
        fecha: `${format(fechaInicio, 'dd/MM', { locale: es })} - ${format(fechaFin, 'dd/MM/yyyy', { locale: es })}`,
        esEspecial: !!tipoEspecial
      });
    }

    // Semanas especiales adicionales
    if (title.specialWeeksByYear?.[year]) {
      title.specialWeeksByYear[year].forEach(specialWeek => {
        const fechaInicio = getFechaInicioSemana(year, specialWeek.week);
        const fechaFin = getFechaFinSemana(year, specialWeek.week);

        datos.push({
          year,
          tipoSemana: NOMBRES_SEMANAS_ESPECIALES[specialWeek.type],
          numeroSemana: specialWeek.week,
          fecha: `${format(fechaInicio, 'dd/MM', { locale: es })} - ${format(fechaFin, 'dd/MM/yyyy', { locale: es })}`,
          esEspecial: true
        });
      });
    }
  }

  return datos.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.numeroSemana - b.numeroSemana;
  });
};

/**
 * Genera PDF con calendario de un título
 * @param {Object} title - Datos del título
 * @param {string} userName - Nombre del usuario propietario
 * @returns {jsPDF} Objeto PDF generado
 */
export const generarPDFTitulo = (title, userName = '') => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  // Título del documento
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text(`Calendario Título ${title.id}`, 105, 20, { align: 'center' });

  // Información del título
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`Serie: ${title.serie} | Subserie: ${title.subserie} | Número: ${title.number}`, 105, 28, { align: 'center' });
  
  if (userName) {
    doc.text(`Propietario: ${userName}`, 105, 35, { align: 'center' });
  }

  doc.setFontSize(10);
  doc.text('Calendario 2027 - 2074 (48 años)', 105, 42, { align: 'center' });

  // Línea separadora
  doc.setDrawColor(200);
  doc.line(20, 45, 195, 45);

  // Generar datos
  const datos = generarDatosCalendario(title);

  // Preparar datos para la tabla
  const tableData = datos.map(d => [
    d.year.toString(),
    d.tipoSemana,
    d.numeroSemana.toString(),
    d.fecha
  ]);

  // Generar tabla con autoTable
  doc.autoTable({
    startY: 50,
    head: [['Año', 'Tipo de Semana', 'Semana #', 'Fecha']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 25 },  // Año
      1: { halign: 'left', cellWidth: 55 },    // Tipo
      2: { halign: 'center', cellWidth: 30 },  // Semana #
      3: { halign: 'left', cellWidth: 65 }     // Fecha
    },
    didParseCell: function(data) {
      // Resaltar filas de semanas especiales
      const rowData = datos[data.row.index];
      if (rowData && rowData.esEspecial) {
        if (data.column.index === 1) { // Columna tipo
          data.cell.styles.textColor = [255, 140, 0]; // Naranja
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 20, right: 20 }
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount}`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    doc.text(
      `Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`,
      105,
      doc.internal.pageSize.height - 6,
      { align: 'center' }
    );
  }

  return doc;
};

/**
 * Genera PDF con calendario de múltiples títulos
 * @param {Array} titles - Array de títulos con datos
 * @param {string} userName - Nombre del usuario propietario
 * @returns {jsPDF} Objeto PDF generado
 */
export const generarPDFMultiplesTitulos = (titles, userName = '') => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  // Título del documento
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('Calendario de Títulos', 105, 20, { align: 'center' });

  // Información del usuario
  if (userName) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text(`Propietario: ${userName}`, 105, 30, { align: 'center' });
  }

  doc.setFontSize(10);
  doc.text(`Total de títulos: ${titles.length}`, 105, 38, { align: 'center' });
  doc.text('Calendario 2027 - 2074 (48 años)', 105, 44, { align: 'center' });

  // Línea separadora
  doc.setDrawColor(200);
  doc.line(20, 48, 195, 48);

  let currentY = 55;
  let isFirstTitle = true;

  titles.forEach((title, index) => {
    // Agregar nueva página si es necesario (excepto para el primer título)
    if (!isFirstTitle && currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    // Título del título (valga la redundancia)
    if (currentY + 60 > doc.internal.pageSize.height - 20) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(66, 66, 66);
    doc.text(`Título ${title.id}`, 20, currentY);
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Serie: ${title.serie} | Subserie: ${title.subserie} | Número: ${title.number}`, 20, currentY + 5);

    currentY += 10;

    // Generar datos del título
    const datos = generarDatosCalendario(title);
    const tableData = datos.map(d => [
      d.year.toString(),
      d.tipoSemana,
      d.numeroSemana.toString(),
      d.fecha
    ]);

    // Tabla para este título
    doc.autoTable({
      startY: currentY,
      head: [['Año', 'Tipo', 'Sem.', 'Fecha']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      bodyStyles: {
        fontSize: 7,
        cellPadding: 2
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 },  // Año
        1: { halign: 'left', cellWidth: 50 },    // Tipo
        2: { halign: 'center', cellWidth: 20 },  // Semana
        3: { halign: 'left', cellWidth: 60 }     // Fecha
      },
      didParseCell: function(data) {
        const rowData = datos[data.row.index];
        if (rowData && rowData.esEspecial && data.column.index === 1) {
          data.cell.styles.textColor = [255, 140, 0];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      margin: { left: 20, right: 20 }
    });

    currentY = doc.lastAutoTable.finalY + 10;
    isFirstTitle = false;
  });

  // Footer en todas las páginas
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount}`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    doc.text(
      `Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`,
      105,
      doc.internal.pageSize.height - 6,
      { align: 'center' }
    );
  }

  return doc;
};

/**
 * Descarga un PDF
 * @param {jsPDF} doc - Documento PDF
 * @param {string} filename - Nombre del archivo
 */
export const descargarPDF = (doc, filename) => {
  doc.save(filename);
};

/**
 * Función principal para generar y descargar PDF de un título
 * @param {Object} title - Datos del título
 * @param {string} userName - Nombre del usuario
 */
export const generarYDescargarPDFTitulo = (title, userName = '') => {
  const doc = generarPDFTitulo(title, userName);
  const filename = `Calendario_${title.id}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  descargarPDF(doc, filename);
};

/**
 * Función principal para generar y descargar PDF de múltiples títulos
 * @param {Array} titles - Array de títulos
 * @param {string} userName - Nombre del usuario
 */
export const generarYDescargarPDFMultiplesTitulos = (titles, userName = '') => {
  const doc = generarPDFMultiplesTitulos(titles, userName);
  const filename = `Calendario_Titulos_${userName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  descargarPDF(doc, filename);
};