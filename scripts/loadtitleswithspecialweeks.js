import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, connectFirestoreEmulator } from 'firebase/firestore';

// ✅ IMPORTACIÓN CENTRALIZADA: Traemos solo lo necesario del servicio
import { 
  generarSemanasPorAño, 
  generarArrayAnos // Mantener por si se usa fuera de generarSemanasPorAño
} from '../src/services/weekCalculationService';

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

// ❌ CÓDIGO ELIMINADO: Todas las funciones locales de cálculo de fechas (calcularPascua, obtenerNumeroSemana, calcularSemanasEspeciales, etc.)
// fueron eliminadas ya que están en weekCalculationService.js.

/**
 * Genera los 48 títulos
 */
function generarTitulos() {
  const series = ['A', 'B', 'C', 'D'];
  const subseries = [1, 2, 3];
  const numeros = [1, 2, 3, 4];
  const titulos = [];
  
  series.forEach(serie => {
    subseries.forEach(subserie => {
      numeros.forEach(numero => {
        const titleId = `${serie}-${subserie}-${numero}`;
        
        // ✅ USANDO FUNCIÓN CENTRALIZADA
        const { weeksByYear, specialWeeksByYear } = generarSemanasPorAño(
          serie, 
          subserie, 
          numero, 
          2027, // startYear por defecto
          2200  // endYear por defecto
        );
        
        titulos.push({
          id: titleId,
          serie,
          subserie: subserie.toString(),
          number: numero.toString(),
          ownerId: null,
          weeksByYear,
          specialWeeksByYear
        });
      });
    });
  });
  
  return titulos;
}

/**
 * Cargar títulos en Firestore
 */
async function cargarTitulos() {
  try {
    console.log('🚀 CARGA CON MAPEO CORRECTO');
    console.log('════════════════════════════════════════════════');
    console.log('');
    
    const titulos = generarTitulos();
    
    
    console.log('⏳ Cargando en Firestore...');
    console.log('');
    
    let contador = 0;
    
    for (const titulo of titulos) {
      await setDoc(doc(db, 'titles', titulo.id), {
        serie: titulo.serie,
        subserie: titulo.subserie,
        number: titulo.number,
        ownerId: titulo.ownerId,
        weeksByYear: titulo.weeksByYear,
        specialWeeksByYear: titulo.specialWeeksByYear
      });
      
      contador++;
      
      if (contador % 12 === 0) {
        console.log(`✅ Progreso: ${contador}/48 títulos`);
      }
    }
    
    console.log('');
    console.log('════════════════════════════════════════════════');
    console.log('🎉 ¡CARGA COMPLETADA!');
    console.log('════════════════════════════════════════════════');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
    console.error('');
    process.exit(1);
  }
}

// Ejecutar
cargarTitulos();