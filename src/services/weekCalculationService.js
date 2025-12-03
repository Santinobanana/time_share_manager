/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 📅 SERVICIO CENTRALIZADO DE CÁLCULO DE SEMANAS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ÚNICA FUENTE DE VERDAD para:
 * - Cálculo de Pascua y semanas especiales
 * - Números de semana del año
 * - Rotación de semanas VIP entre series y títulos
 * - Mapeo de semanas virtuales → reales
 * - Generación completa de semanas por año para cada título
 * 
 * Este servicio centraliza toda la lógica que estaba duplicada en:
 * - loadtitleswithspecialweeks.js (script)
 * - specialWeeks.js (frontend)
 * - PdfGenerator.js (generación PDF)
 * - AnnualWeeksCalendar.jsx (componente)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { addDays, startOfYear, getDay } from 'date-fns';

// ═══════════════════════════════════════════════════════════════════════════
// 🗓️ CÁLCULO DE FECHAS ESPECIALES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calcula la fecha de Pascua usando el algoritmo de Computus
 * @param {number} year - Año
 * @returns {Date} Fecha del domingo de Pascua
 */
export const calcularPascua = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=Marzo, 4=Abril
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
};

/**
 * Calcula el número de semana del año usando el sistema US-CALENDAR
 * (Semana comienza en DOMINGO)
 * @param {Date} date - Fecha
 * @returns {number} Número de semana (1-52/53)
 */
export const obtenerNumeroSemana = (date) => {
  const year = date.getFullYear();
  const firstDayOfYear = startOfYear(date);
  let primerDomingo = firstDayOfYear;
  const diaSemana = getDay(firstDayOfYear); // 0 = Domingo, 6 = Sábado

  // Mueve la fecha al primer Domingo del año
  if (diaSemana !== 0) {
    primerDomingo = addDays(primerDomingo, (7 - diaSemana));
  }
  
  // Si la fecha es antes del primer Domingo, es la semana 1
  if (date < primerDomingo) {
    return 1;
  }

  // Calcular diferencia en días desde el primer Domingo
  const diffTime = date.getTime() - primerDomingo.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Número de semana = 1 + (días transcurridos / 7)
  const weekNo = Math.floor(diffDays / 7) + 1;
  
  return weekNo;
};

/**
 * Calcula el total de semanas del año (52 o 53)
 * @param {number} year - Año
 * @returns {number} Total de semanas (52 o 53)
 */
export const getTotalWeeksInYear = (year) => {
  const lastDay = new Date(year, 11, 31);
  return obtenerNumeroSemana(lastDay);
};

export const isLeapYearUSCalendar = (year) => {
// Para el US-Calendar (Domingo-Sábado), un año tiene 53 semanas si el 31 de diciembre 
// cae en una semana que el sistema numera como 53.
// Usamos la misma lógica de getWeekDays/obtenerNumeroSemana para ser coherentes.
const lastDay = new Date(year, 11, 31);
const firstDayOfYear = new Date(year, 0, 1);
const firstDayWeekday = firstDayOfYear.getDay(); // 0=Domingo

let primerDomingo;
if (firstDayWeekday === 0) {
    primerDomingo = firstDayOfYear;
} else {
    const daysUntilSunday = 7 - firstDayWeekday;
    primerDomingo = addDays(firstDayOfYear, daysUntilSunday);
}

const weeksFromFirst = Math.floor((lastDay.getTime() - primerDomingo.getTime()) / (1000 * 60 * 60 * 24 * 7));

// Si la última semana completa o parcial del año es la semana 53, es bisiesto.
return weeksFromFirst >= 52;
};

/**
 * Verifica si un año tiene 53 semanas
 * @param {number} year - Año
 * @returns {boolean} True si tiene 53 semanas
 */
export const has53Weeks = (year) => {
  return isLeapYearUSCalendar(year);
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎄 SEMANAS ESPECIALES (VIP)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calcula la semana de Semana Santa (una semana antes de Pascua)
 * @param {number} year - Año
 * @returns {number} Número de semana
 */
export const calcularSemanaSanta = (year) => {
  const pascua = calcularPascua(year);
  const semanaSanta = new Date(pascua);
  semanaSanta.setDate(semanaSanta.getDate() - 7);
  return obtenerNumeroSemana(semanaSanta);
};

/**
 * Calcula la semana de Pascua
 * @param {number} year - Año
 * @returns {number} Número de semana
 */
export const calcularSemanaPascua = (year) => {
  const pascua = calcularPascua(year);
  return obtenerNumeroSemana(pascua);
};

/**
 * Calcula las semanas especiales para un año
 * ✅ INCLUYE CORRECCIÓN: Si el 25 de diciembre es domingo, Navidad VIP es la semana anterior
 * @param {number} year - Año
 * @returns {Object} { SANTA: number, PASCUA: number, NAVIDAD: number, FIN_ANO: number }
 */
export const calcularSemanasEspeciales = (year) => {
  const pascua = calcularPascua(year);
  const semanaSanta = new Date(pascua);
  semanaSanta.setDate(semanaSanta.getDate() - 7);
  
  // ✅ CORRECCIÓN: Si el 25 es domingo, usar semana anterior
  const navidad = new Date(year, 11, 25);
  const diaSemana25 = navidad.getDay(); // 0 = Domingo
  
  let fechaNavidadVIP;
  if (diaSemana25 === 0) {
    // 25 es domingo → Usar semana anterior (18-24)
    fechaNavidadVIP = new Date(year, 11, 18);
  } else {
    // 25 NO es domingo → Usar semana del 25
    fechaNavidadVIP = navidad;
  }
  
  const semanaNavidad = obtenerNumeroSemana(fechaNavidadVIP);
  
  const finAno = new Date(year, 11, 31);
  const semanaFinAno = obtenerNumeroSemana(finAno);
  
  return {
    SANTA: obtenerNumeroSemana(semanaSanta),
    PASCUA: obtenerNumeroSemana(pascua),
    NAVIDAD: semanaNavidad,
    FIN_ANO: semanaFinAno
  };
};

/**
 * Nombres en español de las semanas especiales
 */
export const NOMBRES_SEMANAS_ESPECIALES = {
  SANTA: 'Semana Santa',
  PASCUA: 'Semana Pascua',
  NAVIDAD: 'Navidad',
  FIN_ANO: 'Fin de Año'
};

/**
 * Verifica si un número de semana es una semana especial en un año dado
 * @param {number} weekNumber - Número de semana
 * @param {number} year - Año
 * @returns {string|null} Nombre de la semana especial o null
 */
export const esSemanEspecial = (weekNumber, year) => {
  const semanasEspeciales = calcularSemanasEspeciales(year);
  
  for (const [nombre, numeroSemana] of Object.entries(semanasEspeciales)) {
    if (numeroSemana === weekNumber) {
      return nombre;
    }
  }
  
  return null;
};

// ═══════════════════════════════════════════════════════════════════════════
// 🗓️ CÁLCULO DE FECHAS DE INICIO/FIN DE SEMANA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calcula la fecha de inicio de una semana (Domingo)
 * @param {number} year - Año
 * @param {number} weekNumber - Número de semana
 * @returns {Date} Fecha del domingo de inicio
 */
export const getFechaInicioSemana = (year, weekNumber) => {
  const firstDayOfYear = new Date(year, 0, 1);
  let primerDomingo = new Date(firstDayOfYear);
  const diaSemana = primerDomingo.getDay();
  
  // Mueve al primer Domingo del año
  if (diaSemana !== 0) {
    primerDomingo = addDays(primerDomingo, (7 - diaSemana));
  }
  
  const diasDesdeInicio = (weekNumber - 1) * 7;
  return addDays(primerDomingo, diasDesdeInicio);
};

/**
 * Calcula la fecha de fin de una semana (Sábado)
 * @param {number} year - Año
 * @param {number} weekNumber - Número de semana
 * @returns {Date} Fecha del sábado de fin
 */
export const getFechaFinSemana = (year, weekNumber) => {
  const inicioSemana = getFechaInicioSemana(year, weekNumber);
  return addDays(inicioSemana, 6);
};

// ═══════════════════════════════════════════════════════════════════════════
// 🔄 ROTACIÓN DE SEMANAS VIP Y TÍTULOS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Orden de las semanas VIP por fechas del año
 */
export const VIP_ORDER = ['SANTA', 'PASCUA', 'NAVIDAD', 'FIN_ANO'];

/**
 * Offset inicial por serie (posición en el ciclo VIP)
 */
export const OFFSET_POR_SERIE = {
  'A': 0,  // Serie A empieza en posición 0
  'B': 1,  // Serie B empieza en posición 1
  'C': 2,  // Serie C empieza en posición 2
  'D': 3   // Serie D empieza en posición 3
};

/**
 * Patrón de semanas virtuales para Serie A
 * (Las otras series usan un algoritmo de rotación)
 */
export const SERIE_A_PATTERN = {
  '1-1': [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1],
  '1-2': [5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4],
  '1-3': [8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7],
  '1-4': [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  '2-1': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  '2-2': [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6],
  '2-3': [11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  '2-4': [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2],
  '3-1': [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8],
  '3-2': [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3],
  '3-3': [6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5],
  '3-4': [10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9],
};

/**
 * Año base para cálculos de rotación
 */
export const ANO_BASE = 2027;

// ═══════════════════════════════════════════════════════════════════════════
// 🗺️ MAPEO DE SEMANAS VIRTUALES → REALES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Crea el mapeo de semanas virtuales → semanas reales
 * Excluye las 4 semanas especiales VIP y la semana 53 (si existe)
 * Asigna en ciclos A→B→C→D
 * @param {number} year - Año
 * @returns {Object} Mapeo { 0: {}, 1: {}, 2: {}, 3: {} } para series A, B, C, D
 */
export const crearMapeoSemanasDisponibles = (year) => {
  const totalWeeks = getTotalWeeksInYear(year);
  const semanasEspeciales = calcularSemanasEspeciales(year);
  const semanasEspecialesSet = new Set(Object.values(semanasEspeciales));
  
  // Array de semanas disponibles (excluyendo VIP y semana 53)
  const semanasDisponibles = [];
  for (let week = 1; week <= totalWeeks; week++) {
    // ✅ Excluir semanas VIP Y semana 53 (queda como EXTRA)
    if (!semanasEspecialesSet.has(week) && week !== 53) {
      semanasDisponibles.push(week);
    }
  }
  
  // Crear mapeo para cada serie (A=0, B=1, C=2, D=3)
  const mapeo = {
    0: {}, // Serie A
    1: {}, // Serie B
    2: {}, // Serie C
    3: {}  // Serie D
  };
  
  // Asignar en ciclos A→B→C→D
  let virtualWeekCounters = [1, 1, 1, 1]; // Contadores de semana virtual para cada serie
  
  for (let i = 0; i < semanasDisponibles.length && i < 48; i++) {
    const serieIndex = i % 4; // 0=A, 1=B, 2=C, 3=D
    const realWeek = semanasDisponibles[i];
    const virtualWeek = virtualWeekCounters[serieIndex];
    
    mapeo[serieIndex][virtualWeek] = realWeek;
    virtualWeekCounters[serieIndex]++;
  }
  
  return mapeo;
};

// ═══════════════════════════════════════════════════════════════════════════
// 📊 CÁLCULO DE SEMANAS REGULARES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calcula la semana regular (normal) para un título en un año
 * Mapea semana virtual → semana real del calendario
 * @param {string} serie - A, B, C, D
 * @param {number} subserie - 1, 2, 3
 * @param {number} numero - 1, 2, 3, 4
 * @param {number} año - Año a calcular
 * @returns {number} Número de semana real (1-52)
 */
export const calcularSemanaRegular = (serie, subserie, numero, año) => {
  const añosTranscurridos = año - ANO_BASE;
  let semanaVirtual = 1; // Valor por defecto

  // Series B, C, D: Rotación de 12 semanas con algoritmo
  if (serie === 'B' || serie === 'C' || serie === 'D') {
    const offsetSubserie = (subserie - 1) * 4;
    const offsetTitulo = (numero - 1);
    let semanaInicial = 1 + offsetSubserie + offsetTitulo;
    
    if (semanaInicial > 12) {
      semanaInicial = semanaInicial - 12;
    }
    
    semanaVirtual = ((semanaInicial - 1 + añosTranscurridos) % 12) + 1;
    
    // Mapear semana virtual → semana real del calendario
    const mapeo = crearMapeoSemanasDisponibles(año);
    const serieIndex = { 'B': 1, 'C': 2, 'D': 3 }[serie];
    const semanaReal = mapeo[serieIndex][semanaVirtual];
    
    return semanaReal || 1;
  }
  // Serie A: Patrón específico
  else if (serie === 'A') {
    const key = `${subserie}-${numero}`;
    const pattern = SERIE_A_PATTERN[key];
    
    if (pattern) {
      const patternIndex = añosTranscurridos % 12; 
      semanaVirtual = pattern[patternIndex];
    }
    
    // Mapear semana virtual → semana real del calendario
    const mapeo = crearMapeoSemanasDisponibles(año);
    const semanaReal = mapeo[0][semanaVirtual]; // Serie A = index 0
    
    return semanaReal || 1;
  }
  
  return 1;
};

// ═══════════════════════════════════════════════════════════════════════════
// ⭐ CÁLCULO DE SEMANAS VIP POR TÍTULO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calcula qué título le corresponde una semana especial VIP
 * 
 * Patrón de rotación:
 * - Cada serie tiene un offset inicial (A=0, B=1, C=2, D=3)
 * - Cada año las series "retroceden" una posición
 * - Los títulos rotan cada año dentro de cada serie (ciclo de 12)
 * - Orden VIP por fechas: ['SANTA', 'PASCUA', 'NAVIDAD', 'FIN_AÑO']
 * 
 * @param {string} serie - A, B, C, D
 * @param {number} subserie - 1, 2, 3
 * @param {number} numero - 1, 2, 3, 4
 * @param {string} tipoSemana - SANTA, PASCUA, NAVIDAD, FIN_ANO
 * @param {number} año - Año a calcular
 * @returns {string|null} ID del título si le corresponde, null si no
 */
export const calcularTituloSemanEspecial = (serie, subserie, numero, tipoSemana, año) => {
  const añosTranscurridos = año - ANO_BASE;
  
  // 1. Determinar qué título está activo este año (ciclo de 12)
  const añosIndex = añosTranscurridos % 12;
  const assignedSubserie = (añosIndex % 3) + 1;
  const assignedNumero = Math.floor(añosIndex / 3) + 1;
  
  const assignedTitleId = `${serie}-${assignedSubserie}-${assignedNumero}`;
  const currentTitleId = `${serie}-${subserie}-${numero}`;

  // Si este título no está activo este año, retornar null
  if (currentTitleId !== assignedTitleId) {
    return null;
  }

  // 2. Determinar qué VIP le corresponde a esta serie este año
  const offsetSerie = OFFSET_POR_SERIE[serie];

  // Buscar qué VIP tiene esta serie este año
  // Fórmula: (indiceVIP - añosTranscurridos + 4) % 4 = offsetSerie
  for (let i = 0; i < 4; i++) {
    const serieQueLeCorresponde = (i - añosTranscurridos + 4) % 4;
    
    if (serieQueLeCorresponde === offsetSerie) {
      const assignedWeekType = VIP_ORDER[i];
      
      // Verificar si coincide con la semana solicitada
      if (tipoSemana === assignedWeekType) {
        return currentTitleId;
      }
    }
  }
  
  return null;
};

// ═══════════════════════════════════════════════════════════════════════════
// 🏗️ GENERACIÓN COMPLETA DE SEMANAS POR AÑO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Genera todos los años desde año inicio hasta año fin
 * @param {number} startYear - Año de inicio (default: 2027)
 * @param {number} endYear - Año de fin (default: 2200)
 * @returns {Array<number>} Array de años
 */
export const generarArrayAnos = (startYear = 2027, endYear = 2200) => {
  const años = [];
  for (let año = startYear; año <= endYear; año++) {
    años.push(año);
  }
  return años;
};

/**
 * Genera el objeto completo de semanas por año para un título
 * Incluye tanto semanas regulares como especiales (VIP)
 * 
 * @param {string} serie - A, B, C, D
 * @param {number} subserie - 1, 2, 3
 * @param {number} numero - 1, 2, 3, 4
 * @param {number} startYear - Año de inicio (default: 2027)
 * @param {number} endYear - Año de fin (default: 2200)
 * @returns {Object} { weeksByYear: {}, specialWeeksByYear: {} }
 */
export const generarSemanasPorAño = (serie, subserie, numero, startYear = 2027, endYear = 2200) => {
  const años = generarArrayAnos(startYear, endYear);
  const weeksByYear = {};
  const specialWeeksByYear = {};
  const titleId = `${serie}-${subserie}-${numero}`;
  
  años.forEach(año => {
    // Calcular semana regular (siempre)
    weeksByYear[año] = calcularSemanaRegular(serie, subserie, numero, año);
    
    // Calcular semanas especiales VIP
    const semanasEspecialesAño = calcularSemanasEspeciales(año);
    const especialesEsteTitulo = [];
    
    for (const [tipoSemana, numeroSemana] of Object.entries(semanasEspecialesAño)) {
      const tituloConSemana = calcularTituloSemanEspecial(serie, subserie, numero, tipoSemana, año);
      
      if (tituloConSemana === titleId) {
        especialesEsteTitulo.push({
          type: tipoSemana,
          week: numeroSemana
        });
      }
    }
    
    specialWeeksByYear[año] = especialesEsteTitulo;
  });
  
  return { weeksByYear, specialWeeksByYear };
};

// ═══════════════════════════════════════════════════════════════════════════
// 📦 FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Obtiene el color de una serie
 * @param {string} serie - A, B, C, D
 * @returns {string} Clase CSS de color
 */
export const getSerieColor = (serie) => {
  return {
    'A': 'bg-serie-a',
    'B': 'bg-serie-b',
    'C': 'bg-serie-c',
    'D': 'bg-serie-d'
  }[serie] || 'bg-gray-200';
};

/**
 * Colores RGB para series (para uso en jsPDF)
 * @type {Object}
 */
export const SERIE_COLORS_RGB = {
  'A': [144, 238, 144], // verde (green-200)
  'B': [173, 216, 230], // azul (blue-200)
  'C': [255, 255, 153], // amarillo (yellow-200)
  'D': [221, 160, 221]  // morado (purple-200)
};

/**
 * Colores CSS para series
 * @type {Object}
 */
export const SERIE_COLORS = {
  'A': 'bg-green-200',
  'B': 'bg-blue-200',
  'C': 'bg-yellow-200',
  'D': 'bg-purple-200'
};

// ═══════════════════════════════════════════════════════════════════════════
// 🔚 FIN DEL SERVICIO
// ═══════════════════════════════════════════════════════════════════════════