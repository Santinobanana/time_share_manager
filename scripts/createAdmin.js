/**
 * Script para crear el usuario administrador inicial
 * 
 * IMPORTANTE: Este script solo debe ejecutarse UNA VEZ
 * 
 * USO:
 * 1. Asegúrate de tener los emuladores corriendo: firebase emulators:start
 * 2. En otra terminal, ejecuta: node scripts/createAdmin.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, doc, setDoc, connectFirestoreEmulator, serverTimestamp } from 'firebase/firestore';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDdM9-aXUV_zxLFs66BCSoxEweUGlh4HMg",
  authDomain: "timeshare-manager.firebaseapp.com",
  projectId: "timeshare-manager",
  storageBucket: "timeshare-manager.firebasestorage.app",
  messagingSenderId: "199795622877",
  appId: "1:199795622877:web:544c0bf4482c1cf600ac34"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Conectar a emuladores
connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
connectFirestoreEmulator(db, 'localhost', 8090);

// Datos del administrador
const ADMIN_DATA = {
  email: 'admin@timeshare.com',
  password: 'admin123456', // Cámbiala después del primer login
  name: 'Administrador',
  phone: ''
};

async function createAdmin() {
  try {
    console.log('🚀 Iniciando creación de usuario administrador...');
    console.log('');
    console.log('📧 Email:', ADMIN_DATA.email);
    console.log('🔑 Password:', ADMIN_DATA.password);
    console.log('');

    // 1. Crear usuario en Firebase Auth
    console.log('1️⃣  Creando usuario en Firebase Auth...');
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      ADMIN_DATA.email,
      ADMIN_DATA.password
    );
    const user = userCredential.user;
    console.log('   ✅ Usuario creado en Auth con UID:', user.uid);

    // 2. Crear documento en Firestore
    console.log('2️⃣  Creando documento en Firestore...');
    await setDoc(doc(db, 'users', user.uid), {
      email: ADMIN_DATA.email,
      name: ADMIN_DATA.name,
      phone: ADMIN_DATA.phone,
      titles: [],
      isAdmin: true,        // ✅ Es administrador
      isApproved: true,     // ✅ Pre-aprobado
      isActive: true,       // ✅ Activo
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('   ✅ Documento creado en Firestore');

    console.log('');
    console.log('🎉 ¡Usuario administrador creado exitosamente!');
    console.log('');
    console.log('📋 Credenciales para iniciar sesión:');
    console.log('   Email:', ADMIN_DATA.email);
    console.log('   Password:', ADMIN_DATA.password);
    console.log('');
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Error creando administrador:', error.message);
    console.error('');

    if (error.code === 'auth/email-already-in-use') {
      console.error('ℹ️  El usuario administrador ya existe.');
      console.error('   Si olvidaste la contraseña, elimínalo manualmente del emulador');
      console.error('   y ejecuta este script nuevamente.');
    }

    console.error('');
    process.exit(1);
  }
}

// Ejecutar
createAdmin();