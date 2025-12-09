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
import { has53Weeks } from './weekCalculationService';

/**
 * Obtener todos los años con 53 semanas en un rango
 * @param {number} startYear - Año inicial (default: año actual)
 * @param {number} endYear - Año final (default: 2100)
 * @returns {Array<number>} Array de años con 53 semanas
 */
export const getYearsWith53Weeks = (startYear = new Date().getFullYear(), endYear = 2100) => {
  const years = [];
  for (let year = startYear; year <= endYear; year++) {
    if (has53Weeks(year)) {
      years.push(year);
    }
  }
  return years;
};

/**
 * Obtener todas las asignaciones de semana 53
 * @returns {Promise<Object>} Objeto con año como clave y datos de asignación como valor
 */
export const getAllWeek53Assignments = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'week53Assignments'));
    const assignments = {};
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'active') {
        assignments[data.year] = {
          titleId: data.titleId,
          weekExchanged: data.weekExchanged,
          assignedBy: data.assignedBy,
          assignedAt: data.assignedAt
        };
      }
    });
    
    return assignments;
  } catch (error) {
    console.error('Error obteniendo asignaciones de semana 53:', error);
    return {};
  }
};

/**
 * Asignar semana 51 (libre) a un título mediante intercambio
 * En años con 53 semanas: semana 52 = Navidad, semana 53 = Año Nuevo
 * Por lo tanto, la semana 51 es la que queda libre para intercambiar
 * Si ya existe una asignación para ese año, la reemplaza
 * 
 * IMPORTANTE: Esta función actualiza la colección 'titles' para:
 * - Remover la semana cedida del título nuevo
 * - Agregar la semana 51 al título nuevo
 * - Restaurar la semana cedida al título anterior (si existe)
 * 
 * @param {number} year - Año con 53 semanas
 * @param {string} titleId - ID del título que recibirá la semana 51
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
    
    let previousAssignment = null;
    if (existingDoc.exists()) {
      previousAssignment = existingDoc.data();
      
      // PASO 1: Restaurar la semana del título anterior
      if (previousAssignment.titleId && previousAssignment.weekExchanged) {
        const previousTitleRef = doc(db, 'titles', previousAssignment.titleId);
        const previousTitleDoc = await getDoc(previousTitleRef);
        
        if (previousTitleDoc.exists()) {
          const previousTitleData = previousTitleDoc.data();
          
          // Restaurar la semana cedida en weeksByYear
          const updatedWeeksByYear = { ...previousTitleData.weeksByYear };
          updatedWeeksByYear[year] = previousAssignment.weekExchanged;
          
          await updateDoc(previousTitleRef, {
            weeksByYear: updatedWeeksByYear
          });
          
          console.log(`✅ Restaurada semana ${previousAssignment.weekExchanged} a título ${previousAssignment.titleId}`);
        }
      }
      
      // Cancelar la asignación anterior
      await updateDoc(doc(db, 'week53Assignments', year.toString()), {
        status: 'replaced',
        replacedBy: adminUid,
        replacedAt: Timestamp.now()
      });
    }

    // PASO 2: Actualizar el título nuevo (cambiar semana cedida por semana 51)
    const newTitleRef = doc(db, 'titles', titleId);
    const newTitleDoc = await getDoc(newTitleRef);
    
    if (!newTitleDoc.exists()) {
      throw new Error(`El título ${titleId} no existe`);
    }
    
    const newTitleData = newTitleDoc.data();
    
    // Actualizar weeksByYear: cambiar la semana cedida por la semana 51
    const updatedWeeksByYear = { ...newTitleData.weeksByYear };
    updatedWeeksByYear[year] = 51; // Ahora tiene semana 51 en lugar de la que cedió
    
    await updateDoc(newTitleRef, {
      weeksByYear: updatedWeeksByYear
    });
    
    console.log(`✅ Título ${titleId}: semana ${weekToExchange} → semana 51`);

    // PASO 3: Crear nueva documento de asignación
    const assignmentData = {
      year,
      titleId,
      weekAssigned: 51, // La semana 51 es la que se asigna
      weekExchanged: weekToExchange, // Semana que el título cede
      assignedBy: adminUid,
      assignedAt: Timestamp.now(),
      status: 'active',
      assignmentMethod: 'manual_exchange',
      ...(previousAssignment && {
        previousTitleId: previousAssignment.titleId,
        previousWeekExchanged: previousAssignment.weekExchanged
      })
    };

    await setDoc(doc(db, 'week53Assignments', year.toString()), assignmentData);

    return {
      success: true,
      message: `Semana 51 del año ${year} asignada a ${titleId}`,
      data: assignmentData,
      replaced: !!previousAssignment
    };

  } catch (error) {
    console.error('Error asignando semana 51:', error);
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
    
    if (docSnap.exists() && docSnap.data().status === 'active') {
      return { id: docSnap.id, ...docSnap.data() };
    }
    
    return null;
  } catch (error) {
    console.error('Error obteniendo asignación semana 53:', error);
    return null;
  }
};

/**
 * Obtener todas las asignaciones de semana 51 (extra) de un título
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
        week: 51, // La semana 51 es la que se asigna
        weekExchanged: data.weekExchanged
      };
    });
    
    return assignments;
  } catch (error) {
    console.error('Error obteniendo asignaciones de semana 51:', error);
    return {};
  }
};

/**
 * Enriquecer título con asignaciones de semana 51 (extra)
 * Agrega las semanas 51 al objeto specialWeeksByYear
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

    // Agregar semanas 51 a specialWeeksByYear
    Object.entries(week53Assignments).forEach(([year, data]) => {
      if (!enrichedTitle.specialWeeksByYear[year]) {
        enrichedTitle.specialWeeksByYear[year] = [];
      }

      // Verificar que no esté ya agregada
      const exists = enrichedTitle.specialWeeksByYear[year].some(
        w => w.week === 51 && w.type === 'WEEK_51'
      );

      if (!exists) {
        enrichedTitle.specialWeeksByYear[year].push({
          type: 'WEEK_51',
          week: 51,
          weekExchanged: data.weekExchanged
        });
      }
    });

    return enrichedTitle;
  } catch (error) {
    console.error('Error enriqueciendo título con semana 51:', error);
    return title;
  }
};

/**
 * Cancelar asignación de semana 51 (extra)
 * IMPORTANTE: Esta función restaura la semana cedida al título
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
      throw new Error(`No existe asignación de semana extra para el año ${year}`);
    }

    const assignmentData = docSnap.data();
    
    // Restaurar la semana cedida al título
    if (assignmentData.titleId && assignmentData.weekExchanged) {
      const titleRef = doc(db, 'titles', assignmentData.titleId);
      const titleDoc = await getDoc(titleRef);
      
      if (titleDoc.exists()) {
        const titleData = titleDoc.data();
        
        // Restaurar la semana cedida en weeksByYear
        const updatedWeeksByYear = { ...titleData.weeksByYear };
        updatedWeeksByYear[year] = assignmentData.weekExchanged;
        
        await updateDoc(titleRef, {
          weeksByYear: updatedWeeksByYear
        });
        
        console.log(`✅ Restaurada semana ${assignmentData.weekExchanged} a título ${assignmentData.titleId}`);
      }
    }

    // Actualizar estado a cancelado (mantener historial)
    await updateDoc(docRef, {
      status: 'cancelled',
      cancelledBy: adminUid,
      cancelledAt: Timestamp.now()
    });

    return {
      success: true,
      message: `Asignación de semana extra del año ${year} cancelada`
    };

  } catch (error) {
    console.error('Error cancelando asignación:', error);
    throw error;
  }
};

/**
 * Verificar si un título ya tiene asignada la semana extra en algún año
 * 
 * @param {string} titleId - ID del título
 * @returns {Promise<Array>} Array de años donde tiene semana extra
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
    console.error('Error obteniendo años con semana extra:', error);
    return [];
  }
};

/**
 * Obtener años disponibles para asignar semana extra
 * (Años con 53 semanas que aún no tienen asignación)
 * 
 * @returns {Promise<Array>} Array de años disponibles
 */
export const getAvailableYearsForWeek53 = async () => {
  try {
    const allYears = getYearsWith53Weeks();
    const assignments = await getAllWeek53Assignments();
    
    // Filtrar años que no tienen asignación activa
    return allYears.filter(year => !assignments[year]);
  } catch (error) {
    console.error('Error obteniendo años disponibles:', error);
    return getYearsWith53Weeks();
  }
};