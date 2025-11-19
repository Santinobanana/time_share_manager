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

// Usuarios de prueba
const TEST_USERS = [
  {
    email: 'juan@test.com',
    password: 'test123456',
    name: 'Juan Pérez',
    phone: '+52 555 1234',
    titles: ['C-1-1', 'B-2-3'],
    isAdmin: false
  },
  {
    email: 'maria@test.com',
    password: 'test123456',
    name: 'María González',
    phone: '+52 555 5678',
    titles: ['C-2-1', 'D-1-2'],
    isAdmin: false
  },
  {
    email: 'pedro@test.com',
    password: 'test123456',
    name: 'Pedro Martínez',
    phone: '+52 555 9012',
    titles: [],
    isAdmin: false
  },
  {
    email: 'admin@test.com',
    password: 'admin123456',
    name: 'Administrador Test',
    phone: '+52 555 0000',
    titles: [],
    isAdmin: true
  }
];

/**
 * Crear un usuario de prueba
 */
async function createTestUser(userData) {
  try {
    // 1. Crear usuario en Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    const user = userCredential.user;

    // 2. Crear documento en Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: userData.email,
      name: userData.name,
      phone: userData.phone,
      titles: userData.titles,
      isAdmin: userData.isAdmin,
      isApproved: true,  // Pre-aprobados para testing
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log(`   ✅ ${userData.name} (${userData.email})`);
    console.log(`      UID: ${user.uid}`);
    console.log(`      Títulos: ${userData.titles.length > 0 ? userData.titles.join(', ') : 'ninguno'}`);
    
    return user.uid;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`   ⚠️  ${userData.email} ya existe - omitiendo`);
    } else {
      console.error(`   ❌ Error creando ${userData.email}:`, error.message);
    }
    return null;
  }
}

/**
 * Crear todos los usuarios de prueba
 */
async function createAllTestUsers() {
  console.log('');
  console.log('🧪 CREACIÓN DE USUARIOS DE PRUEBA');
  console.log('═══════════════════════════════════════════════');
  console.log('');

  const userIds = {};

  for (const userData of TEST_USERS) {
    const uid = await createTestUser(userData);
    if (uid) {
      userIds[userData.email] = uid;
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════');
  console.log('');
  console.log('📊 RESUMEN:');
  console.log(`   Total usuarios: ${TEST_USERS.length}`);
  console.log(`   Creados: ${Object.keys(userIds).length}`);
  console.log('');
  console.log('🔑 CREDENCIALES PARA TESTING:');
  console.log('');
  
  TEST_USERS.forEach(user => {
    console.log(`   ${user.name}:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${user.password}`);
    console.log(`   Rol: ${user.isAdmin ? 'Admin' : 'Usuario'}`);
    console.log('');
  });

  console.log('═══════════════════════════════════════════════');
  console.log('');
  console.log('✅ Setup de usuarios completado');
  console.log('');
  console.log('💡 PRÓXIMOS PASOS:');
  console.log('   1. Ejecutar: node tests/scripts/assignTestTitles.js');
  console.log('   2. Verificar en: http://localhost:4000/firestore');
  console.log('   3. Iniciar tests manuales');
  console.log('');

  process.exit(0);
}

// Ejecutar
createAllTestUsers().catch(error => {
  console.error('');
  console.error('❌ ERROR FATAL:', error.message);
  console.error('');
  console.error('💡 TIPS:');
  console.error('   - ¿Están corriendo los emuladores?');
  console.error('     Ejecuta: firebase emulators:start');
  console.error('   - Verifica que los puertos sean correctos');
  console.error('     Auth: localhost:9099');
  console.error('     Firestore: localhost:8090');
  console.error('');
  process.exit(1);
});