import { 
  collection, 
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Obtener semanas bisiestas asignadas a un título específico
 * @param {string} titleId - ID del título (ej: "A-1-1")
 * @returns {Promise<Object>} - Objeto con años como llaves y número 53
 */
export const getLeapWeeksForTitle = async (titleId) => {
  try {
    // Consultar todas las semanas bisiestas asignadas a este título
    const q = query(
      collection(db, 'leapWeeks'),
      where('titleId', '==', titleId),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    const leapWeeksByYear = {};
    
    querySnapshot.forEach(doc => {
      const year = parseInt(doc.id);
      const data = doc.data();
      
      // Agregar al objeto en formato { year: weekNumber }
      leapWeeksByYear[year] = data.weekNumber || 51; // Default 51 (última semana antes de Navidad)
    });
    
    return leapWeeksByYear;
  } catch (error) {
    console.error('Error obteniendo semanas bisiestas del título:', error);
    return {};
  }
};

/**
 * Agregar semanas bisiestas a un objeto de título
 * @param {Object} title - Objeto título con specialWeeksByYear
 * @returns {Promise<Object>} - Título con leapWeeks agregadas
 */
export const enrichTitleWithLeapWeeks = async (title) => {
  try {
    // Obtener semanas bisiestas de este título
    const leapWeeks = await getLeapWeeksForTitle(title.id);
    
    // Si no hay semanas bisiestas, retornar título sin cambios
    if (Object.keys(leapWeeks).length === 0) {
      return title;
    }
    
    // Clonar el título para no mutar el original
    const enrichedTitle = { ...title };
    
    // Asegurar que specialWeeksByYear existe
    if (!enrichedTitle.specialWeeksByYear) {
      enrichedTitle.specialWeeksByYear = {};
    }
    
    // Agregar semanas bisiestas al objeto specialWeeksByYear
    Object.entries(leapWeeks).forEach(([year, weekNumber]) => {
      const yearInt = parseInt(year);
      
      // Si el año no existe en specialWeeksByYear, crear array vacío
      if (!enrichedTitle.specialWeeksByYear[yearInt]) {
        enrichedTitle.specialWeeksByYear[yearInt] = [];
      }
      
      // Verificar si ya existe una semana bisiesta para este año
      const hasLeapWeek = enrichedTitle.specialWeeksByYear[yearInt].some(
        w => w.type === 'BISIESTA'
      );
      
      // Si no existe, agregarla
      if (!hasLeapWeek) {
        enrichedTitle.specialWeeksByYear[yearInt].push({
          type: 'BISIESTA',
          week: weekNumber
        });
      }
    });
    
    return enrichedTitle;
  } catch (error) {
    console.error('Error enriqueciendo título con semanas bisiestas:', error);
    return title;
  }
};