import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, connectFirestoreEmulator } from 'firebase/firestore';

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
const db = getFirestore(app);

// Conectar a emulador
connectFirestoreEmulator(db, 'localhost', 8090);

/**
 * Obtener todos los usuarios
 */
async function getAllUsers() {
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const users = {};
  
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    users[data.email] = {
      uid: doc.id,
      ...data
    };
  });
  
  return users;
}

/**
 * Asignar títulos a usuarios
 */
async function assignTitlesToUsers() {
  console.log('');
  console.log('📋 ASIGNACIÓN DE TÍTULOS A USUARIOS');
  console.log('═══════════════════════════════════════════════');
  console.log('');

  try {
    // 1. Obtener usuarios
    console.log('1️⃣  Obteniendo usuarios...');
    const users = await getAllUsers();
    console.log(`   ✅ ${Object.keys(users).length} usuarios encontrados`);
    console.log('');

    // 2. Definir asignaciones
    const assignments = [
      {
        email: 'juan@test.com',
        titles: ['C-1-1', 'B-2-3']
      },
      {
        email: 'maria@test.com',
        titles: ['C-2-1', 'D-1-2']
      }
    ];

    // 3. Asignar títulos
    console.log('2️⃣  Asignando títulos...');
    console.log('');

    for (const assignment of assignments) {
      const user = users[assignment.email];
      
      if (!user) {
        console.log(`   ⚠️  Usuario ${assignment.email} no encontrado`);
        continue;
      }

      // Actualizar ownerId en cada título
      for (const titleId of assignment.titles) {
        try {
          await updateDoc(doc(db, 'titles', titleId), {
            ownerId: user.uid
          });
          console.log(`   ✅ ${titleId} → ${user.name}`);
        } catch (error) {
          console.log(`   ❌ Error asignando ${titleId}:`, error.message);
        }
      }

      console.log('');
    }

    console.log('═══════════════════════════════════════════════');
    console.log('');
    console.log('📊 RESUMEN DE ASIGNACIONES:');
    console.log('');
    console.log('   Juan Pérez:');
    console.log('   - C-1-1 (Semana regular + VIP rotativo)');
    console.log('   - B-2-3 (Semana regular + VIP rotativo)');
    console.log('');
    console.log('   María González:');
    console.log('   - C-2-1 (Semana regular + VIP rotativo)');
    console.log('   - D-1-2 (Semana regular + VIP rotativo)');
    console.log('');
    console.log('   Pedro Martínez:');
    console.log('   - (Sin títulos - para testing de asignación)');
    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log('');
    console.log('✅ Asignación de títulos completada');
    console.log('');
    console.log('💡 VERIFICAR EN:');
    console.log('   http://localhost:4000/firestore');
    console.log('   - Colección: titles');
    console.log('   - Buscar documentos con ownerId');
    console.log('');
    console.log('🎯 LISTO PARA TESTING:');
    console.log('   1. Login como juan@test.com');
    console.log('   2. Verificar que ve C-1-1 y B-2-3');
    console.log('   3. Ver calendario con semanas VIP');
    console.log('   4. Intentar intercambio con María');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error.message);
    console.error('');
    process.exit(1);
  }
}

// Ejecutar
assignTitlesToUsers();