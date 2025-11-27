import { db } from './config/firebase';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';

async function migrateLeapWeeksToWeek53() {
  console.log('🔄 Migrando leapWeeks → week53Assignments...');
  
  const snapshot = await getDocs(collection(db, 'leapWeeks'));
  
  for (const docSnap of snapshot.docs) {
    const oldData = docSnap.data();
    
    // Solo migrar asignaciones activas
    if (oldData.status === 'active') {
      const newData = {
        year: parseInt(docSnap.id),
        titleId: oldData.titleId,
        weekExchanged: oldData.weekNumber || 51, // Semana que cedió
        assignedBy: oldData.assignedBy,
        assignedAt: oldData.assignedAt,
        status: 'active',
        assignmentMethod: 'manual_exchange',
        // Metadata de migración
        migratedFrom: 'leapWeeks',
        migratedAt: new Date()
      };
      
      await setDoc(
        doc(db, 'week53Assignments', docSnap.id),
        newData
      );
      
      console.log(`✅ Migrado: ${docSnap.id}`);
    }
  }
  
  console.log('✅ Migración completada');
}