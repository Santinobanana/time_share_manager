import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, connectFirestoreEmulator } from 'firebase/firestore';

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
 * Calcula las semanas asignadas por año para Series B, C, D
 * @param {string} serie - A, B, C, D
 * @param {number} subserie - 1, 2, 3
 * @param {number} numero - 1, 2, 3, 4
 * @param {number} año - Año a calcular
 * @returns {number} Número de semana (1-12)
 */
function calcularSemanaRegular(serie, subserie, numero, año) {
  const añoBase = 2027;
  const añosTranscurridos = año - añoBase;
  
  // Para Series B, C, D (patrón confirmado)
  if (serie === 'B' || serie === 'C' || serie === 'D') {
    const offsetSubserie = (subserie - 1) * 4;
    const offsetTitulo = (numero - 1);
    let semanaInicial = 1 + offsetSubserie + offsetTitulo;
    
    // Si pasa de 12, restar 12
    if (semanaInicial > 12) {
      semanaInicial = semanaInicial - 12;
    }
    
    // Aplicar rotación anual
    const semanaActual = ((semanaInicial - 1 + añosTranscurridos) % 12) + 1;
    
    return semanaActual;
  }
  
  // Serie A: Patrón temporal (se definirá después)
  // Por ahora usamos datos hardcodeados de los años que tenemos
  const serieAData = {
    '1-1': { 2027: 8, 2028: 11, 2029: 4, 2030: 7, 2031: 10, 2032: 3, 2033: 6 },
    '1-2': { 2027: 11, 2028: 4, 2029: 7, 2030: 10, 2031: 3, 2032: 6, 2033: 9 },
    '1-3': { 2027: 4, 2028: 7, 2029: 10, 2030: 3, 2031: 6, 2032: 9, 2033: 12 },
    '1-4': { 2027: 7, 2028: 10, 2029: 3, 2030: 6, 2031: 9, 2032: 12, 2033: 5 },
    '2-1': { 2027: 6, 2028: 9, 2029: 12, 2030: 5, 2031: 8, 2032: 11, 2033: 4 },
    '2-2': { 2027: 9, 2028: 12, 2029: 5, 2030: 8, 2031: 11, 2032: 4, 2033: 7 },
    '2-3': { 2027: 5, 2028: 8, 2029: 11, 2030: 4, 2031: 7, 2032: 10, 2033: 3 },
    '2-4': { 2027: 8, 2028: 11, 2029: 4, 2030: 7, 2031: 10, 2032: 3, 2033: 6 },
    '3-1': { 2027: 3, 2028: 4, 2029: 3, 2030: 4, 2031: 3, 2032: 4, 2033: 3 },
    '3-2': { 2027: 4, 2028: 3, 2029: 4, 2030: 3, 2031: 4, 2032: 3, 2033: 4 },
    '3-3': { 2027: 3, 2028: 4, 2029: 3, 2030: 4, 2031: 3, 2032: 4, 2033: 3 },
    '3-4': { 2027: 4, 2028: 3, 2029: 4, 2030: 3, 2031: 4, 2032: 3, 2033: 4 },
  };
  
  const key = `${subserie}-${numero}`;
  return serieAData[key]?.[año] || 1;
}

/**
 * Genera el objeto de semanas por año para un título
 */
function generarSemanasPorAño(serie, subserie, numero) {
  const años = [2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];
  const weeksByYear = {};
  
  años.forEach(año => {
    weeksByYear[año] = calcularSemanaRegular(serie, subserie, numero, año);
  });
  
  return weeksByYear;
}

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
        const weeksByYear = generarSemanasPorAño(serie, subserie, numero);
        
        titulos.push({
          id: titleId,
          serie,
          subserie: subserie.toString(),
          number: numero.toString(),
          ownerId: null,
          weeksByYear
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
    console.log('🚀 Iniciando carga de títulos...');
    console.log('');
    
    const titulos = generarTitulos();
    console.log(`📊 Total de títulos a crear: ${titulos.length}`);
    console.log('');
    
    let contador = 0;
    
    for (const titulo of titulos) {
      await setDoc(doc(db, 'titles', titulo.id), {
        serie: titulo.serie,
        subserie: titulo.subserie,
        number: titulo.number,
        ownerId: titulo.ownerId,
        weeksByYear: titulo.weeksByYear
      });
      
      contador++;
      
      if (contador % 12 === 0) {
        console.log(`✅ Progreso: ${contador}/${titulos.length} títulos creados`);
      }
    }
    
    console.log('');
    console.log(`🎉 ¡Todos los títulos fueron creados exitosamente!`);
    console.log('');
    console.log('📋 Resumen:');
    console.log(`   - Serie A: 12 títulos`);
    console.log(`   - Serie B: 12 títulos`);
    console.log(`   - Serie C: 12 títulos`);
    console.log(`   - Serie D: 12 títulos`);
    console.log(`   - Total: ${titulos.length} títulos`);
    console.log('');
    console.log('💡 Puedes verificarlos en: http://localhost:4000/firestore');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Error cargando títulos:', error.message);
    console.error('');
    process.exit(1);
  }
}

// Ejecutar
cargarTitulos();