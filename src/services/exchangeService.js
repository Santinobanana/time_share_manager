import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  addDoc,
  updateDoc,
  deleteDoc,
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
  notifyExchangeCancelled,
  notifyAcceptedExchangeCancelled
} from './notificationService';

export const createExchange = async (exchangeData) => {
  try {
    const { fromUserId, toUserId, fromWeek, toWeek, message, year } = exchangeData;

    const exchangeRef = await addDoc(collection(db, 'exchanges'), {
      fromUserId,
      toUserId,
      fromWeek,
      toWeek,
      status: 'pending',
      message: message || '',
      year,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      resolvedAt: null
    });

    try {
      const fromUserDoc = await getDoc(doc(db, 'users', fromUserId));
      const toUserDoc = await getDoc(doc(db, 'users', toUserId));

      if (fromUserDoc.exists() && toUserDoc.exists()) {
        const fromUserData = fromUserDoc.data();
        const toUserData = toUserDoc.data();

        await notifyNewExchangeRequest({
          toUserEmail: toUserData.email,
          toUserName: toUserData.name,
          fromUserName: fromUserData.name,
          fromWeek,
          toWeek,
          year,
          message
        });
      }
    } catch (emailError) {
      console.error('Error enviando notificación:', emailError);
    }

    return exchangeRef.id;
  } catch (error) {
    console.error('Error creando intercambio:', error);
    throw new Error('Error al crear la solicitud de intercambio');
  }
};

export const getUserExchanges = async (userId) => {
  try {
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

export const acceptExchange = async (exchangeId) => {
  try {
    const exchangeRef = doc(db, 'exchanges', exchangeId);
    const exchangeDoc = await getDoc(exchangeRef);
    
    if (!exchangeDoc.exists()) {
      throw new Error('Intercambio no encontrado');
    }
    
    const exchangeData = exchangeDoc.data();
    
    // 1. Actualizar status
    await updateDoc(exchangeRef, {
      status: 'accepted',
      resolvedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // 2. Crear registro activo
    await addDoc(collection(db, 'activeExchanges'), {
      exchangeId,
      fromUserId: exchangeData.fromUserId,
      toUserId: exchangeData.toUserId,
      fromWeek: exchangeData.fromWeek,
      toWeek: exchangeData.toWeek,
      year: exchangeData.year,
      activatedAt: serverTimestamp()
    });
    
    // 3. Notificar
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

export const cancelExchange = async (exchangeId, userId) => {
  try {
    const exchangeRef = doc(db, 'exchanges', exchangeId);
    const exchangeDoc = await getDoc(exchangeRef);
    
    if (!exchangeDoc.exists()) {
      throw new Error('Intercambio no encontrado');
    }
    
    const exchangeData = exchangeDoc.data();
    
    await updateDoc(exchangeRef, {
      status: 'cancelled',
      resolvedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
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
 * CORREGIDO: Cancelar intercambio aceptado con reversión
 * Ahora elimina correctamente de activeExchanges
 */
export const cancelAcceptedExchange = async (exchangeId, userId) => {
  try {    
    const exchangeRef = doc(db, 'exchanges', exchangeId);
    const exchangeDoc = await getDoc(exchangeRef);
    
    if (!exchangeDoc.exists()) {
      throw new Error('Intercambio no encontrado');
    }
    
    const exchangeData = exchangeDoc.data();
    
    // Verificar permiso
    if (exchangeData.fromUserId !== userId && exchangeData.toUserId !== userId) {
      throw new Error('No tienes permiso para cancelar este intercambio');
    }
    
    // Verificar status
    if (exchangeData.status !== 'accepted') {
      throw new Error('Solo puedes cancelar intercambios aceptados');
    }
    
    // 1. Cambiar status a cancelled
    await updateDoc(exchangeRef, {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      cancelledBy: userId,
      updatedAt: serverTimestamp()
    });
    
    
    // 2. Eliminar de activeExchanges (reversión)
    // Buscar por exchangeId
    const activeQuery = query(
      collection(db, 'activeExchanges'),
      where('exchangeId', '==', exchangeId)
    );
    
    const activeSnapshot = await getDocs(activeQuery);
    
    
    if (activeSnapshot.empty) {
      console.warn('⚠️ No se encontraron documentos en activeExchanges para este exchangeId');
      console.warn('   Esto puede pasar si el intercambio ya fue cancelado antes');
    } else {
      // Eliminar todos los documentos encontrados
      const deletePromises = [];
      activeSnapshot.forEach(docSnap => {
        deletePromises.push(deleteDoc(docSnap.ref));
      });
      
      await Promise.all(deletePromises);
    }
    

    // 3. Notificar
    try {
      const fromUserDoc = await getDoc(doc(db, 'users', exchangeData.fromUserId));
      const toUserDoc = await getDoc(doc(db, 'users', exchangeData.toUserId));

      if (fromUserDoc.exists() && toUserDoc.exists()) {
        const fromUserData = fromUserDoc.data();
        const toUserData = toUserDoc.data();
        
        const cancellingUser = userId === exchangeData.fromUserId ? fromUserData : toUserData;
        const notifiedUser = userId === exchangeData.fromUserId ? toUserData : fromUserData;

        await notifyAcceptedExchangeCancelled({
          toUserEmail: notifiedUser.email,
          toUserName: notifiedUser.name,
          fromUserName: cancellingUser.name,
          fromWeek: exchangeData.fromWeek,
          toWeek: exchangeData.toWeek,
          year: exchangeData.year
        });
              }
    } catch (emailError) {
      console.error('Error enviando notificación:', emailError);
    }
  } catch (error) {
    console.error('❌ Error cancelando intercambio aceptado:', error);
    throw error;
  }
};

export const getActiveExchanges = async (userId, year) => {
  try {
    const q1 = query(
      collection(db, 'activeExchanges'),
      where('fromUserId', '==', userId),
      where('year', '==', year)
    );
    
    const q2 = query(
      collection(db, 'activeExchanges'),
      where('toUserId', '==', userId),
      where('year', '==', year)
    );
    
    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ]);
    
    const activeExchanges = [];
    
    snapshot1.forEach(doc => {
      activeExchanges.push({ id: doc.id, ...doc.data() });
    });
    
    snapshot2.forEach(doc => {
      activeExchanges.push({ id: doc.id, ...doc.data() });
    });
    
    return activeExchanges;
  } catch (error) {
    console.error('Error obteniendo intercambios activos:', error);
    throw new Error('Error al obtener intercambios activos');
  }
};

export const getExchangeDetails = async (exchangeId) => {
  try {
    const exchangeRef = doc(db, 'exchanges', exchangeId);
    const exchangeDoc = await getDoc(exchangeRef);
    
    if (!exchangeDoc.exists()) {
      throw new Error('Intercambio no encontrado');
    }
    
    const exchangeData = exchangeDoc.data();
    
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

export const getAllExchangesForAdmin = async () => {
  try {
    // Obtener todos los intercambios ordenados por fecha de creación
    const q = query(
      collection(db, 'exchanges'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const allExchanges = [];
    
    // Obtener datos de usuarios para cada intercambio
    for (const docSnap of querySnapshot.docs) {
      const exchangeData = docSnap.data();
      
      // Obtener información de los usuarios involucrados
      const fromUserDoc = await getDoc(doc(db, 'users', exchangeData.fromUserId));
      const toUserDoc = await getDoc(doc(db, 'users', exchangeData.toUserId));
      
      allExchanges.push({
        id: docSnap.id,
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
      });
    }
    
    // Clasificar por estado
    return {
      all: allExchanges,
      pending: allExchanges.filter(e => e.status === 'pending'),
      accepted: allExchanges.filter(e => e.status === 'accepted'),
      rejected: allExchanges.filter(e => e.status === 'rejected'),
      cancelled: allExchanges.filter(e => e.status === 'cancelled')
    };
  } catch (error) {
    console.error('Error obteniendo todos los intercambios:', error);
    throw new Error('Error al obtener todos los intercambios del sistema');
  }
};

/**
 * Obtener estadísticas globales de intercambios (solo para administradores)
 * @returns {Promise<Object>}
 */
export const getGlobalExchangeStats = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'exchanges'));
    const exchanges = [];
    
    querySnapshot.forEach(doc => {
      exchanges.push(doc.data());
    });
    
    return {
      total: exchanges.length,
      pending: exchanges.filter(e => e.status === 'pending').length,
      accepted: exchanges.filter(e => e.status === 'accepted').length,
      rejected: exchanges.filter(e => e.status === 'rejected').length,
      cancelled: exchanges.filter(e => e.status === 'cancelled').length
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas globales:', error);
    throw new Error('Error al obtener estadísticas globales de intercambios');
  }
};

export const checkDuplicateExchange = async (fromUserId, toUserId, fromWeek, toWeek) => {
  try {
    const q = query(
      collection(db, 'exchanges'),
      where('fromUserId', '==', fromUserId),
      where('toUserId', '==', toUserId),
      where('status', '==', 'pending')
    );
    
    const querySnapshot = await getDocs(q);
    
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