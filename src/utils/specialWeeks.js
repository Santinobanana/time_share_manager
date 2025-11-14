/**
 * Utilidades para calcular fechas de semanas especiales
 */

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
 * Calcula el número de semana del año para una fecha dada
 * @param {Date} date - Fecha
 * @returns {number} Número de semana (1-52)
 */
export const obtenerNumeroSemana = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
};

/**
 * Calcula la semana de Pascua para un año
 * @param {number} year - Año
 * @returns {number} Número de semana (1-52)
 */
export const calcularSemanaPascua = (year) => {
  const pascua = calcularPascua(year);
  return obtenerNumeroSemana(pascua);
};

/**
 * Calcula la semana de Semana Santa para un año (una semana antes de Pascua)
 * @param {number} year - Año
 * @returns {number} Número de semana (1-52)
 */
export const calcularSemanaSanta = (year) => {
  const pascua = calcularPascua(year);
  // Semana Santa es la semana anterior a Pascua
  const semanaSanta = new Date(pascua);
  semanaSanta.setDate(semanaSanta.getDate() - 7);
  return obtenerNumeroSemana(semanaSanta);
};

/**
 * Constantes para semanas especiales fijas
 */
export const SEMANAS_ESPECIALES = {
  NAVIDAD: 51,    // Última semana de diciembre
  FIN_ANO: 52,    // Primera semana de enero (semana 52 del año anterior)
  // PASCUA y SANTA se calculan dinámicamente
};

/**
 * Obtiene todas las semanas especiales para un año
 * @param {number} year - Año
 * @returns {Object} { SANTA: number, PASCUA: number, NAVIDAD: number, FIN_ANO: number }
 */
export const obtenerSemanasEspecialesDelAno = (year) => {
  return {
    SANTA: calcularSemanaSanta(year),
    PASCUA: calcularSemanaPascua(year),
    NAVIDAD: SEMANAS_ESPECIALES.NAVIDAD,
    FIN_ANO: SEMANAS_ESPECIALES.FIN_ANO
  };
};

/**
 * Nombres en español de las semanas especiales
 */
export const NOMBRES_SEMANAS_ESPECIALES = {
  SANTA: 'Semana Santa',
  PASCUA: 'Pascua',
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
  const semanasEspeciales = obtenerSemanasEspecialesDelAno(year);
  
  for (const [nombre, numeroSemana] of Object.entries(semanasEspeciales)) {
    if (numeroSemana === weekNumber) {
      return nombre;
    }
  }
  
  return null;
};