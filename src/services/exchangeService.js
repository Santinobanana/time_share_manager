import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  notifyNewExchangeRequest,
  notifyExchangeAccepted,
  notifyExchangeRejected,
  notifyExchangeCancelled
} from './notificationService';

/**
 * Crear una nueva solicitud de intercambio
 * @param {Object} exchangeData - Datos del intercambio
 * @returns {Promise<string>} ID del intercambio creado
 */
export const createExchange = async (exchangeData) => {
  try {
    const { fromUserId, toUserId, fromWeek, toWeek, message, year } = exchangeData;

    // Crear intercambio
    const exchangeRef = await addDoc(collection(db, 'exchanges'), {
      fromUserId,
      toUserId,
      fromWeek,  // { titleId, weekNumber }
      toWeek,    // { titleId, weekNumber }
      status: 'pending', // pending, accepted, rejected, cancelled
      message: message || '',
      year,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      resolvedAt: null
    });

    console.log('Intercambio creado:', exchangeRef.id);

    // Obtener información de usuarios para notificación
    try {
      const fromUserDoc = await getDoc(doc(db, 'users', fromUserId));
      const toUserDoc = await getDoc(doc(db, 'users', toUserId));

      if (fromUserDoc.exists() && toUserDoc.exists()) {
        const fromUserData = fromUserDoc.data();
        const toUserData = toUserDoc.data();

        // Enviar notificación al usuario que recibe la solicitud
        await notifyNewExchangeRequest({
          toUserEmail: toUserData.email,
          toUserName: toUserData.name,
          fromUserName: fromUserData.name,
          fromWeek,
          toWeek,
          year
        });
      }
    } catch (emailError) {
      console.error('Error enviando notificación:', emailError);
      // No lanzar error para no afectar la creación del intercambio
    }

    return exchangeRef.id;
  } catch (error) {
    console.error('Error creando intercambio:', error);
    throw new Error('Error al crear la solicitud de intercambio');
  }
};

/**
 * Obtener todos los intercambios de un usuario (enviados y recibidos)
 * @param {string} userId 
 * @returns {Promise<Object>} { sent: [], received: [] }
 */
export const getUserExchanges = async (userId) => {
  try {
    // Intercambios enviados
    const sentQuery = query(
      collection(db, 'exchanges'),
      where('fromUserId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const sentSnapshot = await getDocs(sentQuery);
    const sentExchanges = [];
    sentSnapshot.forEach(doc => {
      sentExchanges.push({ id: doc.id, ...doc.data() });
    });

    // Intercambios recibidos
    const receivedQuery = query(
      collection(db, 'exchanges'),
      where('toUserId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const receivedSnapshot = await getDocs(receivedQuery);
    const receivedExchanges = [];
    receivedSnapshot.forEach(doc => {
      receivedExchanges.push({ id: doc.id, ...doc.data() });
    });

    return {
      sent: sentExchanges,
      received: receivedExchanges
    };
  } catch (error) {
    console.error('Error obteniendo intercambios del usuario:', error);
    throw new Error('Error al obtener intercambios');
  }
};

/**
 * Obtener intercambios pendientes de un usuario (solo los recibidos que debe responder)
 * @param {string} userId 
 * @returns {Promise<Array>}
 */
export const getPendingExchanges = async (userId) => {
  try {
    const q = query(
      collection(db, 'exchanges'),
      where('toUserId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const exchanges = [];
    
    querySnapshot.forEach(doc => {
      exchanges.push({ id: doc.id, ...doc.data() });
    });
    
    return exchanges;
  } catch (error) {
    console.error('Error obteniendo intercambios pendientes:', error);
    throw new Error('Error al obtener intercambios pendientes');
  }
};

/**
 * Aceptar un intercambio
 * @param {string} exchangeId 
 * @returns {Promise<void>}
 */
export const acceptExchange = async (exchangeId) => {
  try {
    const exchangeRef = doc(db, 'exchanges', exchangeId);
    const exchangeDoc = await getDoc(exchangeRef);
    
    if (!exchangeDoc.exists()) {
      throw new Error('Intercambio no encontrado');
    }
    
    const exchangeData = exchangeDoc.data();
    
    await updateDoc(exchangeRef, {
      status: 'accepted',
      resolvedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('Intercambio aceptado:', exchangeId);

    // Enviar notificación al usuario que envió la solicitud
    try {
      const fromUserDoc = await getDoc(doc(db, 'users', exchangeData.fromUserId));
      const toUserDoc = await getDoc(doc(db, 'users', exchangeData.toUserId));

      if (fromUserDoc.exists() && toUserDoc.exists()) {
        const fromUserData = fromUserDoc.data();
        const toUserData = toUserDoc.data();

        await notifyExchangeAccepted({
          toUserEmail: fromUserData.email,
          toUserName: fromUserData.name,
          fromUserName: toUserData.name,
          fromWeek: exchangeData.fromWeek,
          toWeek: exchangeData.toWeek,
          year: exchangeData.year
        });
      }
    } catch (emailError) {
      console.error('Error enviando notificación:', emailError);
    }
  } catch (error) {
    console.error('Error aceptando intercambio:', error);
    throw new Error('Error al aceptar el intercambio');
  }
};

/**
 * Rechazar un intercambio
 * @param {string} exchangeId 
 * @returns {Promise<void>}
 */
export const rejectExchange = async (exchangeId) => {
  try {
    const exchangeRef = doc(db, 'exchanges', exchangeId);
    const exchangeDoc = await getDoc(exchangeRef);
    
    if (!exchangeDoc.exists()) {
      throw new Error('Intercambio no encontrado');
    }
    
    const exchangeData = exchangeDoc.data();
    
    await updateDoc(exchangeRef, {
      status: 'rejected',
      resolvedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('Intercambio rechazado:', exchangeId);

    // Enviar notificación al usuario que envió la solicitud
    try {
      const fromUserDoc = await getDoc(doc(db, 'users', exchangeData.fromUserId));
      const toUserDoc = await getDoc(doc(db, 'users', exchangeData.toUserId));

      if (fromUserDoc.exists() && toUserDoc.exists()) {
        const fromUserData = fromUserDoc.data();
        const toUserData = toUserDoc.data();

        await notifyExchangeRejected({
          toUserEmail: fromUserData.email,
          toUserName: fromUserData.name,
          fromUserName: toUserData.name,
          fromWeek: exchangeData.fromWeek,
          toWeek: exchangeData.toWeek,
          year: exchangeData.year
        });
      }
    } catch (emailError) {
      console.error('Error enviando notificación:', emailError);
    }
  } catch (error) {
    console.error('Error rechazando intercambio:', error);
    throw new Error('Error al rechazar el intercambio');
  }
};

/**
 * Cancelar un intercambio enviado (solo si está pendiente)
 * @param {string} exchangeId 
 * @param {string} userId - ID del usuario que intenta cancelar
 * @returns {Promise<void>}
 */
export const cancelExchange = async (exchangeId, userId) => {
  try {
    const exchangeRef = doc(db, 'exchanges', exchangeId);
    const exchangeDoc = await getDoc(exchangeRef);
    
    if (!exchangeDoc.exists()) {
      throw new Error('Intercambio no encontrado');
    }
    
    const exchangeData = exchangeDoc.data();
    
    // Verificar que el usuario sea quien envió la solicitud
    if (exchangeData.fromUserId !== userId) {
      throw new Error('No tienes permiso para cancelar este intercambio');
    }
    
    // Verificar que esté pendiente
    if (exchangeData.status !== 'pending') {
      throw new Error('Solo puedes cancelar intercambios pendientes');
    }
    
    await updateDoc(exchangeRef, {
      status: 'cancelled',
      resolvedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('Intercambio cancelado:', exchangeId);

    // Enviar notificación al usuario que iba a recibir el intercambio
    try {
      const fromUserDoc = await getDoc(doc(db, 'users', exchangeData.fromUserId));
      const toUserDoc = await getDoc(doc(db, 'users', exchangeData.toUserId));

      if (fromUserDoc.exists() && toUserDoc.exists()) {
        const fromUserData = fromUserDoc.data();
        const toUserData = toUserDoc.data();

        await notifyExchangeCancelled({
          toUserEmail: toUserData.email,
          toUserName: toUserData.name,
          fromUserName: fromUserData.name,
          fromWeek: exchangeData.fromWeek,
          toWeek: exchangeData.toWeek,
          year: exchangeData.year
        });
      }
    } catch (emailError) {
      console.error('Error enviando notificación:', emailError);
    }
  } catch (error) {
    console.error('Error cancelando intercambio:', error);
    throw error;
  }
};

/**
 * Obtener detalles completos de un intercambio con información de usuarios
 * @param {string} exchangeId 
 * @returns {Promise<Object>}
 */
export const getExchangeDetails = async (exchangeId) => {
  try {
    const exchangeRef = doc(db, 'exchanges', exchangeId);
    const exchangeDoc = await getDoc(exchangeRef);
    
    if (!exchangeDoc.exists()) {
      throw new Error('Intercambio no encontrado');
    }
    
    const exchangeData = exchangeDoc.data();
    
    // Obtener información de los usuarios
    const fromUserDoc = await getDoc(doc(db, 'users', exchangeData.fromUserId));
    const toUserDoc = await getDoc(doc(db, 'users', exchangeData.toUserId));
    
    return {
      id: exchangeDoc.id,
      ...exchangeData,
      fromUser: fromUserDoc.exists() ? {
        uid: fromUserDoc.id,
        name: fromUserDoc.data().name,
        email: fromUserDoc.data().email
      } : null,
      toUser: toUserDoc.exists() ? {
        uid: toUserDoc.id,
        name: toUserDoc.data().name,
        email: toUserDoc.data().email
      } : null
    };
  } catch (error) {
    console.error('Error obteniendo detalles del intercambio:', error);
    throw error;
  }
};

/**
 * Obtener historial de intercambios (aceptados, rechazados, cancelados)
 * @param {string} userId 
 * @returns {Promise<Array>}
 */
export const getExchangeHistory = async (userId) => {
  try {
    const q = query(
      collection(db, 'exchanges'),
      where('status', 'in', ['accepted', 'rejected', 'cancelled']),
      orderBy('resolvedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const exchanges = [];
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      // Solo incluir intercambios donde el usuario participó
      if (data.fromUserId === userId || data.toUserId === userId) {
        exchanges.push({ id: doc.id, ...data });
      }
    });
    
    return exchanges;
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    throw new Error('Error al obtener el historial de intercambios');
  }
};

/**
 * Obtener estadísticas de intercambios de un usuario
 * @param {string} userId 
 * @returns {Promise<Object>}
 */
export const getExchangeStats = async (userId) => {
  try {
    const { sent, received } = await getUserExchanges(userId);
    
    return {
      total: sent.length + received.length,
      sent: sent.length,
      received: received.length,
      pending: [...sent, ...received].filter(e => e.status === 'pending').length,
      accepted: [...sent, ...received].filter(e => e.status === 'accepted').length,
      rejected: [...sent, ...received].filter(e => e.status === 'rejected').length,
      cancelled: [...sent, ...received].filter(e => e.status === 'cancelled').length
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    throw new Error('Error al obtener estadísticas de intercambios');
  }
};

/**
 * Verificar si ya existe una solicitud de intercambio pendiente entre dos usuarios para las mismas semanas
 * @param {string} fromUserId 
 * @param {string} toUserId 
 * @param {Object} fromWeek 
 * @param {Object} toWeek 
 * @returns {Promise<boolean>}
 */
export const checkDuplicateExchange = async (fromUserId, toUserId, fromWeek, toWeek) => {
  try {
    const q = query(
      collection(db, 'exchanges'),
      where('fromUserId', '==', fromUserId),
      where('toUserId', '==', toUserId),
      where('status', '==', 'pending')
    );
    
    const querySnapshot = await getDocs(q);
    
    // Verificar si ya existe una solicitud con las mismas semanas
    let duplicate = false;
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (
        data.fromWeek.titleId === fromWeek.titleId &&
        data.fromWeek.weekNumber === fromWeek.weekNumber &&
        data.toWeek.titleId === toWeek.titleId &&
        data.toWeek.weekNumber === toWeek.weekNumber
      ) {
        duplicate = true;
      }
    });
    
    return duplicate;
  } catch (error) {
    console.error('Error verificando duplicados:', error);
    return false;
  }
};