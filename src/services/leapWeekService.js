import { 
  collection, 
  doc, 
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * SERVICIO DE SEMANAS BISIESTAS (Leap Weeks)
 * VERSIÓN MEJORADA CON AÑOS DINÁMICOS
 * 
 * Gestiona la asignación de semanas 53 en años bisiestos
 * donde el calendario tiene 53 semanas en lugar de 52
 */

/**
 * Obtener todos los años con 53 semanas en un rango
 * @param {number} startYear - Año inicial (por defecto: año actual)
 * @param {number} endYear - Año final (por defecto: startYear + 76 años)
 * @returns {Array<number>}
 */
export const getLeapWeekYears = (startYear, endYear) => {
  // Si no se proporciona startYear, usar el año actual
  if (!startYear) {
    startYear = new Date().getFullYear();
  }
  
  // Si no se proporciona endYear, calcular 76 años adelante
  if (!endYear) {
    endYear = startYear + 76;
  }
  
  const leapWeekYears = [];
  const BASE_LEAP_YEAR = 2028; // Año base conocido con 53 semanas
  
  // Encontrar el primer año con 53 semanas >= startYear
  let firstLeapYear = BASE_LEAP_YEAR;
  while (firstLeapYear < startYear) {
    firstLeapYear += 4;
  }
  
  // Generar lista de años con 53 semanas (cada 4 años)
  for (let year = firstLeapYear; year <= endYear; year += 4) {
    leapWeekYears.push(year);
  }
  
  return leapWeekYears;
};

/**
 * Obtener información de una semana bisiesta específica
 * @param {number} year - Año bisiesto
 * @returns {Promise<Object|null>}
 */
export const getLeapWeekInfo = async (year) => {
  try {
    const leapWeekDoc = await getDoc(doc(db, 'leapWeeks', year.toString()));
    
    if (!leapWeekDoc.exists()) {
      return null;
    }
    
    return {
      year,
      ...leapWeekDoc.data()
    };
  } catch (error) {
    console.error('Error obteniendo información de semana bisiesta:', error);
    throw error;
  }
};

/**
 * Obtener todas las semanas bisiestas asignadas
 * @returns {Promise<Array>}
 */
export const getAllLeapWeeks = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'leapWeeks'));
    const leapWeeks = [];
    
    querySnapshot.forEach(doc => {
      leapWeeks.push({
        year: parseInt(doc.id),
        ...doc.data()
      });
    });
    
    return leapWeeks.sort((a, b) => a.year - b.year);
  } catch (error) {
    console.error('Error obteniendo semanas bisiestas:', error);
    throw error;
  }
};

/**
 * Asignar semana bisiesta a un título
 * @param {number} year - Año bisiesto
 * @param {string} titleId - ID del título ganador
 * @param {string} assignmentMethod - 'manual' o 'raffle'
 * @param {string} assignedBy - UID del administrador
 * @returns {Promise<void>}
 */
export const assignLeapWeek = async (year, titleId, assignmentMethod, assignedBy) => {
  try {
    // Verificar que el título existe
    const titleDoc = await getDoc(doc(db, 'titles', titleId));
    if (!titleDoc.exists()) {
      throw new Error(`El título ${titleId} no existe`);
    }
    
    // Crear/actualizar documento de semana bisiesta
    await setDoc(doc(db, 'leapWeeks', year.toString()), {
      titleId,
      assignmentMethod, // 'manual' o 'raffle'
      assignedBy, // UID del admin
      assignedAt: serverTimestamp(),
      weekNumber: 51, // ✅ Semana 51 (última semana antes de Navidad)
      status: 'active'
    });
    
    console.log(`✅ Semana bisiesta del año ${year} asignada a ${titleId}`);
  } catch (error) {
    console.error('Error asignando semana bisiesta:', error);
    throw error;
  }
};

/**
 * Cancelar asignación de semana bisiesta
 * @param {number} year - Año bisiesto
 * @returns {Promise<void>}
 */
export const unassignLeapWeek = async (year) => {
  try {
    const leapWeekRef = doc(db, 'leapWeeks', year.toString());
    const leapWeekDoc = await getDoc(leapWeekRef);
    
    if (!leapWeekDoc.exists()) {
      throw new Error(`No hay semana bisiesta asignada para el año ${year}`);
    }
    
    // Marcar como cancelada pero mantener el registro histórico
    await updateDoc(leapWeekRef, {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      previousTitleId: leapWeekDoc.data().titleId,
      titleId: null
    });
    
    console.log(`❌ Semana bisiesta del año ${year} cancelada`);
  } catch (error) {
    console.error('Error cancelando semana bisiesta:', error);
    throw error;
  }
};

/**
 * Obtener títulos disponibles para la rifa
 * (Todos los 48 títulos)
 * @returns {Promise<Array>}
 */
export const getTitlesForRaffle = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'titles'));
    const titles = [];
    
    querySnapshot.forEach(doc => {
      titles.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return titles.sort((a, b) => a.id.localeCompare(b.id));
  } catch (error) {
    console.error('Error obteniendo títulos para rifa:', error);
    throw error;
  }
};

/**
 * Realizar sorteo aleatorio de un título
 * @param {Array} titles - Array de títulos disponibles
 * @returns {Object} - Título ganador
 */
export const performRaffle = (titles) => {
  if (!titles || titles.length === 0) {
    throw new Error('No hay títulos disponibles para el sorteo');
  }
  
  const randomIndex = Math.floor(Math.random() * titles.length);
  return titles[randomIndex];
};

/**
 * Obtener próximos años con semana bisiesta sin asignar
 * @param {number} limit - Cantidad máxima de años a retornar
 * @returns {Promise<Array<number>>}
 */
export const getUnassignedLeapWeekYears = async (limit = 10) => {
  try {
    const currentYear = new Date().getFullYear();
    
    // Obtener años bisiestos desde año actual hacia adelante
    const leapYears = getLeapWeekYears(currentYear, currentYear + 50);
    
    // Obtener asignaciones existentes
    const assignedLeapWeeks = await getAllLeapWeeks();
    const assignedYears = new Set(
      assignedLeapWeeks
        .filter(lw => lw.titleId && lw.status !== 'cancelled')
        .map(lw => lw.year)
    );
    
    // Filtrar solo años sin asignar y limitar cantidad
    const unassigned = leapYears
      .filter(year => !assignedYears.has(year))
      .slice(0, limit);
    
    return unassigned;
  } catch (error) {
    console.error('Error obteniendo años sin asignar:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas de semanas bisiestas
 * @returns {Promise<Object>}
 */
export const getLeapWeekStats = async () => {
  try {
    const currentYear = new Date().getFullYear();
    
    // Obtener años bisiestos desde año actual hasta 2100
    const allLeapYears = getLeapWeekYears(currentYear, 2100);
    
    // Obtener asignaciones activas
    const assignedLeapWeeks = await getAllLeapWeeks();
    const activeAssignments = assignedLeapWeeks.filter(
      lw => lw.titleId && lw.status !== 'cancelled' && lw.year >= currentYear
    );
    
    return {
      totalLeapYears: allLeapYears.length,
      assigned: activeAssignments.length,
      unassigned: allLeapYears.length - activeAssignments.length,
      nextUnassigned: allLeapYears.find(year => 
        !activeAssignments.some(lw => lw.year === year)
      )
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    throw error;
  }
};