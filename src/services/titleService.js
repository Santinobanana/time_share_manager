import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { obtenerSemanasEspecialesDelAno, NOMBRES_SEMANAS_ESPECIALES } from '../utils/specialWeeks';

/**
 * Obtener todos los títulos
 * @returns {Promise<Array>}
 */
export const getAllTitles = async () => {
  try {
    const titlesSnapshot = await getDocs(collection(db, 'titles'));
    const titles = [];
    
    titlesSnapshot.forEach(doc => {
      titles.push({ id: doc.id, ...doc.data() });
    });
    
    return titles;
  } catch (error) {
    console.error('Error obteniendo títulos:', error);
    throw new Error('Error al obtener los títulos');
  }
};

/**
 * Obtener un título por ID
 * @param {string} titleId 
 * @returns {Promise<Object>}
 */
export const getTitleById = async (titleId) => {
  try {
    const titleDoc = await getDoc(doc(db, 'titles', titleId));
    
    if (!titleDoc.exists()) {
      throw new Error('Título no encontrado');
    }
    
    return { id: titleDoc.id, ...titleDoc.data() };
  } catch (error) {
    console.error('Error obteniendo título:', error);
    throw error;
  }
};

/**
 * Obtener títulos por usuario
 * @param {string} userId 
 * @returns {Promise<Array>}
 */
export const getTitlesByUser = async (userId) => {
  try {
    const q = query(
      collection(db, 'titles'),
      where('ownerId', '==', userId),
      orderBy('serie'),
      orderBy('subserie'),
      orderBy('number')
    );
    
    const querySnapshot = await getDocs(q);
    const titles = [];
    
    querySnapshot.forEach(doc => {
      titles.push({ id: doc.id, ...doc.data() });
    });
    
    return titles;
  } catch (error) {
    console.error('Error obteniendo títulos del usuario:', error);
    throw new Error('Error al obtener los títulos del usuario');
  }
};

/**
 * Obtener propietario de un título
 * @param {string} titleId 
 * @returns {Promise<Object|null>}
 */
export const getTitleOwner = async (titleId) => {
  try {
    const title = await getTitleById(titleId);
    
    if (!title.ownerId) {
      return null;
    }
    
    const userDoc = await getDoc(doc(db, 'users', title.ownerId));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    return {
      uid: userDoc.id,
      ...userDoc.data()
    };
  } catch (error) {
    console.error('Error obteniendo propietario:', error);
    return null;
  }
};

/**
 * Obtener títulos disponibles (sin propietario)
 * @returns {Promise<Array>}
 */
export const getAvailableTitles = async () => {
  try {
    const q = query(
      collection(db, 'titles'),
      where('ownerId', '==', null)
    );
    
    const querySnapshot = await getDocs(q);
    const titles = [];
    
    querySnapshot.forEach(doc => {
      titles.push({ id: doc.id, ...doc.data() });
    });
    
    return titles;
  } catch (error) {
    console.error('Error obteniendo títulos disponibles:', error);
    throw new Error('Error al obtener títulos disponibles');
  }
};

/**
 * Obtener estadísticas de títulos
 * @returns {Promise<Object>}
 */
export const getTitleStats = async () => {
  try {
    const titles = await getAllTitles();
    
    const assigned = titles.filter(t => t.ownerId !== null).length;
    const available = titles.filter(t => t.ownerId === null).length;
    const total = titles.length;
    
    const stats = {
      total,
      assigned,
      available,
      percentAssigned: ((assigned / total) * 100).toFixed(1),
      bySerie: {
        A: titles.filter(t => t.serie === 'A').length,
        B: titles.filter(t => t.serie === 'B').length,
        C: titles.filter(t => t.serie === 'C').length,
        D: titles.filter(t => t.serie === 'D').length
      }
    };
    
    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas de títulos:', error);
    throw new Error('Error al obtener estadísticas');
  }
};

/**
 * Calcular semanas de un título para un año específico (regulares + especiales)
 * @param {string} titleId 
 * @param {number} year 
 * @returns {Promise<Object>}
 */
export const getTitleWeeksForYear = async (titleId, year) => {
  try {
    const title = await getTitleById(titleId);
    
    if (!title.weeksByYear || !title.weeksByYear[year]) {
      throw new Error(`No hay información de semanas para el año ${year}`);
    }
    
    // Semana regular
    const regularWeek = title.weeksByYear[year];
    
    // Semanas especiales
    const specialWeeks = title.specialWeeksByYear?.[year] || [];
    
    return {
      titleId: title.id,
      serie: title.serie,
      subserie: title.subserie,
      number: title.number,
      year,
      regularWeek,
      specialWeeks: specialWeeks.map(sw => ({
        ...sw,
        name: NOMBRES_SEMANAS_ESPECIALES[sw.type]
      }))
    };
  } catch (error) {
    console.error('Error obteniendo semanas del título:', error);
    throw error;
  }
};

/**
 * Obtener todas las semanas de un usuario para un año (regulares + especiales)
 * @param {string} userId 
 * @param {number} year 
 * @returns {Promise<Object>} { regular: Array, special: Array }
 */
export const getUserWeeksForYear = async (userId, year) => {
  try {
    const titles = await getTitlesByUser(userId);
    
    const regularWeeks = [];
    const specialWeeks = [];
    
    titles.forEach(title => {
      // Semana regular
      if (title.weeksByYear && title.weeksByYear[year]) {
        regularWeeks.push({
          titleId: title.id,
          serie: title.serie,
          subserie: title.subserie,
          number: title.number,
          weekNumber: title.weeksByYear[year],
          type: 'regular'
        });
      }
      
      // Semanas especiales
      if (title.specialWeeksByYear && title.specialWeeksByYear[year]) {
        title.specialWeeksByYear[year].forEach(specialWeek => {
          specialWeeks.push({
            titleId: title.id,
            serie: title.serie,
            subserie: title.subserie,
            number: title.number,
            weekNumber: specialWeek.week,
            type: 'special',
            specialType: specialWeek.type,
            specialName: NOMBRES_SEMANAS_ESPECIALES[specialWeek.type]
          });
        });
      }
    });
    
    // Ordenar por número de semana
    regularWeeks.sort((a, b) => a.weekNumber - b.weekNumber);
    specialWeeks.sort((a, b) => a.weekNumber - b.weekNumber);
    
    return {
      regular: regularWeeks,
      special: specialWeeks,
      all: [...regularWeeks, ...specialWeeks].sort((a, b) => a.weekNumber - b.weekNumber)
    };
  } catch (error) {
    console.error('Error obteniendo semanas del usuario:', error);
    throw new Error('Error al obtener las semanas del usuario');
  }
};

/**
 * Verificar si una semana es especial para un título en un año
 * @param {string} titleId 
 * @param {number} weekNumber 
 * @param {number} year 
 * @returns {Promise<Object|null>} Info de la semana especial o null
 */
export const checkIfWeekIsSpecial = async (titleId, weekNumber, year) => {
  try {
    const title = await getTitleById(titleId);
    
    if (!title.specialWeeksByYear || !title.specialWeeksByYear[year]) {
      return null;
    }
    
    const specialWeek = title.specialWeeksByYear[year].find(sw => sw.week === weekNumber);
    
    if (specialWeek) {
      return {
        ...specialWeek,
        name: NOMBRES_SEMANAS_ESPECIALES[specialWeek.type]
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error verificando semana especial:', error);
    return null;
  }
};