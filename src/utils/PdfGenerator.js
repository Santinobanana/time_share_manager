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
export const generarPDFMultiplesTitulos = (titles, userName = '', startYear = 2027) => {
  const endYear = startYear + 47;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.width;
  const margin = 8;

  // Portada
  doc.setFontSize(22).setFont(undefined, 'bold');
  doc.text('CALENDARIO DE SEMANAS', pageWidth / 2, 60, { align: 'center' });
  doc.setFontSize(16).setFont(undefined, 'normal');
  doc.text(`Propietario: ${userName}`, pageWidth / 2, 75, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Periodo de 48 años: ${startYear} - ${endYear}`, pageWidth / 2, 85, { align: 'center' });

  titles.forEach((title) => {
    doc.addPage();
    const usableWidth = pageWidth - (margin * 2);
    const anchoColumna = (usableWidth - 9) / 4;
    const posicionesX = [margin, margin + anchoColumna + 3, margin + (anchoColumna + 3) * 2, margin + (anchoColumna + 3) * 3];

    doc.setFontSize(14).setFont(undefined, 'bold');
    doc.text(`Título: ${title.id}`, pageWidth / 2, 10, { align: 'center' });
    doc.setFontSize(8).setFont(undefined, 'normal');
    doc.text(`Serie: ${title.serie} | Rango: ${startYear} - ${endYear}`, pageWidth / 2, 16, { align: 'center' });

    const datosTotales = generarDatosCalendario(title, startYear, endYear);

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
  });

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