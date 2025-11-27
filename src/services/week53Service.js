import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  updateDoc,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';

/**
 * Años con 53 semanas según ISO 8601 (2027-2100)
 */
export const YEARS_WITH_53_WEEKS = [
  2032, 2037, 2043, 2048, 2054, 2060, 2065, 2071, 2076, 2082,
  2088, 2093, 2099
];

/**
 * Verificar si un año tiene 53 semanas
 */
export const has53Weeks = (year) => {
  return YEARS_WITH_53_WEEKS.includes(year);
};

/**
 * Asignar semana 53 a un título mediante intercambio
 * 
 * @param {number} year - Año con 53 semanas
 * @param {string} titleId - ID del título que recibirá la semana 53
 * @param {number} weekToExchange - Número de semana que el título cede a cambio
 * @param {string} adminUid - UID del administrador que realiza la asignación
 * @returns {Promise<Object>} Resultado de la asignación
 */
export const assignWeek53WithExchange = async (year, titleId, weekToExchange, adminUid) => {
  try {
    // Validaciones
    if (!has53Weeks(year)) {
      throw new Error(`El año ${year} no tiene 53 semanas`);
    }

    if (!titleId || !weekToExchange || !adminUid) {
      throw new Error('Faltan parámetros requeridos');
    }

    // Verificar si ya existe una asignación para este año
    const existingDoc = await getDoc(doc(db, 'week53Assignments', year.toString()));
    
    if (existingDoc.exists()) {
      throw new Error(`Ya existe una asignación de semana 53 para el año ${year}`);
    }

    // Crear documento de asignación
    const assignmentData = {
      year,
      titleId,
      weekExchanged: weekToExchange, // Semana que el título cede
      assignedBy: adminUid,
      assignedAt: Timestamp.now(),
      status: 'active',
      assignmentMethod: 'manual_exchange'
    };

    await setDoc(doc(db, 'week53Assignments', year.toString()), assignmentData);

    return {
      success: true,
      message: `Semana 53 del año ${year} asignada a ${titleId}`,
      data: assignmentData
    };

  } catch (error) {
    console.error('Error asignando semana 53:', error);
    throw error;
  }
};

/**
 * Obtener asignación de semana 53 para un año específico
 * 
 * @param {number} year - Año a consultar
 * @returns {Promise<Object|null>} Datos de asignación o null
 */
export const getWeek53Assignment = async (year) => {
  try {
    const docRef = doc(db, 'week53Assignments', year.toString());
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    
    return null;
  } catch (error) {
    console.error('Error obteniendo asignación semana 53:', error);
    return null;
  }
};

/**
 * Obtener todas las asignaciones de semana 53 de un título
 * 
 * @param {string} titleId - ID del título
 * @returns {Promise<Object>} Objeto con años como claves
 */
export const getWeek53AssignmentsForTitle = async (titleId) => {
  try {
    const q = query(
      collection(db, 'week53Assignments'),
      where('titleId', '==', titleId),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    const assignments = {};
    
    snapshot.forEach(doc => {
      const data = doc.data();
      assignments[data.year] = {
        week: 53,
        weekExchanged: data.weekExchanged
      };
    });
    
    return assignments;
  } catch (error) {
    console.error('Error obteniendo asignaciones de semana 53:', error);
    return {};
  }
};

/**
 * Enriquecer título con asignaciones de semana 53
 * Agrega las semanas 53 al objeto specialWeeksByYear
 * 
 * @param {Object} title - Objeto del título
 * @returns {Promise<Object>} Título enriquecido
 */
export const enrichTitleWithWeek53 = async (title) => {
  try {
    const week53Assignments = await getWeek53AssignmentsForTitle(title.id);
    
    if (Object.keys(week53Assignments).length === 0) {
      return title;
    }

    // Clonar título para no mutar el original
    const enrichedTitle = { ...title };
    
    // Asegurar que specialWeeksByYear existe
    if (!enrichedTitle.specialWeeksByYear) {
      enrichedTitle.specialWeeksByYear = {};
    }

    // Agregar semanas 53 a specialWeeksByYear
    Object.entries(week53Assignments).forEach(([year, data]) => {
      if (!enrichedTitle.specialWeeksByYear[year]) {
        enrichedTitle.specialWeeksByYear[year] = [];
      }

      // Verificar que no esté ya agregada
      const exists = enrichedTitle.specialWeeksByYear[year].some(
        w => w.week === 53 && w.type === 'WEEK_53'
      );

      if (!exists) {
        enrichedTitle.specialWeeksByYear[year].push({
          type: 'WEEK_53',
          week: 53,
          weekExchanged: data.weekExchanged
        });
      }
    });

    return enrichedTitle;
  } catch (error) {
    console.error('Error enriqueciendo título con semana 53:', error);
    return title;
  }
};

/**
 * Cancelar asignación de semana 53
 * 
 * @param {number} year - Año de la asignación a cancelar
 * @param {string} adminUid - UID del administrador
 * @returns {Promise<Object>} Resultado
 */
export const cancelWeek53Assignment = async (year, adminUid) => {
  try {
    const docRef = doc(db, 'week53Assignments', year.toString());
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error(`No existe asignación de semana 53 para el año ${year}`);
    }

    // Actualizar estado a cancelado (mantener historial)
    await updateDoc(docRef, {
      status: 'cancelled',
      cancelledBy: adminUid,
      cancelledAt: Timestamp.now()
    });

    return {
      success: true,
      message: `Asignación de semana 53 del año ${year} cancelada`
    };

  } catch (error) {
    console.error('Error cancelando asignación:', error);
    throw error;
  }
};

/**
 * Verificar si un título ya tiene asignada la semana 53 en algún año
 * 
 * @param {string} titleId - ID del título
 * @returns {Promise<Array>} Array de años donde tiene semana 53
 */
export const getTitleWeek53Years = async (titleId) => {
  try {
    const q = query(
      collection(db, 'week53Assignments'),
      where('titleId', '==', titleId),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    const years = [];
    
    snapshot.forEach(doc => {
      years.push(doc.data().year);
    });
    
    return years.sort((a, b) => a - b);
  } catch (error) {
    console.error('Error obteniendo años con semana 53:', error);
    return [];
  }
};

/**
 * Obtener años disponibles para asignar semana 53
 * (Años con 53 semanas que aún no tienen asignación)
 * 
 * @returns {Promise<Array>} Array de años disponibles
 */
export const getAvailableYearsForWeek53 = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'week53Assignments'));
    const assignedYears = new Set();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'active') {
        assignedYears.add(data.year);
      }
    });
    
    // Filtrar años con 53 semanas que no tienen asignación
    return YEARS_WITH_53_WEEKS.filter(year => !assignedYears.has(year));
  } catch (error) {
    console.error('Error obteniendo años disponibles:', error);
    return YEARS_WITH_53_WEEKS;
  }
};