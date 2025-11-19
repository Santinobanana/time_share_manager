import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { applyPlugin } from 'jspdf-autotable';
applyPlugin(jsPDF);
import { format, startOfYear, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  calcularPascua, 
  obtenerNumeroSemana,
  NOMBRES_SEMANAS_ESPECIALES 
} from './specialweeks';

/**
 * Calcula la fecha de inicio de una semana específica en un año
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
 */
const getFechaFinSemana = (year, weekNumber) => {
  const inicioSemana = getFechaInicioSemana(year, weekNumber);
  return addDays(inicioSemana, 6);
};

/**
 * Obtiene información de semanas especiales para un año
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
 * EXTENDIDO HASTA 2100
 */
const generarDatosCalendario = (title, startYear = 2027, endYear = 2100) => {
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
          fecha: `${format(fechaInicio, 'dd/MM', { locale: es })} - ${format(fechaFin, 'dd/MM/yyyy', { locale: es })}`,
          esEspecial: true
        });
      });
    }
  }

  return datos.sort((a, b) => a.year - b.year);
};

/**
 * Divide un array en N partes lo más iguales posible
 */
const dividirEnPartes = (array, numPartes) => {
  const resultado = [];
  const tamañoParte = Math.ceil(array.length / numPartes);
  
  for (let i = 0; i < numPartes; i++) {
    const inicio = i * tamañoParte;
    const fin = inicio + tamañoParte;
    resultado.push(array.slice(inicio, fin));
  }
  
  return resultado;
};

/**
 * Genera PDF con calendario de un título EN 2 COLUMNAS
 * HASTA EL AÑO 2100
 */
export const generarPDFTitulo = (title, userName = '') => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 12;
  const usableWidth = pageWidth - (margin * 2);

  // Título del documento
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(`Calendario Título ${title.id}`, pageWidth / 2, 15, { align: 'center' });

  // Información del título
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Serie: ${title.serie} | Subserie: ${title.subserie} | Número: ${title.number}`, pageWidth / 2, 22, { align: 'center' });
  
  if (userName) {
    doc.text(`Propietario: ${userName}`, pageWidth / 2, 28, { align: 'center' });
  }

  doc.setFontSize(9);
  doc.text('Calendario 2027 - 2100 (74 años)', pageWidth / 2, 34, { align: 'center' });

  // Línea separadora
  doc.setDrawColor(200);
  doc.line(margin, 38, pageWidth - margin, 38);

  // Generar datos (2027-2100 = 74 años)
  const datos = generarDatosCalendario(title);

  // Dividir en 2 columnas
  const columnas = dividirEnPartes(datos, 2);
  
  // Ancho de cada columna (con espacio entre ellas)
  const espacioEntreColumnas = 6;
  const anchoColumna = (usableWidth - espacioEntreColumnas) / 2;
  
  // Posiciones X de cada columna
  const xColumna1 = margin;
  const xColumna2 = margin + anchoColumna + espacioEntreColumnas;
  
  const posicionesX = [xColumna1, xColumna2];
  const yInicio = 44;

  // Generar cada columna
  columnas.forEach((datosColumna, indexColumna) => {
    if (datosColumna.length === 0) return;

    const tableData = datosColumna.map(d => [
      d.year.toString(),
      d.tipoSemana,
      d.fecha
    ]);

    doc.autoTable({
      startY: yInicio,
      margin: { left: posicionesX[indexColumna], right: 0 },
      tableWidth: anchoColumna,
      head: [['Año', 'Tipo', 'Fecha']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        cellPadding: 2.5
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: [220, 220, 220],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: anchoColumna * 0.22 },  // Año
        1: { halign: 'left', cellWidth: anchoColumna * 0.40 },    // Tipo
        2: { halign: 'left', cellWidth: anchoColumna * 0.38 }     // Fecha
      },
      didParseCell: function(data) {
        const rowData = datosColumna[data.row.index];
        if (rowData && rowData.esEspecial && data.column.index === 1) {
          data.cell.styles.textColor = [255, 140, 0];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    `Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`,
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  );

  return doc;
};

/**
 * Genera PDF con calendario de múltiples títulos
 * Cada título en su propia página con 2 columnas
 * HASTA EL AÑO 2100
 */
export const generarPDFMultiplesTitulos = (titles, userName = '') => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 12;
  const usableWidth = pageWidth - (margin * 2);

  // Primera página - portada
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('Calendario de Títulos', pageWidth / 2, 40, { align: 'center' });

  if (userName) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text(`Propietario: ${userName}`, pageWidth / 2, 55, { align: 'center' });
  }

  doc.setFontSize(11);
  doc.text(`Total de títulos: ${titles.length}`, pageWidth / 2, 70, { align: 'center' });
  doc.text('Calendario 2027 - 2100 (74 años)', pageWidth / 2, 78, { align: 'center' });

  // Lista de títulos en la portada
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('Títulos incluidos:', pageWidth / 2, 95, { align: 'center' });
  
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  
  let yPos = 105;
  const titulosPorColumna = Math.ceil(titles.length / 2);
  
  titles.forEach((title, index) => {
    const serieColor = {
      'A': [139, 195, 74],
      'B': [33, 150, 243],
      'C': [255, 152, 0],
      'D': [156, 39, 176]
    }[title.serie] || [128, 128, 128];
    
    doc.setTextColor(...serieColor);
    
    // Dividir en dos columnas si hay muchos títulos
    const xPos = index < titulosPorColumna ? pageWidth / 3 : (pageWidth * 2) / 3;
    const yPosReal = index < titulosPorColumna ? yPos : yPos - (titulosPorColumna * 6);
    
    doc.text(`• ${title.id}`, xPos, yPosReal, { align: 'center' });
    
    if (index < titulosPorColumna) {
      yPos += 6;
    }
    
    // Nueva página si es necesario
    if (yPos > pageHeight - 30 && index === titulosPorColumna - 1 && titles.length > titulosPorColumna * 2) {
      doc.addPage();
      yPos = 30;
    }
  });

  // Generar página para cada título
  titles.forEach((title, index) => {
    doc.addPage();
    
    const espacioEntreColumnas = 6;
    const anchoColumna = (usableWidth - espacioEntreColumnas) / 2;
    
    // Header del título
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(66, 66, 66);
    doc.text(`Título ${title.id}`, pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`Serie: ${title.serie} | Subserie: ${title.subserie} | Número: ${title.number}`, pageWidth / 2, 22, { align: 'center' });
    
    doc.setFontSize(8);
    doc.text('2027 - 2100 (74 años)', pageWidth / 2, 28, { align: 'center' });
    
    doc.setDrawColor(200);
    doc.line(margin, 32, pageWidth - margin, 32);

    // Generar datos y dividir en 2 columnas
    const datos = generarDatosCalendario(title);
    const columnas = dividirEnPartes(datos, 2);
    
    const xColumna1 = margin;
    const xColumna2 = margin + anchoColumna + espacioEntreColumnas;
    const posicionesX = [xColumna1, xColumna2];
    const yInicio = 38;

    // Generar tablas en columnas
    columnas.forEach((datosColumna, indexColumna) => {
      if (datosColumna.length === 0) return;

      const tableData = datosColumna.map(d => [
        d.year.toString(),
        d.tipoSemana,
        d.fecha
      ]);

      doc.autoTable({
        startY: yInicio,
        margin: { left: posicionesX[indexColumna], right: 0 },
        tableWidth: anchoColumna,
        head: [['Año', 'Tipo', 'Fecha']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [66, 66, 66],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center',
          cellPadding: 2
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248]
        },
        bodyStyles: {
          fontSize: 7.5,
          cellPadding: 1.8,
          lineColor: [230, 230, 230],
          lineWidth: 0.1
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: anchoColumna * 0.22 },
          1: { halign: 'left', cellWidth: anchoColumna * 0.40 },
          2: { halign: 'left', cellWidth: anchoColumna * 0.38 }
        },
        didParseCell: function(data) {
          const rowData = datosColumna[data.row.index];
          if (rowData && rowData.esEspecial && data.column.index === 1) {
            data.cell.styles.textColor = [255, 140, 0];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });
    });
  });

  // Footer en todas las páginas
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    
    if (i > 1) {
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
    
    doc.text(
      `Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  return doc;
};

/**
 * Descarga un PDF
 */
export const descargarPDF = (doc, filename) => {
  doc.save(filename);
};

/**
 * Función principal para generar y descargar PDF de un título
 */
export const generarYDescargarPDFTitulo = (title, userName = '') => {
  const doc = generarPDFTitulo(title, userName);
  const filename = `Calendario_${title.id}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  descargarPDF(doc, filename);
};

/**
 * Función principal para generar y descargar PDF de múltiples títulos
 */
export const generarYDescargarPDFMultiplesTitulos = (titles, userName = '') => {
  const doc = generarPDFMultiplesTitulos(titles, userName);
  const filename = `Calendario_Titulos_${userName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  descargarPDF(doc, filename);
};