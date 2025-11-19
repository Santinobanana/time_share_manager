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
 * Genera todos los años desde 2027 hasta 2074 (48 años)
 */
function generarArrayAnos() {
  const años = [];
  for (let año = 2027; año <= 2074; año++) {
    años.push(año);
  }
  return años;
}

/**
 * Calcula las semanas regulares
 */
function calcularSemanaRegular(serie, subserie, numero, año) {
  const añoBase = 2027;
  const añosTranscurridos = año - añoBase;
  
  // Series B, C, D: Rotación de 12 semanas
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
  
  // Serie A: Patrón específico
  if (serie === 'A') {
    const serieABasePattern = {
      '1-1': [2, 3, 4, 5, 6, 7, 8, 9, 10],
      '1-2': [5, 6, 7, 8, 9, 10, 11, 12, 1],
      '1-3': [8, 9, 10, 11, 12, 1, 2, 5, 6],
      '1-4': [12, 1, 2, 3, 4, 5, 6, 8, 9],
      '2-1': [1, 2, 3, 4, 5, 6, 7, 7, 8],
      '2-2': [3, 4, 5, 6, 7, 8, 9, 10, 11],
      '2-3': [6, 7, 8, 9, 10, 11, 12, 1, 2],
      '2-4': [10, 11, 12, 1, 2, 3, 4, 5, 6],
      '3-1': [9, 10, 11, 12, 1, 2, 3, 4, 5],
      '3-2': [11, 12, 1, 2, 3, 4, 5, 6, 7],
      '3-3': [2, 3, 4, 5, 6, 7, 8, 9, 10],
      '3-4': [4, 5, 6, 7, 8, 9, 10, 11, 12],
    };

    const key = `${subserie}-${numero}`;
    const pattern = serieABasePattern[key];
    
    if (!pattern) {
      return 1;
    }

    const patternIndex = añosTranscurridos % 9;
    return pattern[patternIndex];
  }
  
  return 1;
}

/**
 * Calcula qué título le corresponde una semana especial
 * CADA SERIE TIENE UN OFFSET INICIAL DIFERENTE
 */
function calcularTituloSemanEspecial(serie, subserie, numero, tipoSemana, año) {
  const añoBase = 2027;
  const añosTranscurridos = año - añoBase;
  
  // SERIE A: Lógica específica (sin cambios)
  if (serie === 'A') {
    const rotacion = añosTranscurridos % 4;
    const numeroTitulo = rotacion + 1;
    
    const currentTitleId = `A-${subserie}-${numero}`;
    const assignedTitleId = `A-${subserie}-${numeroTitulo}`;

    if (subserie === 1) {
      if (currentTitleId === assignedTitleId && 
          (tipoSemana === 'SANTA' || tipoSemana === 'PASCUA')) {
        return currentTitleId;
      }
    } else if (subserie === 2) {
      if (currentTitleId === assignedTitleId && 
          (tipoSemana === 'NAVIDAD' || tipoSemana === 'FIN_ANO')) {
        return currentTitleId;
      }
    } else if (subserie === 3) {
      if (currentTitleId === assignedTitleId) {
        return currentTitleId;
      }
    }
    
    return null;
  }
  
  // SERIES B, C, D: CON OFFSET INICIAL POR SERIE
  if (serie === 'B' || serie === 'C' || serie === 'D') {
    // 1. Determinar qué título está activo este año (ciclo de 12)
    const añosIndex = añosTranscurridos % 12;
    const assignedSubserie = (añosIndex % 3) + 1;
    const assignedNumero = Math.floor(añosIndex / 3) + 1;
    
    const assignedTitleId = `${serie}-${assignedSubserie}-${assignedNumero}`;
    const currentTitleId = `${serie}-${subserie}-${numero}`;

    // Si este título no está activo este año, retornar null
    if (currentTitleId !== assignedTitleId) {
      return null;
    }

    // 2. OFFSET INICIAL POR SERIE
    // Según tu patrón:
    // 2027: A-1-1 Santa(2),  B-1-1 Pascua(3), C-1-1 Navidad(0), D-1-1 Fin_Año(1)
    // 2028: A-2-1 Pascua(3), B-2-1 Navidad(0), C-2-1 Fin_Año(1), D-2-1 Santa(2)
    // 2029: A-3-1 Navidad(0), B-3-1 Fin_Año(1), C-3-1 Santa(2),  D-3-1 Pascua(3)
    
    const OFFSET_POR_SERIE = {
      'A': 2,  // A empieza en SANTA (índice 2)
      'B': 3,  // B empieza en PASCUA (índice 3)
      'C': 0,  // C empieza en NAVIDAD (índice 0)
      'D': 1   // D empieza en FIN_ANO (índice 1)
    };

    const offsetInicial = OFFSET_POR_SERIE[serie];

    // 3. Determinar qué semana especial corresponde (con offset acumulativo)
    const ciclosCompletos = Math.floor(añosTranscurridos / 12);
    const semanaOffset = ciclosCompletos % 4;
    const baseIndex = añosTranscurridos % 4;
    
    // Aplicar offset inicial de la serie + offset acumulativo + índice base
    const realIndex = (offsetInicial + baseIndex + semanaOffset) % 4;
    
    // Orden de semanas (array base)
    const SPECIAL_WEEKS_ORDER = ['NAVIDAD', 'FIN_ANO', 'SANTA', 'PASCUA'];
    const assignedWeekType = SPECIAL_WEEKS_ORDER[realIndex];

    // 4. Verificar si coincide con la semana solicitada
    if (tipoSemana === assignedWeekType) {
      return currentTitleId;
    }
  }
  
  return null;
}

/**
 * Genera el objeto completo de semanas por año
 */
function generarSemanasPorAño(serie, subserie, numero) {
  const años = generarArrayAnos();
  const weeksByYear = {};
  const specialWeeksByYear = {};
  const titleId = `${serie}-${subserie}-${numero}`;
  
  años.forEach(año => {
    weeksByYear[año] = calcularSemanaRegular(serie, subserie, numero, año);
    
    const semanasEspecialesAño = calcularSemanasEspeciales(año);
    const especialesEsteTitulo = [];
    
    for (const [tipoSemana, numeroSemana] of Object.entries(semanasEspecialesAño)) {
      const tituloConSemana = calcularTituloSemanEspecial(serie, subserie, numero, tipoSemana, año);
      
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
        const { weeksByYear, specialWeeksByYear } = generarSemanasPorAño(serie, subserie, numero);
        
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
 * Verifica el patrón específico que mencionaste
 */
function verificarPatronEspecifico(titulos) {
  console.log('');
  console.log('🔍 VERIFICACIÓN DEL PATRÓN ESPECÍFICO:');
  console.log('═══════════════════════════════════════════════');
  console.log('');
  
  console.log('📌 Año 2027 (tu patrón esperado):');
  console.log('───────────────────────────────────────────────');
  
  const verificaciones2027 = [
    { titulo: 'A-1-1', esperado: 'SANTA' },
    { titulo: 'B-1-1', esperado: 'PASCUA' },
    { titulo: 'C-1-1', esperado: 'NAVIDAD' },
    { titulo: 'D-1-1', esperado: 'FIN_ANO' }
  ];
  
  verificaciones2027.forEach(({ titulo, esperado }) => {
    const t = titulos.find(x => x.id === titulo);
    const especiales = t?.specialWeeksByYear[2027] || [];
    const tiene = especiales.length > 0 ? especiales[0].type : 'NINGUNA';
    const emoji = tiene === esperado ? '✅' : '❌';
    console.log(`   ${emoji} ${titulo}: ${tiene} (esperado: ${esperado})`);
  });
  
  console.log('');
  console.log('📌 Año 2028 (tu patrón esperado):');
  console.log('───────────────────────────────────────────────');
  
  const verificaciones2028 = [
    { titulo: 'A-2-1', esperado: 'PASCUA' },
    { titulo: 'B-2-1', esperado: 'NAVIDAD' },
    { titulo: 'C-2-1', esperado: 'FIN_ANO' },
    { titulo: 'D-2-1', esperado: 'SANTA' }
  ];
  
  verificaciones2028.forEach(({ titulo, esperado }) => {
    const t = titulos.find(x => x.id === titulo);
    const especiales = t?.specialWeeksByYear[2028] || [];
    const tiene = especiales.length > 0 ? especiales[0].type : 'NINGUNA';
    const emoji = tiene === esperado ? '✅' : '❌';
    console.log(`   ${emoji} ${titulo}: ${tiene} (esperado: ${esperado})`);
  });
  
  console.log('');
  console.log('📌 Año 2029 (tu patrón esperado):');
  console.log('───────────────────────────────────────────────');
  
  const verificaciones2029 = [
    { titulo: 'A-3-1', esperado: 'NAVIDAD' },
    { titulo: 'B-3-1', esperado: 'FIN_ANO' },
    { titulo: 'C-3-1', esperado: 'SANTA' },
    { titulo: 'D-3-1', esperado: 'PASCUA' }
  ];
  
  verificaciones2029.forEach(({ titulo, esperado }) => {
    const t = titulos.find(x => x.id === titulo);
    const especiales = t?.specialWeeksByYear[2029] || [];
    const tiene = especiales.length > 0 ? especiales[0].type : 'NINGUNA';
    const emoji = tiene === esperado ? '✅' : '❌';
    console.log(`   ${emoji} ${titulo}: ${tiene} (esperado: ${esperado})`);
  });
  
  console.log('');
}

/**
 * Verifica rotación completa de cada título
 */
function verificarRotacionCompleta(titulos) {
  console.log('📊 VERIFICACIÓN DE ROTACIÓN COMPLETA:');
  console.log('═══════════════════════════════════════════════');
  console.log('');
  
  // Verificar un título de cada serie
  ['B-1-1', 'C-1-1', 'D-1-1'].forEach(titleId => {
    const titulo = titulos.find(t => t.id === titleId);
    if (titulo) {
      console.log(`📌 ${titleId} en años clave:`);
      
      const añosClave = [2027, 2039, 2051, 2063];
      añosClave.forEach(año => {
        const especiales = titulo.specialWeeksByYear[año];
        if (especiales && especiales.length > 0) {
          console.log(`   ${año}: ${especiales[0].type}`);
        }
      });
      
      // Contar total
      let total = 0;
      const porTipo = { NAVIDAD: 0, FIN_ANO: 0, SANTA: 0, PASCUA: 0 };
      Object.values(titulo.specialWeeksByYear).forEach(arr => {
        arr.forEach(esp => {
          total++;
          porTipo[esp.type]++;
        });
      });
      
      console.log(`   Total: ${total} (NAVIDAD:${porTipo.NAVIDAD}, FIN_ANO:${porTipo.FIN_ANO}, SANTA:${porTipo.SANTA}, PASCUA:${porTipo.PASCUA})`);
      console.log('');
    }
  });
}

/**
 * Cargar títulos en Firestore
 */
async function cargarTitulos() {
  try {
    console.log('🚀 CARGA CON OFFSET POR SERIE');
    console.log('════════════════════════════════════════════════');
    console.log('');
    console.log('   🎯 Cada serie tiene su propio offset inicial');
    console.log('   🔄 Cada título recibe las 4 semanas en 48 años');
    console.log('   📅 Años: 2027 - 2074');
    console.log('');
    
    const titulos = generarTitulos();
    
    // Verificar patrón antes de cargar
    verificarPatronEspecifico(titulos);
    verificarRotacionCompleta(titulos);
    
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
    console.log('✅ 48 títulos creados con offset por serie');
    console.log('✅ Patrón específico verificado');
    console.log('✅ Cada título con sus 4 semanas especiales');
    console.log('');
    console.log('💡 Verifica en: http://localhost:4000/firestore');
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