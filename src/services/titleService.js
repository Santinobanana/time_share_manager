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

/**
 * Obtener todos los títulos
 * @returns {Promise<Array>}
 */
export const getAllTitles = async () => {
  try {
    const titlesRef = collection(db, 'titles');
    const querySnapshot = await getDocs(titlesRef);
    
    const titles = [];
    querySnapshot.forEach((doc) => {
      titles.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Ordenar por serie, subserie y número
    titles.sort((a, b) => {
      if (a.serie !== b.serie) return a.serie.localeCompare(b.serie);
      if (a.subserie !== b.subserie) return parseInt(a.subserie) - parseInt(b.subserie);
      return parseInt(a.number) - parseInt(b.number);
    });
    
    return titles;
  } catch (error) {
    console.error('Error obteniendo títulos:', error);
    throw new Error('Error al obtener la lista de títulos');
  }
};

/**
 * Obtener título por ID
 * @param {string} titleId - Ejemplo: "A-1-1"
 * @returns {Promise<Object>}
 */
export const getTitleById = async (titleId) => {
  try {
    const titleDoc = await getDoc(doc(db, 'titles', titleId));
    
    if (!titleDoc.exists()) {
      throw new Error('Título no encontrado');
    }
    
    return {
      id: titleDoc.id,
      ...titleDoc.data()
    };
  } catch (error) {
    console.error('Error obteniendo título:', error);
    throw error;
  }
};

/**
 * Obtener títulos por serie
 * @param {string} serie - A, B, C, D
 * @returns {Promise<Array>}
 */
export const getTitlesBySerie = async (serie) => {
  try {
    const titlesRef = collection(db, 'titles');
    const q = query(titlesRef, where('serie', '==', serie));
    const querySnapshot = await getDocs(q);
    
    const titles = [];
    querySnapshot.forEach((doc) => {
      titles.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return titles;
  } catch (error) {
    console.error('Error obteniendo títulos por serie:', error);
    throw new Error('Error al obtener títulos de la serie');
  }
};

/**
 * Obtener títulos disponibles (sin dueño)
 * @returns {Promise<Array>}
 */
export const getAvailableTitles = async () => {
  try {
    const titlesRef = collection(db, 'titles');
    const q = query(titlesRef, where('ownerId', '==', null));
    const querySnapshot = await getDocs(q);
    
    const titles = [];
    querySnapshot.forEach((doc) => {
      titles.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return titles;
  } catch (error) {
    console.error('Error obteniendo títulos disponibles:', error);
    throw new Error('Error al obtener títulos disponibles');
  }
};

/**
 * Obtener títulos de un usuario
 * @param {string} userId 
 * @returns {Promise<Array>}
 */
export const getTitlesByUser = async (userId) => {
  try {
    const titlesRef = collection(db, 'titles');
    const q = query(titlesRef, where('ownerId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const titles = [];
    querySnapshot.forEach((doc) => {
      titles.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return titles;
  } catch (error) {
    console.error('Error obteniendo títulos del usuario:', error);
    throw new Error('Error al obtener títulos del usuario');
  }
};

/**
 * Obtener información del dueño de un título
 * @param {string} titleId 
 * @returns {Promise<Object|null>}
 */
export const getTitleOwner = async (titleId) => {
  try {
    const title = await getTitleById(titleId);
    
    if (!title.ownerId) {
      return null;
    }
    
    const ownerDoc = await getDoc(doc(db, 'users', title.ownerId));
    
    if (!ownerDoc.exists()) {
      return null;
    }
    
    return {
      uid: ownerDoc.id,
      name: ownerDoc.data().name,
      email: ownerDoc.data().email
    };
  } catch (error) {
    console.error('Error obteniendo dueño del título:', error);
    throw new Error('Error al obtener información del dueño');
  }
};

/**
 * Obtener estadísticas de títulos
 * @returns {Promise<Object>}
 */
export const getTitleStats = async () => {
  try {
    const titles = await getAllTitles();
    
    const stats = {
      total: titles.length,
      assigned: titles.filter(t => t.ownerId).length,
      available: titles.filter(t => !t.ownerId).length,
      bySerie: {
        A: titles.filter(t => t.serie === 'A').length,
        B: titles.filter(t => t.serie === 'B').length,
        C: titles.filter(t => t.serie === 'C').length,
        D: titles.filter(t => t.serie === 'D').length
      },
      assignedBySerie: {
        A: titles.filter(t => t.serie === 'A' && t.ownerId).length,
        B: titles.filter(t => t.serie === 'B' && t.ownerId).length,
        C: titles.filter(t => t.serie === 'C' && t.ownerId).length,
        D: titles.filter(t => t.serie === 'D' && t.ownerId).length
      }
    };
    
    stats.occupancyRate = ((stats.assigned / stats.total) * 100).toFixed(1);
    
    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas de títulos:', error);
    throw new Error('Error al obtener estadísticas');
  }
};

/**
 * Calcular semanas de un título para un año específico
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
    
    return {
      titleId: title.id,
      serie: title.serie,
      subserie: title.subserie,
      number: title.number,
      year,
      weekNumber: title.weeksByYear[year]
    };
  } catch (error) {
    console.error('Error obteniendo semanas del título:', error);
    throw error;
  }
};

/**
 * Obtener todas las semanas de un usuario para un año
 * @param {string} userId 
 * @param {number} year 
 * @returns {Promise<Array>}
 */
export const getUserWeeksForYear = async (userId, year) => {
  try {
    const titles = await getTitlesByUser(userId);
    
    const weeks = titles.map(title => ({
      titleId: title.id,
      serie: title.serie,
      subserie: title.subserie,
      number: title.number,
      weekNumber: title.weeksByYear[year]
    }));
    
    // Ordenar por número de semana
    weeks.sort((a, b) => a.weekNumber - b.weekNumber);
    
    return weeks;
  } catch (error) {
    console.error('Error obteniendo semanas del usuario:', error);
    throw new Error('Error al obtener las semanas del usuario');
  }
};