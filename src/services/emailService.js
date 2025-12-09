/**
 * Servicio de Correos usando EmailJS - VERSIÓN SIMPLIFICADA (2 plantillas)
 */

import emailjs from '@emailjs/browser';

// Inicializar EmailJS
emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

const APP_URL = import.meta.env.VITE_APP_URL || 'https://tu-app.netlify.app';

/**
 * Enviar notificación de nueva solicitud de intercambio
 */
export const sendExchangeNotification = async (data) => {
  try {
    const templateParams = {
      to_email: data.toEmail,
      to_name: data.toName,
      from_user: data.fromUser,
      requested_title: data.requestedTitle,
      requested_week: data.requestedWeek,
      offered_title: data.offeredTitle,
      offered_week: data.offeredWeek,
      year: data.year,
      app_url: APP_URL
    };

    const response = await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_NOTIFICATION,
      templateParams
    );

    console.log('✅ Notificación de intercambio enviada:', response.status);
    return { success: true, response };
  } catch (error) {
    console.error('❌ Error enviando notificación:', error);
    throw error;
  }
};

/**
 * Enviar actualización de estado de intercambio
 */
export const sendExchangeStatusUpdate = async (data) => {
  try {
    // Configuraciones según estado
    const statusConfig = {
      approved: {
        emoji: '✅',
        title: 'Intercambio Aprobado',
        text: '¡Tu intercambio ha sido aprobado!',
        message: 'Tenemos buenas noticias. Tu solicitud de intercambio ha sido aceptada.',
        additional: '<p><strong>Próximos pasos:</strong></p><ul><li>El intercambio se ha registrado en el sistema</li><li>Puedes ver los cambios en tu calendario</li><li>Las fechas se han actualizado automáticamente</li></ul>',
        header_color: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
        box_color: '#d1fae5',
        border_color: '#10b981',
        text_color: '#065f46',
        button_color: '#10b981'
      },
      rejected: {
        emoji: '❌',
        title: 'Intercambio Rechazado',
        text: 'Tu intercambio ha sido rechazado',
        message: 'Lamentablemente, tu solicitud de intercambio ha sido rechazada.',
        additional: '<p><strong>¿Qué puedes hacer?</strong></p><ul><li>Contactar al usuario para conocer el motivo</li><li>Intentar con otra semana diferente</li><li>Buscar otras opciones de intercambio</li></ul>',
        header_color: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)',
        box_color: '#fee2e2',
        border_color: '#dc2626',
        text_color: '#991b1b',
        button_color: '#dc2626'
      },
      cancelled: {
        emoji: '🚫',
        title: 'Intercambio Cancelado',
        text: 'El intercambio ha sido cancelado',
        message: 'El intercambio que solicitaste ha sido cancelado.',
        additional: '<p><strong>Información:</strong></p><ul><li>Esta cancelación fue realizada por el solicitante</li><li>Puedes crear una nueva solicitud cuando lo desees</li><li>Tus semanas permanecen sin cambios</li></ul>',
        header_color: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
        box_color: '#f1f5f9',
        border_color: '#64748b',
        text_color: '#334155',
        button_color: '#64748b'
      }
    };

    const config = statusConfig[data.status];
    if (!config) {
      throw new Error(`Estado inválido: ${data.status}`);
    }

    const templateParams = {
      to_email: data.toEmail,
      to_name: data.toName,
      status_emoji: config.emoji,
      status_title: config.title,
      status_text: config.text,
      main_message: config.message,
      requested_title: data.requestedTitle,
      requested_week: data.requestedWeek,
      offered_title: data.offeredTitle,
      offered_week: data.offeredWeek,
      year: data.year,
      status: data.status.toUpperCase(),
      additional_message: config.additional,
      header_color: config.header_color,
      box_color: config.box_color,
      border_color: config.border_color,
      text_color: config.text_color,
      button_color: config.button_color,
      app_url: APP_URL
    };

    const response = await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_STATUS,
      templateParams
    );

    console.log('✅ Actualización de estado enviada:', response.status);
    return { success: true, response };
  } catch (error) {
    console.error('❌ Error enviando actualización:', error);
    throw error;
  }
};