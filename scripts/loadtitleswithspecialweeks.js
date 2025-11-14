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
 * Calcula la fecha de Pascua usando el algoritmo de Computus
 */
function calcularPascua(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
}

/**
 * Calcula el número de semana del año
 */
function obtenerNumeroSemana(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
}

/**
 * Calcula las semanas especiales para un año
 */
function calcularSemanasEspeciales(year) {
  const pascua = calcularPascua(year);
  const semanaSanta = new Date(pascua);
  semanaSanta.setDate(semanaSanta.getDate() - 7);
  
  return {
    SANTA: obtenerNumeroSemana(semanaSanta),
    PASCUA: obtenerNumeroSemana(pascua),
    NAVIDAD: 51,
    FIN_ANO: 52
  };
}

/**
 * Calcula las semanas regulares para Series B, C, D
 */
function calcularSemanaRegular(serie, subserie, numero, año) {
  const añoBase = 2027;
  const añosTranscurridos = año - añoBase;
  
  if (serie === 'B' || serie === 'C' || serie === 'D') {
    const offsetSubserie = (subserie - 1) * 4;
    const offsetTitulo = (numero - 1);
    let semanaInicial = 1 + offsetSubserie + offsetTitulo;
    
    if (semanaInicial > 12) {
      semanaInicial = semanaInicial - 12;
    }
    
    const semanaActual = ((semanaInicial - 1 + añosTranscurridos) % 12) + 1;
    return semanaActual;
  }
  
  // Serie A: Datos específicos
  const serieAData = {
    '1-1': { 2027: 8, 2028: 11, 2029: 4, 2030: 7, 2031: 10, 2032: 3, 2033: 6, 2034: 9, 2035: 12 },
    '1-2': { 2027: 11, 2028: 4, 2029: 7, 2030: 10, 2031: 3, 2032: 6, 2033: 9, 2034: 12, 2035: 5 },
    '1-3': { 2027: 4, 2028: 7, 2029: 10, 2030: 3, 2031: 6, 2032: 9, 2033: 12, 2034: 5, 2035: 8 },
    '1-4': { 2027: 7, 2028: 10, 2029: 3, 2030: 6, 2031: 9, 2032: 12, 2033: 5, 2034: 8, 2035: 11 },
    '2-1': { 2027: 6, 2028: 9, 2029: 12, 2030: 5, 2031: 8, 2032: 11, 2033: 4, 2034: 7, 2035: 10 },
    '2-2': { 2027: 9, 2028: 12, 2029: 5, 2030: 8, 2031: 11, 2032: 4, 2033: 7, 2034: 10, 2035: 3 },
    '2-3': { 2027: 5, 2028: 8, 2029: 11, 2030: 4, 2031: 7, 2032: 10, 2033: 3, 2034: 6, 2035: 9 },
    '2-4': { 2027: 8, 2028: 11, 2029: 4, 2030: 7, 2031: 10, 2032: 3, 2033: 6, 2034: 9, 2035: 12 },
    '3-1': { 2027: 3, 2028: 4, 2029: 3, 2030: 4, 2031: 3, 2032: 4, 2033: 3, 2034: 4, 2035: 3 },
    '3-2': { 2027: 4, 2028: 3, 2029: 4, 2030: 3, 2031: 4, 2032: 3, 2033: 4, 2034: 3, 2035: 4 },
    '3-3': { 2027: 3, 2028: 4, 2029: 3, 2030: 4, 2031: 3, 2032: 4, 2033: 3, 2034: 4, 2035: 3 },
    '3-4': { 2027: 4, 2028: 3, 2029: 4, 2030: 3, 2031: 4, 2032: 3, 2033: 4, 2034: 3, 2035: 4 },
  };
  
  const key = `${subserie}-${numero}`;
  return serieAData[key]?.[año] || 1;
}

/**
 * Calcula qué título de una serie le corresponde una semana especial en un año
 * Basado en el patrón de rotación de las imágenes
 */
function calcularTituloSemanEspecial(serie, subserie, tipoSemana, año) {
  const añoBase = 2027;
  const añosTranscurridos = año - añoBase;
  
  // SERIE A: Cada subserie tiene sus propias semanas especiales
  if (serie === 'A') {
    // Subserie A-1: SANTA, PASCUA
    // Subserie A-2: NAVIDAD, FIN_ANO
    // Rotan entre los 4 títulos de cada subserie
    
    const rotacion = añosTranscurridos % 4;
    const numeroTitulo = rotacion + 1; // 1, 2, 3, 4
    
    if (subserie === 1) {
      // A-1 tiene SANTA y PASCUA
      if (tipoSemana === 'SANTA' || tipoSemana === 'PASCUA') {
        return `A-1-${numeroTitulo}`;
      }
    } else if (subserie === 2) {
      // A-2 tiene NAVIDAD y FIN_ANO
      if (tipoSemana === 'NAVIDAD' || tipoSemana === 'FIN_ANO') {
        return `A-2-${numeroTitulo}`;
      }
    } else if (subserie === 3) {
      // A-3 tiene rotación especial (basada en las imágenes)
      // Se alterna entre los títulos
      if (tipoSemana === 'PASCUA') {
        return `A-3-${numeroTitulo}`;
      }
    }
  }
  
  // SERIE B: Solo NAVIDAD, rota entre los 12 títulos
  if (serie === 'B' && tipoSemana === 'NAVIDAD') {
    const rotacion = añosTranscurridos % 12;
    const subserieCalc = Math.floor(rotacion / 4) + 1;
    const numeroCalc = (rotacion % 4) + 1;
    if (subserie === subserieCalc) {
      return `B-${subserie}-${numeroCalc}`;
    }
  }
  
  // SERIE C: SANTA, PASCUA, NAVIDAD, FIN_ANO rotan entre títulos
  if (serie === 'C') {
    const semanasC = ['PASCUA', 'FIN_ANO', 'NAVIDAD', 'SANTA'];
    const indexSemana = semanasC.indexOf(tipoSemana);
    
    if (indexSemana !== -1) {
      // Cada semana rota por los 12 títulos de la serie
      const offset = indexSemana * 3; // Cada semana especial empieza en diferente punto
      const rotacion = (añosTranscurridos + offset) % 12;
      const subserieCalc = Math.floor(rotacion / 4) + 1;
      const numeroCalc = (rotacion % 4) + 1;
      
      if (subserie === subserieCalc) {
        return `C-${subserie}-${numeroCalc}`;
      }
    }
  }
  
  // SERIE D: SANTA, FIN_ANO, PASCUA, NAVIDAD rotan entre títulos
  if (serie === 'D') {
    const semanasD = ['SANTA', 'FIN_ANO', 'PASCUA', 'NAVIDAD'];
    const indexSemana = semanasD.indexOf(tipoSemana);
    
    if (indexSemana !== -1) {
      const offset = indexSemana * 3;
      const rotacion = (añosTranscurridos + offset) % 12;
      const subserieCalc = Math.floor(rotacion / 4) + 1;
      const numeroCalc = (rotacion % 4) + 1;
      
      if (subserie === subserieCalc) {
        return `D-${subserie}-${numeroCalc}`;
      }
    }
  }
  
  return null;
}

/**
 * Genera el objeto completo de semanas (regulares + especiales) por año
 */
function generarSemanasPorAño(serie, subserie, numero) {
  const años = [2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];
  const weeksByYear = {};
  const specialWeeksByYear = {};
  const titleId = `${serie}-${subserie}-${numero}`;
  
  años.forEach(año => {
    // Semana regular
    weeksByYear[año] = calcularSemanaRegular(serie, subserie, numero, año);
    
    // Semanas especiales
    const semanasEspecialesAño = calcularSemanasEspeciales(año);
    const especialesEsteTitulo = [];
    
    // Verificar qué semanas especiales le corresponden a este título
    for (const [tipoSemana, numeroSemana] of Object.entries(semanasEspecialesAño)) {
      const tituloConSemana = calcularTituloSemanEspecial(serie, subserie, tipoSemana, año);
      
      if (tituloConSemana === titleId) {
        especialesEsteTitulo.push({
          type: tipoSemana,
          week: numeroSemana
        });
      }
    }
    
    specialWeeksByYear[año] = especialesEsteTitulo;
  });
  
  return { weeksByYear, specialWeeksByYear };
}

/**
 * Genera los 48 títulos con semanas regulares y especiales
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
        const { weeksByYear, specialWeeksByYear } = generarSemanasPorAño(serie, subserie, numero);
        
        titulos.push({
          id: titleId,
          serie,
          subserie: subserie.toString(),
          number: numero.toString(),
          ownerId: null,
          weeksByYear,
          specialWeeksByYear // NUEVO: semanas especiales
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
    console.log('🚀 Iniciando carga de títulos con semanas especiales...');
    console.log('');
    
    const titulos = generarTitulos();
    console.log(`📊 Total de títulos a crear: ${titulos.length}`);
    console.log('');
    
    let contador = 0;
    let titulosConEspeciales = 0;
    
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
      
      // Contar cuántos títulos tienen semanas especiales
      const tieneEspeciales = Object.values(titulo.specialWeeksByYear).some(arr => arr.length > 0);
      if (tieneEspeciales) {
        titulosConEspeciales++;
      }
      
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
    console.log(`   - Títulos con semanas especiales: ${titulosConEspeciales}`);
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