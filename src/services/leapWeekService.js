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
 * 
 * Gestiona la asignación de semanas 53 en años bisiestos
 * donde el calendario tiene 53 semanas en lugar de 52
 */

/**
 * Detectar años con 53 semanas (años bisiestos especiales)
 * @param {number} year - Año a verificar
 * @returns {boolean}
 */
export const isLeapWeekYear = (year) => {
  // Un año tiene 53 semanas si el 31 de diciembre cae en jueves
  // o si el 1 de enero cae en jueves en un año bisiesto
  const lastDayOfYear = new Date(year, 11, 31);
  const firstDayOfYear = new Date(year, 0, 1);
  
  const lastDayWeekday = lastDayOfYear.getDay();
  const firstDayWeekday = firstDayOfYear.getDay();
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  
  return lastDayWeekday === 4 || (isLeapYear && firstDayWeekday === 4);
};

/**
 * Obtener todos los años con 53 semanas en un rango
 * @param {number} startYear 
 * @param {number} endYear 
 * @returns {Array<number>}
 */
export const getLeapWeekYears = (startYear = 2027, endYear = 2074) => {
  const leapWeekYears = [];
  
  for (let year = startYear; year <= endYear; year++) {
    if (isLeapWeekYear(year)) {
      leapWeekYears.push(year);
    }
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
    // Verificar que el año tenga 53 semanas
    if (!isLeapWeekYear(year)) {
      throw new Error(`El año ${year} no es un año con semana bisiesta (53 semanas)`);
    }
    
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
      weekNumber: 53,
      status: 'active'
    });
    
    console.log(`Semana bisiesta del año ${year} asignada a ${titleId}`);
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
    
    console.log(`Semana bisiesta del año ${year} cancelada`);
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
    const leapYears = getLeapWeekYears(currentYear, currentYear + 50);
    const assignedLeapWeeks = await getAllLeapWeeks();
    const assignedYears = new Set(
      assignedLeapWeeks
        .filter(lw => lw.titleId && lw.status !== 'cancelled')
        .map(lw => lw.year)
    );
    
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
    const allLeapYears = getLeapWeekYears(2027, 2074);
    const assignedLeapWeeks = await getAllLeapWeeks();
    const activeAssignments = assignedLeapWeeks.filter(
      lw => lw.titleId && lw.status !== 'cancelled'
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