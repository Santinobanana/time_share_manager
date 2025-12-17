import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { applyPlugin } from 'jspdf-autotable';
applyPlugin(jsPDF);
import { format, startOfYear, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  calcularPascua,
  obtenerNumeroSemana,
  NOMBRES_SEMANAS_ESPECIALES,
  getFechaInicioSemana,
  getFechaFinSemana,
  calcularSemanasEspeciales as getSemanasEspecialesDelAno
} from '../services/weekCalculationService';

/**
 * Genera datos de calendario para un título en un rango de años
 * EXTENDIDO HASTA 2100
 */
const generarDatosCalendario = (title, startYear, endYear) => {
  const datos = [];
  for (let year = startYear; year <= endYear; year++) {
    const semanasEspeciales = getSemanasEspecialesDelAno(year);
    const semanaRegular = title.weeksByYear?.[year];
    
    if (semanaRegular) {
      const tipoEspecial = semanasEspeciales[semanaRegular];
      datos.push({
        year,
        tipoSemana: tipoEspecial ? NOMBRES_SEMANAS_ESPECIALES[tipoEspecial] : 'Regular',
        fecha: `${format(getFechaInicioSemana(year, semanaRegular), 'dd/MM')} - ${format(getFechaFinSemana(year, semanaRegular), 'dd/MM/yy')}`,
        esEspecial: !!tipoEspecial,
        esBisiesta: false
      });
    }

    if (title.specialWeeksByYear?.[year]) {
      title.specialWeeksByYear[year].forEach(specialWeek => {
        const esBisiesta = specialWeek.type === 'BISIESTA';
        datos.push({
          year,
          tipoSemana: esBisiesta ? 'Rifa' : NOMBRES_SEMANAS_ESPECIALES[specialWeek.type],
          fecha: `${format(getFechaInicioSemana(year, specialWeek.week), 'dd/MM')} - ${format(getFechaFinSemana(year, specialWeek.week), 'dd/MM/yy')}`,
          esEspecial: !esBisiesta,
          esBisiesta: esBisiesta
        });
      });
    }
  }
  return datos;
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
 * Genera PDF con calendario de un título EN UNA SOLA PÁGINA
 * CON 4 COLUMNAS COMPACTAS
 * HASTA EL AÑO 2100
 */
export const generarPDFTitulo = (title, userName = '', startYear = 2027) => {
  const endYear = startYear + 47; // Ciclo de 48 años
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.width;
  const margin = 8;
  const usableWidth = pageWidth - (margin * 2);

  doc.setFontSize(14).setFont(undefined, 'bold');
  doc.text(`Calendario Título ${title.id}`, pageWidth / 2, 10, { align: 'center' });
  doc.setFontSize(8).setFont(undefined, 'normal');
  doc.text(`Serie: ${title.serie} | Rango: ${startYear} - ${endYear} (48 años)`, pageWidth / 2, 16, { align: 'center' });

  const datosTotales = generarDatosCalendario(title, startYear, endYear);
  const anchoColumna = (usableWidth - 9) / 4;
  const posicionesX = [margin, margin + anchoColumna + 3, margin + (anchoColumna + 3) * 2, margin + (anchoColumna + 3) * 3];

  // Dividir en 4 bloques de 12 años (para obtener las 13 fechas por columna)
  for (let i = 0; i < 4; i++) {
    const añoInicioCol = startYear + (i * 12);
    const añoFinCol = añoInicioCol + 11;
    const datosColumna = datosTotales.filter(d => d.year >= añoInicioCol && d.year <= añoFinCol);

    doc.autoTable({
      startY: 25,
      margin: { left: posicionesX[i] },
      tableWidth: anchoColumna,
      head: [['Año', 'Tipo', 'Fecha']],
      body: datosColumna.map(d => [d.year, d.tipoSemana, d.fecha]),
      theme: 'striped',
      headStyles: { fillColor: [66, 66, 66], fontSize: 7, halign: 'center' },
      bodyStyles: { fontSize: 6.5, cellPadding: 1.2 },
      didParseCell: function(data) {
        const rowData = datosColumna[data.row.index];
        if (rowData?.esEspecial && data.column.index === 1) data.cell.styles.textColor = [255, 140, 0];
        if (rowData?.esBisiesta && data.column.index === 1) data.cell.styles.textColor = [156, 39, 176];
      }
    });
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
 * Genera PDF con calendario de múltiples títulos
 * Cada título en su propia página horizontal con 4 columnas
 */
export const generarPDFMultiplesTitulos = (titles, userName = '') => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 12;

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
  const titulosPorColumna = Math.ceil(titles.length / 3);
  
  titles.forEach((title, index) => {
    const serieColor = {
      'A': [139, 195, 74],
      'B': [33, 150, 243],
      'C': [255, 152, 0],
      'D': [156, 39, 176]
    }[title.serie] || [128, 128, 128];
    
    doc.setTextColor(...serieColor);
    
    // Dividir en tres columnas
    const columna = Math.floor(index / titulosPorColumna);
    const xPos = margin + 20 + (columna * 80);
    const yPosReal = yPos + ((index % titulosPorColumna) * 6);
    
    doc.text(`• ${title.id}`, xPos, yPosReal);
  });

  // Generar página para cada título (usando la función optimizada)
  titles.forEach((title, index) => {
    doc.addPage();
    
    const espacioEntreColumnas = 3;
    const usableWidth = pageWidth - (margin * 2);
    const anchoColumna = (usableWidth - (espacioEntreColumnas * 3)) / 4;
    
    // Header del título
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(66, 66, 66);
    doc.text(`Título ${title.id}`, pageWidth / 2, 10, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(
      `Serie: ${title.serie} | Subserie: ${title.subserie} | Número: ${title.number}`,
      pageWidth / 2,
      15,
      { align: 'center' }
    );
    
    doc.setFontSize(7);
    doc.text('Calendario 2027 - 2100 (74 años)', pageWidth / 2, 19, { align: 'center' });
    
    doc.setDrawColor(200);
    doc.line(margin, 21, pageWidth - margin, 21);

    // Generar datos y dividir en 4 columnas
    const datos = generarDatosCalendario(title);
    const columnas = dividirEnPartes(datos, 4);
    
    const posicionesX = [
      margin,
      margin + anchoColumna + espacioEntreColumnas,
      margin + (anchoColumna + espacioEntreColumnas) * 2,
      margin + (anchoColumna + espacioEntreColumnas) * 3
    ];
    
    const yInicio = 24;

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
          fontSize: 7,
          halign: 'center',
          cellPadding: 1.5
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248]
        },
        bodyStyles: {
          fontSize: 6.5,
          cellPadding: 1.2,
          lineColor: [230, 230, 230],
          lineWidth: 0.1
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: anchoColumna * 0.20 },
          1: { halign: 'left', cellWidth: anchoColumna * 0.35 },
          2: { halign: 'left', cellWidth: anchoColumna * 0.45 }
        },
        didParseCell: function(data) {
          const rowData = datosColumna[data.row.index];
          
          if (rowData && rowData.esEspecial && data.column.index === 1) {
            data.cell.styles.textColor = [255, 140, 0];
            data.cell.styles.fontStyle = 'bold';
          }
          
          if (rowData && rowData.esBisiesta && data.column.index === 1) {
            data.cell.styles.textColor = [156, 39, 176];
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
    doc.setFontSize(6);
    doc.setTextColor(150);
    
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
    
    doc.text(
      `Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`,
      pageWidth / 2,
      pageHeight - 4,
      { align: 'center' }
    );
  }

  return doc;
};

/**
 * Función principal para generar y descargar PDF de múltiples títulos
 */
export const generarYDescargarPDFMultiplesTitulos = (titles, userName = '') => {
  const doc = generarPDFMultiplesTitulos(titles, userName);
  const filename = `Calendario_Titulos_${userName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  descargarPDF(doc, filename);
};