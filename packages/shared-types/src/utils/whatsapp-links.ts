/**
 * Creates a WhatsApp deep link for messaging a phone number with optional pre-filled text
 * @param phoneNumber - The phone number to message (can include formatting)
 * @param prefilledText - Optional text to pre-fill in the message
 * @returns WhatsApp deep link URL or null if phone number is invalid
 */
export function createWhatsAppLink(phoneNumber: string | undefined | null, prefilledText: string = ''): string | null {
  if (!phoneNumber) return null;
  
  // Basic cleanup: remove non-digits, except leading '+' if present for international numbers
  const cleanedNumber = phoneNumber.replace(/[^\d+]/g, '');
  if (!cleanedNumber || cleanedNumber.length === 0) return null;
  
  // Ensure we don't have multiple '+' signs and it's only at the beginning
  let finalNumber = cleanedNumber;
  if (finalNumber.startsWith('+')) {
    finalNumber = '+' + finalNumber.substring(1).replace(/\+/g, '');
  }
  
  const encodedText = encodeURIComponent(prefilledText);
  return `https://wa.me/${finalNumber}${encodedText ? `?text=${encodedText}` : ''}`;
}

/**
 * Creates standardized WhatsApp message templates for different contexts
 */
export const WhatsAppMessages = {
  /**
   * Message for Mitra Admin to contact order customer
   */
  mitraToOrderer: (orderId: string) => 
    `Hello! This is regarding your Treksistem order ${orderId.slice(0, 8)}... Please let me know if you have any questions.`,
  
  /**
   * Message for Mitra Admin to contact receiver
   */
  mitraToReceiver: (orderId: string) => 
    `Hello! This is regarding Treksistem order ${orderId.slice(0, 8)}... which is being delivered to you. Please let me know if you have any questions.`,
  
  /**
   * Message for Mitra Admin to notify driver of assignment
   */
  mitraToDriver: (orderId: string, driverName?: string) => 
    `Hi${driverName ? ` ${driverName}` : ''}! You have been assigned to Treksistem order ${orderId.slice(0, 8)}... Please check your driver app for details.`,
  
  /**
   * Message for Driver to contact orderer
   */
  driverToOrderer: (orderId: string) => 
    `Hello! I'm your Treksistem driver for order ${orderId.slice(0, 8)}... Please let me know if you have any questions about your delivery.`,
  
  /**
   * Message for Driver to contact receiver
   */
  driverToReceiver: (orderId: string) => 
    `Hello! I'm your Treksistem driver for order ${orderId.slice(0, 8)}... I'm handling your delivery. Please let me know if you have any questions.`,
  
  /**
   * Message for User to contact Mitra about order inquiry
   */
  userToMitra: (orderId: string) => 
    `Hello! I have a question about my Treksistem order ${orderId.slice(0, 8)}... Could you please help me?`,
}; 