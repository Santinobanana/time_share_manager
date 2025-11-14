import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Servicio de notificaciones usando Firebase Extension: Trigger Email
 * 
 * La extensión escucha la colección 'mail' y envía emails automáticamente.
 * Documentación: https://github.com/firebase/extensions/tree/master/firestore-send-email
 */

/**
 * Enviar email genérico usando la colección 'mail'
 * @param {Object} emailData - { to, subject, text, html }
 * @returns {Promise<string>} ID del documento creado
 */
const sendEmail = async (emailData) => {
  try {
    const { to, subject, text, html } = emailData;

    // Crear documento en la colección 'mail'
    // La Firebase Extension lo detectará y enviará el email
    const mailRef = await addDoc(collection(db, 'mail'), {
      to,
      message: {
        subject,
        text: text || '',
        html: html || text || ''
      },
      createdAt: serverTimestamp()
    });

    console.log('✅ Email programado para envío:', mailRef.id);
    return mailRef.id;
  } catch (error) {
    console.error('❌ Error programando email:', error);
    throw new Error('Error al programar el envío del email');
  }
};

/**
 * Generar HTML para emails con diseño consistente
 * @param {Object} params - { title, content, footerText }
 * @returns {string} HTML del email
 */
const generateEmailHTML = ({ title, content, footerText = '' }) => {
  // Obtener URL base de la aplicación
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tu-app.com';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px 20px;
    }
    .content p {
      margin: 15px 0;
    }
    .footer {
      background: #f5f5f5;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: #667eea;
      color: white !important;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .info-box {
      background: #f0f7ff;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box h3 {
      margin-top: 0;
      color: #667eea;
    }
    .week-info {
      background: #ffffff;
      padding: 12px;
      border-radius: 5px;
      margin: 10px 0;
      border: 1px solid #e0e0e0;
    }
    .week-info strong {
      color: #667eea;
    }
    ul {
      padding-left: 20px;
    }
    ul li {
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      ${footerText || 'Sistema de Gestión de Intercambios de Semanas'}
      <br><br>
      <small>Este es un mensaje automático, por favor no respondas a este email.</small>
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Notificar nueva solicitud de intercambio
 * @param {Object} data - { toUserEmail, toUserName, fromUserName, fromWeek, toWeek, year, message }
 */
export const notifyNewExchangeRequest = async (data) => {
  const { toUserEmail, toUserName, fromUserName, fromWeek, toWeek, year, message } = data;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const content = `
    <p>Hola <strong>${toUserName}</strong>,</p>
    <p><strong>${fromUserName}</strong> te ha enviado una solicitud de intercambio de semanas para el año <strong>${year}</strong>.</p>
    
    <div class="info-box">
      <h3>📤 Ofrece:</h3>
      <div class="week-info">
        <strong>Semana ${fromWeek.weekNumber}</strong><br>
        Título: ${fromWeek.titleId}
      </div>
      
      <h3>📥 Solicita:</h3>
      <div class="week-info">
        <strong>Semana ${toWeek.weekNumber}</strong><br>
        Título: ${toWeek.titleId}
      </div>
    </div>
    
    ${message ? `<p><strong>Mensaje:</strong><br><em>${message}</em></p>` : ''}
    
    <p>Ingresa a tu cuenta para revisar y responder a esta solicitud.</p>
    <center>
      <a href="${baseUrl}/exchanges" class="button">Ver Solicitud</a>
    </center>
  `;

  const html = generateEmailHTML({
    title: '🔄 Nueva Solicitud de Intercambio',
    content
  });

  await sendEmail({
    to: toUserEmail,
    subject: '🔄 Nueva solicitud de intercambio de semanas',
    html
  });
};

/**
 * Notificar intercambio aceptado
 * @param {Object} data - { toUserEmail, toUserName, fromUserName, fromWeek, toWeek, year }
 */
export const notifyExchangeAccepted = async (data) => {
  const { toUserEmail, toUserName, fromUserName, fromWeek, toWeek, year } = data;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const content = `
    <p>Hola <strong>${toUserName}</strong>,</p>
    <p>¡Buenas noticias! <strong>${fromUserName}</strong> ha aceptado tu solicitud de intercambio para el año <strong>${year}</strong>.</p>
    
    <div class="info-box">
      <h3>✅ Intercambio Confirmado</h3>
      <div class="week-info">
        <strong>Tu semana:</strong> Semana ${fromWeek.weekNumber} - Título ${fromWeek.titleId}
      </div>
      <div class="week-info">
        <strong>Recibes:</strong> Semana ${toWeek.weekNumber} - Título ${toWeek.titleId}
      </div>
    </div>
    
    <p>El intercambio está confirmado. Puedes ver los detalles en tu cuenta.</p>
    <center>
      <a href="${baseUrl}/exchanges" class="button">Ver Intercambios</a>
    </center>
    
    <p>¡Que disfrutes tu semana!</p>
  `;

  const html = generateEmailHTML({
    title: '✅ ¡Intercambio Aceptado!',
    content
  });

  await sendEmail({
    to: toUserEmail,
    subject: '✅ Tu solicitud de intercambio fue aceptada',
    html
  });
};

/**
 * Notificar intercambio rechazado
 * @param {Object} data - { toUserEmail, toUserName, fromUserName, fromWeek, toWeek, year }
 */
export const notifyExchangeRejected = async (data) => {
  const { toUserEmail, toUserName, fromUserName, fromWeek, toWeek, year } = data;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const content = `
    <p>Hola <strong>${toUserName}</strong>,</p>
    <p><strong>${fromUserName}</strong> ha rechazado tu solicitud de intercambio para el año <strong>${year}</strong>.</p>
    
    <div class="info-box">
      <h3>❌ Solicitud Rechazada</h3>
      <div class="week-info">
        <strong>Tu semana:</strong> Semana ${fromWeek.weekNumber} - Título ${fromWeek.titleId}
      </div>
      <div class="week-info">
        <strong>Solicitabas:</strong> Semana ${toWeek.weekNumber} - Título ${toWeek.titleId}
      </div>
    </div>
    
    <p>No te preocupes, puedes intentar con otro usuario o en otra fecha.</p>
    <center>
      <a href="${baseUrl}/exchanges" class="button">Ver Otras Opciones</a>
    </center>
  `;

  const html = generateEmailHTML({
    title: '❌ Solicitud Rechazada',
    content
  });

  await sendEmail({
    to: toUserEmail,
    subject: '❌ Tu solicitud de intercambio fue rechazada',
    html
  });
};

/**
 * Notificar intercambio cancelado
 * @param {Object} data - { toUserEmail, toUserName, fromUserName, fromWeek, toWeek, year }
 */
export const notifyExchangeCancelled = async (data) => {
  const { toUserEmail, toUserName, fromUserName, fromWeek, toWeek, year } = data;

  const content = `
    <p>Hola <strong>${toUserName}</strong>,</p>
    <p><strong>${fromUserName}</strong> ha cancelado su solicitud de intercambio para el año <strong>${year}</strong>.</p>
    
    <div class="info-box">
      <h3>🚫 Solicitud Cancelada</h3>
      <div class="week-info">
        <strong>Ofrecía:</strong> Semana ${fromWeek.weekNumber} - Título ${fromWeek.titleId}
      </div>
      <div class="week-info">
        <strong>Solicitaba:</strong> Semana ${toWeek.weekNumber} - Título ${toWeek.titleId}
      </div>
    </div>
    
    <p>La solicitud ya no está activa.</p>
  `;

  const html = generateEmailHTML({
    title: '🚫 Solicitud Cancelada',
    content
  });

  await sendEmail({
    to: toUserEmail,
    subject: '🚫 Solicitud de intercambio cancelada',
    html
  });
};

/**
 * Notificar aprobación de usuario
 * @param {Object} data - { toUserEmail, toUserName }
 */
export const notifyUserApproved = async (data) => {
  const { toUserEmail, toUserName } = data;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const content = `
    <p>Hola <strong>${toUserName}</strong>,</p>
    <p>¡Felicitaciones! Tu cuenta ha sido aprobada por un administrador.</p>
    
    <div class="info-box">
      <h3>🎉 ¡Bienvenido/a al Sistema!</h3>
      <p>Ya puedes acceder a todas las funcionalidades:</p>
      <ul>
        <li>✅ Ver tus semanas asignadas</li>
        <li>✅ Solicitar intercambios con otros usuarios</li>
        <li>✅ Gestionar tu disponibilidad</li>
        <li>✅ Actualizar tu perfil</li>
      </ul>
    </div>
    
    <center>
      <a href="${baseUrl}/dashboard" class="button">Ir al Dashboard</a>
    </center>
    
    <p>¡Disfruta del sistema!</p>
  `;

  const html = generateEmailHTML({
    title: '🎉 Cuenta Aprobada',
    content
  });

  await sendEmail({
    to: toUserEmail,
    subject: '🎉 Tu cuenta ha sido aprobada',
    html
  });
};

/**
 * Notificar al admin sobre nuevo registro pendiente de aprobación
 * @param {Object} data - { adminEmail, adminName, newUserName, newUserEmail }
 */
export const notifyAdminNewUser = async (data) => {
  const { adminEmail, adminName, newUserName, newUserEmail } = data;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const content = `
    <p>Hola <strong>${adminName}</strong>,</p>
    <p>Un nuevo usuario se ha registrado y está pendiente de aprobación.</p>
    
    <div class="info-box">
      <h3>👤 Nuevo Usuario</h3>
      <p><strong>Nombre:</strong> ${newUserName}</p>
      <p><strong>Email:</strong> ${newUserEmail}</p>
    </div>
    
    <p>Ingresa al panel de administración para revisar y aprobar este usuario.</p>
    <center>
      <a href="${baseUrl}/admin/users" class="button">Gestionar Usuarios</a>
    </center>
  `;

  const html = generateEmailHTML({
    title: '👤 Nuevo Usuario Pendiente',
    content
  });

  await sendEmail({
    to: adminEmail,
    subject: '👤 Nuevo usuario pendiente de aprobación',
    html
  });
};