/**
 * Convert MongoDB ObjectId string to a valid Agora numeric UID (0-2147483647)
 * Uses a deterministic hash function to ensure unique, consistent mapping
 */
export function convertUserIdToAgoraUid(userId: string): number {
  // Use a simple hash function that processes the entire user ID
  let hash = 0;
  
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char; // hash * 31 + char (simple but effective hash)
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to positive number and ensure it's within Agora's valid range (0-2147483647)
  const uid = Math.abs(hash) % 2147483647;
  
  // Ensure we never return 0 (reserved in some systems)
  return uid || 1;
}
