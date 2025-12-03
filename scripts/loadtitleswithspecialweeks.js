import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, connectFirestoreEmulator } from 'firebase/firestore';

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
 * Calcula el número de semana del año según sistema de domingo como primer día
 * La semana 1 empieza el primer domingo del año
 */
function obtenerNumeroSemana(date) {
  const year = date.getFullYear();
  
  // Encontrar el primer domingo del año
  let primerDomingo = new Date(year, 0, 1);
  const diaSemana = primerDomingo.getDay();
  
  // Si el 1 de enero no es domingo, avanzar al siguiente domingo
  if (diaSemana !== 0) {
    primerDomingo.setDate(primerDomingo.getDate() + (7 - diaSemana));
  }
  
  // Calcular días transcurridos desde el primer domingo
  const diasDesdeInicio = Math.floor((date - primerDomingo) / (1000 * 60 * 60 * 24));
  
  // Calcular número de semana (empezando desde 1)
  const numeroSemana = Math.floor(diasDesdeInicio / 7) + 1;
  
  return numeroSemana;
}

/**
 * Calcula las semanas especiales para un año
 */
function calcularSemanasEspeciales(year) {
  const pascua = calcularPascua(year);
  const semanaSanta = new Date(pascua);
  semanaSanta.setDate(semanaSanta.getDate() - 7);
  
  // ✅ CORRECCIÓN: Si el 25 es domingo, usar semana anterior
  const navidad = new Date(year, 11, 25);
  const diaSemana25 = navidad.getDay(); // 0 = Domingo
  
  let fechaNavidadVIP;
  if (diaSemana25 === 0) {
    // 25 es domingo → Usar semana anterior (18-24)
    fechaNavidadVIP = new Date(year, 11, 18);
  } else {
    // 25 NO es domingo → Usar semana del 25
    fechaNavidadVIP = navidad;
  }
  
  const semanaNavidad = obtenerNumeroSemana(fechaNavidadVIP);
  
  const finAno = new Date(year, 11, 31);
  const semanaFinAno = obtenerNumeroSemana(finAno);
  
  return {
    SANTA: obtenerNumeroSemana(semanaSanta),
    PASCUA: obtenerNumeroSemana(pascua),
    NAVIDAD: semanaNavidad,
    FIN_ANO: semanaFinAno
  };
}

/**
 * Genera todos los años desde 2027 hasta 2200
 */
function generarArrayAnos() {
  const años = [];
  for (let año = 2027; año <= 2200; año++) {
    años.push(año);
  }
  return años;
}

/**
 * Obtiene el total de semanas del año (52 o 53)
 */
function getTotalWeeksInYear(year) {
  const lastDay = new Date(year, 11, 31);
  const weekNumber = obtenerNumeroSemana(lastDay);
  return weekNumber;
}

/**
 * Crea el mapeo de semanas virtuales → semanas reales
 * Excluye las 4 semanas especiales y asigna en ciclos A→B→C→D
 */
function crearMapeoSemanasDisponibles(year) {
  const totalWeeks = getTotalWeeksInYear(year);
  const semanasEspeciales = calcularSemanasEspeciales(year);
  const semanasEspecialesSet = new Set(Object.values(semanasEspeciales));
  
  // Array de semanas disponibles (excluyendo especiales)
  const semanasDisponibles = [];
  for (let week = 1; week <= totalWeeks; week++) {
    if (!semanasEspecialesSet.has(week)) {
      semanasDisponibles.push(week);
    }
  }
  
  // Crear mapeo para cada serie (A=0, B=1, C=2, D=3)
  const mapeo = {
    0: {}, // Serie A
    1: {}, // Serie B
    2: {}, // Serie C
    3: {}  // Serie D
  };
  
  // Asignar en ciclos A→B→C→D
  let virtualWeekCounters = [1, 1, 1, 1]; // Contadores de semana virtual para cada serie
  
  for (let i = 0; i < semanasDisponibles.length && i < 48; i++) {
    const serieIndex = i % 4; // 0=A, 1=B, 2=C, 3=D
    const realWeek = semanasDisponibles[i];
    const virtualWeek = virtualWeekCounters[serieIndex];
    
    mapeo[serieIndex][virtualWeek] = realWeek;
    virtualWeekCounters[serieIndex]++;
  }
  
  return mapeo;
}

/**
 * Calcula las semanas regulares (mapea virtual → real)
 */
function calcularSemanaRegular(serie, subserie, numero, año) {
  const añoBase = 2027;
  const añosTranscurridos = año - añoBase;
  
  let semanaVirtual = 1; // Valor por defecto

  // Series B, C, D: Rotación de 12 semanas
  if (serie === 'B' || serie === 'C' || serie === 'D') {
    const offsetSubserie = (subserie - 1) * 4;
    const offsetTitulo = (numero - 1);
    let semanaInicial = 1 + offsetSubserie + offsetTitulo;
    
    if (semanaInicial > 12) {
      semanaInicial = semanaInicial - 12;
    }
    
    semanaVirtual = ((semanaInicial - 1 + añosTranscurridos) % 12) + 1;
    
    // Mapear semana virtual → semana real del calendario
    const mapeo = crearMapeoSemanasDisponibles(año);
    const serieIndex = { 'B': 1, 'C': 2, 'D': 3 }[serie];
    const semanaReal = mapeo[serieIndex][semanaVirtual];
    
    return semanaReal || 1;
  }
  // Serie A: Patrón específico (YA contiene las semanas virtuales correctas, solo mapear)
  else if (serie === 'A') {
    const serieABasePattern = {
      '1-1': [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1],
      '1-2': [5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4],
      '1-3': [8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7],
      '1-4': [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      '2-1': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      '2-2': [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6],
      '2-3': [11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      '2-4': [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2],
      '3-1': [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8],
      '3-2': [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3],
      '3-3': [6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5],
      '3-4': [10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    };

    const key = `${subserie}-${numero}`;
    const pattern = serieABasePattern[key];
    
    if (pattern) {
      const patternIndex = añosTranscurridos % 12; 
      semanaVirtual = pattern[patternIndex];
    }
    
    // Mapear semana virtual → semana real del calendario
    const mapeo = crearMapeoSemanasDisponibles(año);
    const semanaReal = mapeo[0][semanaVirtual]; // Serie A = index 0
    
    return semanaReal || 1;
  }
  
  return 1;
}

/**
 * Calcula qué título le corresponde una semana especial
 */
function calcularTituloSemanEspecial(serie, subserie, numero, tipoSemana, año) {
  const añoBase = 2027;
  const añosTranscurridos = año - añoBase;
  
  // Determinar qué título está activo este año (ciclo de 12)
  const añosIndex = añosTranscurridos % 12;
  const assignedSubserie = (añosIndex % 3) + 1;
  const assignedNumero = Math.floor(añosIndex / 3) + 1;
  
  const assignedTitleId = `${serie}-${assignedSubserie}-${assignedNumero}`;
  const currentTitleId = `${serie}-${subserie}-${numero}`;

  // Si este título no está activo este año, retornar null
  if (currentTitleId !== assignedTitleId) {
    return null;
  }

  // OFFSET INICIAL POR SERIE
  const OFFSET_POR_SERIE = {
    'A': 2,  // A empieza en SANTA (índice 2)
    'B': 3,  // B empieza en PASCUA (índice 3)
    'C': 0,  // C empieza en NAVIDAD (índice 0)
    'D': 1   // D empieza en FIN_ANO (índice 1)
  };

  const offsetInicial = OFFSET_POR_SERIE[serie];

  // Determinar qué semana especial corresponde
  const ciclosCompletos = Math.floor(añosTranscurridos / 12);
  const semanaOffset = ciclosCompletos % 4;
  const baseIndex = añosTranscurridos % 4;
  
  // Aplicar offset inicial de la serie + offset acumulativo + índice base
  const realIndex = (offsetInicial + baseIndex + semanaOffset) % 4;
  
  // Orden de semanas (array base)
  const SPECIAL_WEEKS_ORDER = ['NAVIDAD', 'FIN_ANO', 'SANTA', 'PASCUA'];
  const assignedWeekType = SPECIAL_WEEKS_ORDER[realIndex];

  // Verificar si coincide con la semana solicitada
  if (tipoSemana === assignedWeekType) {
    return currentTitleId;
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