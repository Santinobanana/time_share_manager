/**
 * Servicio de Notificaciones usando EmailJS
 * 
 * Reemplazo de Firebase Extensions (requería plan Blaze)
 * Ahora usa EmailJS (compatible con plan Spark)
 * 
 * Este servicio mantiene las mismas funciones que antes,
 * pero usa EmailJS en lugar de Firebase Extensions
 */

import { sendExchangeNotification, sendExchangeStatusUpdate } from './emailService';

/**
 * Notificar nueva solicitud de intercambio
 */
export const notifyNewExchangeRequest = async (data) => {
  const { toUserEmail, toUserName, fromUserName, fromWeek, toWeek, year, message } = data;

  try {
    await sendExchangeNotification({
      toEmail: toUserEmail,
      toName: toUserName,
      fromUser: fromUserName,
      requestedTitle: toWeek.titleId,
      requestedWeek: toWeek.weekNumber,
      offeredTitle: fromWeek.titleId,
      offeredWeek: fromWeek.weekNumber,
      year
    });

    console.log(`✅ Notificación de nueva solicitud enviada a ${toUserEmail}`);
  } catch (error) {
    console.error('❌ Error enviando notificación de nueva solicitud:', error);
    // No lanzamos error para no bloquear el flujo principal
  }
};

/**
 * Notificar intercambio aceptado
 */
export const notifyExchangeAccepted = async (data) => {
  const { toUserEmail, toUserName, fromUserName, fromWeek, toWeek, year } = data;

  try {
    await sendExchangeStatusUpdate({
      toEmail: toUserEmail,
      toName: toUserName,
      status: 'approved', // EmailJS usa 'approved', no 'accepted'
      requestedTitle: toWeek.titleId,
      requestedWeek: toWeek.weekNumber,
      offeredTitle: fromWeek.titleId,
      offeredWeek: fromWeek.weekNumber,
      year
    });

    console.log(`✅ Notificación de aceptación enviada a ${toUserEmail}`);
  } catch (error) {
    console.error('❌ Error enviando notificación de aceptación:', error);
  }
};

/**
 * Notificar intercambio rechazado
 */
export const notifyExchangeRejected = async (data) => {
  const { toUserEmail, toUserName, fromUserName, fromWeek, toWeek, year } = data;

  try {
    await sendExchangeStatusUpdate({
      toEmail: toUserEmail,
      toName: toUserName,
      status: 'rejected',
      requestedTitle: toWeek.titleId,
      requestedWeek: toWeek.weekNumber,
      offeredTitle: fromWeek.titleId,
      offeredWeek: fromWeek.weekNumber,
      year
    });

    console.log(`✅ Notificación de rechazo enviada a ${toUserEmail}`);
  } catch (error) {
    console.error('❌ Error enviando notificación de rechazo:', error);
  }
};

/**
 * Notificar cancelación de solicitud pendiente
 */
export const notifyExchangeCancelled = async (data) => {
  const { toUserEmail, toUserName, fromUserName, fromWeek, toWeek, year } = data;

  try {
    await sendExchangeStatusUpdate({
      toEmail: toUserEmail,
      toName: toUserName,
      status: 'cancelled',
      requestedTitle: toWeek.titleId,
      requestedWeek: toWeek.weekNumber,
      offeredTitle: fromWeek.titleId,
      offeredWeek: fromWeek.weekNumber,
      year
    });

    console.log(`✅ Notificación de cancelación enviada a ${toUserEmail}`);
  } catch (error) {
    console.error('❌ Error enviando notificación de cancelación:', error);
  }
};

/**
 * Notificar cancelación de intercambio ACEPTADO
 * (Diferente de cancelar solicitud pendiente)
 */
export const notifyAcceptedExchangeCancelled = async (data) => {
  const { toUserEmail, toUserName, fromUserName, fromWeek, toWeek, year } = data;

  try {
    // Usamos el mismo estado 'cancelled' pero con contexto diferente
    await sendExchangeStatusUpdate({
      toEmail: toUserEmail,
      toName: toUserName,
      status: 'cancelled',
      requestedTitle: toWeek.titleId,
      requestedWeek: toWeek.weekNumber,
      offeredTitle: fromWeek.titleId,
      offeredWeek: fromWeek.weekNumber,
      year
    });

    console.log(`✅ Notificación de cancelación de intercambio aceptado enviada a ${toUserEmail}`);
  } catch (error) {
    console.error('❌ Error enviando notificación de cancelación de intercambio aceptado:', error);
  }
};

/**
 * LEGACY: Funciones antiguas que ya no se usan pero se mantienen por compatibilidad
 */

// Si tenías otras funciones de notificación, agrégalas aquí
// Por ejemplo: notificaciones de aprobación de usuarios, asignación de títulos, etc.

/**
 * Ejemplo de notificación de usuario aprobado (si la usas)
 */
export const notifyUserApproved = async (data) => {
  const { toUserEmail, toUserName } = data;

  try {
    // Aquí podrías usar una tercera plantilla de EmailJS si la necesitas
    // O enviar un correo genérico
    console.log(`ℹ️ Notificación de usuario aprobado no implementada con EmailJS`);
    console.log(`Usuario: ${toUserName} (${toUserEmail})`);
  } catch (error) {
    console.error('❌ Error enviando notificación de usuario aprobado:', error);
  }
};

/**
 * Ejemplo de notificación de título asignado (si la usas)
 */
export const notifyTitleAssigned = async (data) => {
  const { toUserEmail, toUserName, titleId } = data;

  try {
    console.log(`ℹ️ Notificación de título asignado no implementada con EmailJS`);
    console.log(`Usuario: ${toUserName} (${toUserEmail}), Título: ${titleId}`);
  } catch (error) {
    console.error('❌ Error enviando notificación de título asignado:', error);
  }
};