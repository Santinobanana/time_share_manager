import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const sendEmail = async (emailData) => {
  try {
    const { to, subject, text, html } = emailData;

    const mailRef = await addDoc(collection(db, 'mail'), {
      to,
      message: {
        subject,
        text: text || '',
        html: html || text || ''
      },
      createdAt: serverTimestamp()
    });

    console.log('✅ Email programado:', mailRef.id);
    return mailRef.id;
  } catch (error) {
    console.error('❌ Error programando email:', error);
    throw new Error('Error al programar el envío del email');
  }
};

const generateEmailHTML = ({ title, content, footerText = '' }) => {
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
      ${footerText || 'Sistema de Gestión de Intercambios'}
      <br><br>
      <small>Este es un mensaje automático.</small>
    </div>
  </div>
</body>
</html>
  `.trim();
};

export const notifyNewExchangeRequest = async (data) => {
  const { toUserEmail, toUserName, fromUserName, fromWeek, toWeek, year, message } = data;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const content = `
    <p>Hola <strong>${toUserName}</strong>,</p>
    <p><strong>${fromUserName}</strong> te ha enviado una solicitud de intercambio para el año <strong>${year}</strong>.</p>
    
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
    
    <p>Ingresa a tu cuenta para revisar y responder.</p>
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
    subject: '🔄 Nueva solicitud de intercambio',
    html
  });
};

export const notifyExchangeAccepted = async (data) => {
  const { toUserEmail, toUserName, fromUserName, fromWeek, toWeek, year } = data;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const content = `
    <p>Hola <strong>${toUserName}</strong>,</p>
    <p>¡Buenas noticias! <strong>${fromUserName}</strong> ha aceptado tu solicitud de intercambio para <strong>${year}</strong>.</p>
    
    <div class="info-box">
      <h3>✅ Intercambio Confirmado</h3>
      <div class="week-info">
        <strong>Tu semana:</strong> Semana ${fromWeek.weekNumber} - Título ${fromWeek.titleId}
      </div>
      <div class="week-info">
        <strong>Recibes:</strong> Semana ${toWeek.weekNumber} - Título ${toWeek.titleId}
      </div>
    </div>
    
    <p>El intercambio está confirmado.</p>
    <center>
      <a href="${baseUrl}/exchanges" class="button">Ver Intercambios</a>
    </center>
  `;

  const html = generateEmailHTML({
    title: '✅ ¡Intercambio Aceptado!',
    content
  });

  await sendEmail({
    to: toUserEmail,
    subject: '✅ Tu solicitud fue aceptada',
    html
  });
};

export const notifyExchangeRejected = async (data) => {
  const { toUserEmail, toUserName, fromUserName, fromWeek, toWeek, year } = data;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const content = `
    <p>Hola <strong>${toUserName}</strong>,</p>
    <p><strong>${fromUserName}</strong> ha rechazado tu solicitud de intercambio para <strong>${year}</strong>.</p>
    
    <div class="info-box">
      <h3>❌ Solicitud Rechazada</h3>
      <div class="week-info">
        <strong>Tu semana:</strong> Semana ${fromWeek.weekNumber} - Título ${fromWeek.titleId}
      </div>
      <div class="week-info">
        <strong>Solicitabas:</strong> Semana ${toWeek.weekNumber} - Título ${toWeek.titleId}
      </div>
    </div>
    
    <p>Puedes intentar con otro usuario.</p>
    <center>
      <a href="${baseUrl}/exchanges" class="button">Ver Opciones</a>
    </center>
  `;

  const html = generateEmailHTML({
    title: '❌ Solicitud Rechazada',
    content
  });

  await sendEmail({
    to: toUserEmail,
    subject: '❌ Solicitud rechazada',
    html
  });
};

export const notifyExchangeCancelled = async (data) => {
  const { toUserEmail, toUserName, fromUserName, fromWeek, toWeek, year } = data;

  const content = `
    <p>Hola <strong>${toUserName}</strong>,</p>
    <p><strong>${fromUserName}</strong> ha cancelado su solicitud de intercambio para <strong>${year}</strong>.</p>
    
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
    subject: '🚫 Solicitud cancelada',
    html
  });
};

/**
 * NUEVA: Notificar cancelación de intercambio ACEPTADO
 */
export const notifyAcceptedExchangeCancelled = async (data) => {
  const { toUserEmail, toUserName, fromUserName, fromWeek, toWeek, year } = data;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const content = `
    <p>Hola <strong>${toUserName}</strong>,</p>
    <p><strong>${fromUserName}</strong> ha cancelado el intercambio aceptado para <strong>${year}</strong>.</p>
    
    <div class="info-box">
      <h3>⚠️ Intercambio Cancelado</h3>
      <div class="week-info">
        <strong>Intercambio que tenías:</strong><br>
        Semana ${fromWeek.weekNumber} (${fromWeek.titleId}) ↔ Semana ${toWeek.weekNumber} (${toWeek.titleId})
      </div>
    </div>
    
    <p><strong>Las semanas han vuelto a sus dueños originales.</strong></p>
    <p>Puedes ver tus semanas actuales en "Mis Semanas" o buscar un nuevo intercambio.</p>
    
    <center>
      <a href="${baseUrl}/my-weeks" class="button">Ver Mis Semanas</a>
    </center>
  `;

  const html = generateEmailHTML({
    title: '⚠️ Intercambio Cancelado',
    content
  });

  await sendEmail({
    to: toUserEmail,
    subject: '⚠️ Un intercambio aceptado fue cancelado',
    html
  });
};

export const notifyUserApproved = async (data) => {
  const { toUserEmail, toUserName } = data;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const content = `
    <p>Hola <strong>${toUserName}</strong>,</p>
    <p>¡Tu cuenta ha sido aprobada!</p>
    <p>Ya puedes acceder al sistema.</p>
    <center>
      <a href="${baseUrl}/login" class="button">Iniciar Sesión</a>
    </center>
  `;

  const html = generateEmailHTML({
    title: '✅ Cuenta Aprobada',
    content
  });

  await sendEmail({
    to: toUserEmail,
    subject: '✅ Cuenta aprobada',
    html
  });
};