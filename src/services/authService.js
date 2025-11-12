import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

/**
 * Registrar nuevo usuario
 * @param {Object} userData - Datos del usuario
 * @returns {Promise<Object>} Usuario creado
 */
export const registerUser = async (userData) => {
  try {
    const { email, password, name, phone, titles } = userData;

    // 1. Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Actualizar perfil con el nombre
    await updateProfile(user, { displayName: name });

    // 3. Crear documento en Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email,
      name,
      phone: phone || '',
      titles: titles || [],
      isAdmin: false,
      isApproved: false, // Requiere aprobación del admin
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      uid: user.uid,
      email,
      name,
      phone,
      titles,
      isAdmin: false,
      isApproved: false,
      isActive: true
    };
  } catch (error) {
    console.error('Error registrando usuario:', error);
    throw handleAuthError(error);
  }
};

/**
 * Iniciar sesión
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<Object>} Datos del usuario
 */
export const loginUser = async (email, password) => {
  try {
    // 1. Autenticar con Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Obtener datos adicionales de Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      throw new Error('Usuario no encontrado en la base de datos');
    }

    const userData = userDoc.data();

    // 3. Verificar si el usuario está aprobado
    if (!userData.isApproved) {
      await signOut(auth);
      throw new Error('Tu cuenta está pendiente de aprobación por un administrador');
    }

    // 4. Verificar si el usuario está activo
    if (!userData.isActive) {
      await signOut(auth);
      throw new Error('Tu cuenta ha sido desactivada');
    }

    return {
      uid: user.uid,
      email: user.email,
      name: userData.name,
      phone: userData.phone,
      titles: userData.titles,
      isAdmin: userData.isAdmin,
      isApproved: userData.isApproved,
      isActive: userData.isActive
    };
  } catch (error) {
    console.error('Error en login:', error);
    throw handleAuthError(error);
  }
};

/**
 * Cerrar sesión
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error en logout:', error);
    throw handleAuthError(error);
  }
};

/**
 * Recuperar contraseña
 * @param {string} email 
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error recuperando contraseña:', error);
    throw handleAuthError(error);
  }
};

/**
 * Obtener usuario actual con datos de Firestore
 * @returns {Promise<Object|null>}
 */
export const getCurrentUser = async () => {
  const user = auth.currentUser;
  
  if (!user) return null;

  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();

    return {
      uid: user.uid,
      email: user.email,
      name: userData.name,
      phone: userData.phone,
      titles: userData.titles,
      isAdmin: userData.isAdmin,
      isApproved: userData.isApproved,
      isActive: userData.isActive
    };
  } catch (error) {
    console.error('Error obteniendo usuario actual:', error);
    return null;
  }
};

/**
 * Observer de cambios en autenticación
 * @param {Function} callback - Función que se ejecuta cuando cambia el estado de auth
 * @returns {Function} Función para cancelar la suscripción
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userData = await getCurrentUser();
      callback(userData);
    } else {
      callback(null);
    }
  });
};

/**
 * Manejo de errores de Firebase Auth
 * @param {Error} error 
 * @returns {Error}
 */
const handleAuthError = (error) => {
  const errorMessages = {
    'auth/email-already-in-use': 'Este correo electrónico ya está registrado',
    'auth/invalid-email': 'Correo electrónico inválido',
    'auth/operation-not-allowed': 'Operación no permitida',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
    'auth/user-not-found': 'Usuario no encontrado',
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/invalid-credential': 'Credenciales inválidas',
    'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde',
    'auth/network-request-failed': 'Error de conexión. Verifica tu internet'
  };

  const message = errorMessages[error.code] || error.message || 'Error de autenticación';
  return new Error(message);
};