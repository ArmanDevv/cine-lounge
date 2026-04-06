/**
 * Convert MongoDB ObjectId string to a valid Agora numeric UID (0-2147483647)
 * Uses a hash function to ensure consistent mapping
 */
export function convertUserIdToAgoraUid(userId: string): number {
  // Use the last 8 characters of the mongo ID and convert from hex to decimal
  const hexString = userId.slice(-8); // Get last 8 chars of mongo ID
  const uid = parseInt(hexString, 16) % 2147483647; // Keep it within valid range
  return uid || Math.abs(userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 2147483647);
}
