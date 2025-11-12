import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Obtener todos los usuarios
 * @returns {Promise<Array>} Lista de usuarios
 */
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({
        uid: doc.id,
        ...doc.data()
      });
    });
    
    return users;
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    throw new Error('Error al obtener la lista de usuarios');
  }
};

/**
 * Obtener usuario por ID
 * @param {string} userId 
 * @returns {Promise<Object>}
 */
export const getUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      throw new Error('Usuario no encontrado');
    }
    
    return {
      uid: userDoc.id,
      ...userDoc.data()
    };
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    throw error;
  }
};

/**
 * Obtener usuarios pendientes de aprobación
 * @returns {Promise<Array>}
 */
export const getPendingUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef, 
      where('isApproved', '==', false),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({
        uid: doc.id,
        ...doc.data()
      });
    });
    
    return users;
  } catch (error) {
    console.error('Error obteniendo usuarios pendientes:', error);
    throw new Error('Error al obtener usuarios pendientes');
  }
};

/**
 * Aprobar usuario
 * @param {string} userId 
 * @returns {Promise<void>}
 */
export const approveUser = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      isApproved: true,
      isActive: true,
      updatedAt: serverTimestamp()
    });
    
    console.log('Usuario aprobado:', userId);
  } catch (error) {
    console.error('Error aprobando usuario:', error);
    throw new Error('Error al aprobar el usuario');
  }
};

/**
 * Rechazar/eliminar usuario
 * @param {string} userId 
 * @returns {Promise<void>}
 */
export const rejectUser = async (userId) => {
  try {
    // Verificar que no tenga títulos asignados
    const user = await getUserById(userId);
    
    if (user.titles && user.titles.length > 0) {
      throw new Error('No se puede eliminar un usuario con títulos asignados');
    }
    
    // Eliminar usuario de Firestore
    await deleteDoc(doc(db, 'users', userId));
    
    console.log('Usuario eliminado:', userId);
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    throw error;
  }
};

/**
 * Activar/Desactivar usuario
 * @param {string} userId 
 * @param {boolean} isActive 
 * @returns {Promise<void>}
 */
export const toggleUserStatus = async (userId, isActive) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      isActive,
      updatedAt: serverTimestamp()
    });
    
    console.log(`Usuario ${isActive ? 'activado' : 'desactivado'}:`, userId);
  } catch (error) {
    console.error('Error cambiando estado del usuario:', error);
    throw new Error('Error al cambiar el estado del usuario');
  }
};

/**
 * Actualizar información del usuario
 * @param {string} userId 
 * @param {Object} userData - { name, phone, titles }
 * @returns {Promise<void>}
 */
export const updateUser = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Solo actualizar campos permitidos
    const allowedFields = {};
    
    if (userData.name !== undefined) allowedFields.name = userData.name;
    if (userData.phone !== undefined) allowedFields.phone = userData.phone;
    if (userData.titles !== undefined) allowedFields.titles = userData.titles;
    
    allowedFields.updatedAt = serverTimestamp();
    
    await updateDoc(userRef, allowedFields);
    
    console.log('Usuario actualizado:', userId);
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    throw new Error('Error al actualizar el usuario');
  }
};

/**
 * Asignar títulos a un usuario
 * @param {string} userId 
 * @param {Array<string>} titleIds - ["A-1-1", "A-2-3"]
 * @returns {Promise<void>}
 */
export const assignTitlesToUser = async (userId, titleIds) => {
  try {
    // Verificar que los títulos existan y estén disponibles
    for (const titleId of titleIds) {
      const titleDoc = await getDoc(doc(db, 'titles', titleId));
      
      if (!titleDoc.exists()) {
        throw new Error(`El título ${titleId} no existe`);
      }
      
      const titleData = titleDoc.data();
      if (titleData.ownerId && titleData.ownerId !== userId) {
        throw new Error(`El título ${titleId} ya está asignado a otro usuario`);
      }
    }
    
    // Actualizar usuario con los títulos
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      titles: titleIds,
      updatedAt: serverTimestamp()
    });
    
    // Actualizar cada título con el ownerId
    for (const titleId of titleIds) {
      const titleRef = doc(db, 'titles', titleId);
      await updateDoc(titleRef, {
        ownerId: userId
      });
    }
    
    console.log('Títulos asignados al usuario:', userId, titleIds);
  } catch (error) {
    console.error('Error asignando títulos:', error);
    throw error;
  }
};

/**
 * Remover títulos de un usuario
 * @param {string} userId 
 * @param {Array<string>} titleIds 
 * @returns {Promise<void>}
 */
export const removeTitlesFromUser = async (userId, titleIds) => {
  try {
    // Obtener títulos actuales del usuario
    const user = await getUserById(userId);
    const currentTitles = user.titles || [];
    
    // Filtrar títulos a mantener
    const remainingTitles = currentTitles.filter(t => !titleIds.includes(t));
    
    // Actualizar usuario
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      titles: remainingTitles,
      updatedAt: serverTimestamp()
    });
    
    // Actualizar títulos removidos
    for (const titleId of titleIds) {
      const titleRef = doc(db, 'titles', titleId);
      await updateDoc(titleRef, {
        ownerId: null
      });
    }
    
    console.log('Títulos removidos del usuario:', userId, titleIds);
  } catch (error) {
    console.error('Error removiendo títulos:', error);
    throw new Error('Error al remover títulos del usuario');
  }
};

/**
 * Obtener estadísticas de usuarios
 * @returns {Promise<Object>}
 */
export const getUserStats = async () => {
  try {
    const users = await getAllUsers();
    
    return {
      total: users.length,
      pending: users.filter(u => !u.isApproved).length,
      approved: users.filter(u => u.isApproved && u.isActive).length,
      inactive: users.filter(u => !u.isActive).length,
      admins: users.filter(u => u.isAdmin).length
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    throw new Error('Error al obtener estadísticas de usuarios');
  }
};