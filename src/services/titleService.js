import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  updateDoc,
  orderBy 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  obtenerSemanasEspecialesDelAno,
  NOMBRES_SEMANAS_ESPECIALES 
} from '../utils/specialWeeks';

/**
 * Obtener todos los títulos
 */
export const getAllTitles = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'titles'));
    const titles = [];
    
    querySnapshot.forEach((doc) => {
      titles.push({ id: doc.id, ...doc.data() });
    });
    
    return titles;
  } catch (error) {
    console.error('Error obteniendo títulos:', error);
    throw new Error('Error al obtener los títulos');
  }
};

/**
 * Obtener título por ID
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
 * Obtener títulos de un usuario
 */
export const getTitlesByUser = async (userId) => {
  try {
    const q = query(
      collection(db, 'titles'),
      where('ownerId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const titles = [];
    
    querySnapshot.forEach((doc) => {
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
 * Asignar título a un usuario
 */
export const assignTitleToUser = async (titleId, userId) => {
  try {
    const titleRef = doc(db, 'titles', titleId);
    await updateDoc(titleRef, {
      ownerId: userId
    });
    
    console.log(`Título ${titleId} asignado a usuario ${userId}`);
  } catch (error) {
    console.error('Error asignando título:', error);
    throw new Error('Error al asignar el título');
  }
};

/**
 * Remover título de un usuario
 */
export const removeTitleFromUser = async (titleId) => {
  try {
    const titleRef = doc(db, 'titles', titleId);
    await updateDoc(titleRef, {
      ownerId: null
    });
    
    console.log(`Título ${titleId} liberado`);
  } catch (error) {
    console.error('Error removiendo título:', error);
    throw new Error('Error al remover el título');
  }
};

/**
 * Obtener títulos disponibles (sin asignar)
 */
export const getAvailableTitles = async () => {
  try {
    const q = query(
      collection(db, 'titles'),
      where('ownerId', '==', null)
    );
    
    const querySnapshot = await getDocs(q);
    const titles = [];
    
    querySnapshot.forEach((doc) => {
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
 * Calcular semanas de un título para un año específico
 */
export const getTitleWeeksForYear = async (titleId, year) => {
  try {
    const title = await getTitleById(titleId);
    
    if (!title.weeksByYear || !title.weeksByYear[year]) {
      throw new Error(`No hay información de semanas para el año ${year}`);
    }
    
    const regularWeek = title.weeksByYear[year];
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
 * ACTUALIZADO: Obtener semanas de un usuario para un año
 * Ahora considera intercambios activos
 */
export const getUserWeeksForYear = async (userId, year) => {
  try {
    const titles = await getTitlesByUser(userId);
    
    const regularWeeks = [];
    const specialWeeks = [];
    
    // 1. Obtener semanas originales de los títulos
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
    
    // 2. Obtener intercambios activos para este usuario y año
    const activeExchangesQuery1 = query(
      collection(db, 'activeExchanges'),
      where('fromUserId', '==', userId),
      where('year', '==', year)
    );
    
    const activeExchangesQuery2 = query(
      collection(db, 'activeExchanges'),
      where('toUserId', '==', userId),
      where('year', '==', year)
    );
    
    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(activeExchangesQuery1),
      getDocs(activeExchangesQuery2)
    ]);
    
    const activeExchanges = [];
    snapshot1.forEach(doc => {
      activeExchanges.push({ id: doc.id, ...doc.data() });
    });
    snapshot2.forEach(doc => {
      activeExchanges.push({ id: doc.id, ...doc.data() });
    });
    
    // 3. Aplicar intercambios activos
    activeExchanges.forEach(exchange => {
      if (exchange.fromUserId === userId) {
        // Este usuario dio una semana y recibió otra
        
        // Remover la semana que dio
        const indexToRemove = regularWeeks.findIndex(
          w => w.titleId === exchange.fromWeek.titleId && 
               w.weekNumber === exchange.fromWeek.weekNumber
        );
        if (indexToRemove > -1) {
          regularWeeks.splice(indexToRemove, 1);
        }
        
        // Agregar la semana que recibió
        const titleData = titles.find(t => t.id === exchange.toWeek.titleId);
        if (titleData) {
          regularWeeks.push({
            titleId: exchange.toWeek.titleId,
            serie: titleData.serie,
            subserie: titleData.subserie,
            number: titleData.number,
            weekNumber: exchange.toWeek.weekNumber,
            type: 'regular',
            isExchanged: true,
            exchangeId: exchange.exchangeId
          });
        }
      } else if (exchange.toUserId === userId) {
        // Este usuario recibió una semana y dio otra
        
        // Remover la semana que dio
        const indexToRemove = regularWeeks.findIndex(
          w => w.titleId === exchange.toWeek.titleId && 
               w.weekNumber === exchange.toWeek.weekNumber
        );
        if (indexToRemove > -1) {
          regularWeeks.splice(indexToRemove, 1);
        }
        
        // Agregar la semana que recibió
        // Necesitamos obtener info del título
        const fromTitleDoc = getDoc(doc(db, 'titles', exchange.fromWeek.titleId));
        if (fromTitleDoc.exists()) {
          const fromTitleData = fromTitleDoc.data();
          regularWeeks.push({
            titleId: exchange.fromWeek.titleId,
            serie: fromTitleData.serie,
            subserie: fromTitleData.subserie,
            number: fromTitleData.number,
            weekNumber: exchange.fromWeek.weekNumber,
            type: 'regular',
            isExchanged: true,
            exchangeId: exchange.exchangeId
          });
        }
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
 * Verificar si una semana es especial
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