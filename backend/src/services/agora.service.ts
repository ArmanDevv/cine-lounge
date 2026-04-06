import { RtcTokenBuilder, RtcRole } from 'agora-token';

export class AgoraService {
  private appId: string;
  private appCertificate: string;

  constructor() {
    this.appId = process.env.AGORA_APP_ID || '';
    this.appCertificate = process.env.AGORA_APP_CERTIFICATE || '';

    if (!this.appId || !this.appCertificate) {
      console.warn(
        'Agora credentials not configured. Video conferencing will not work. Please set AGORA_APP_ID and AGORA_APP_CERTIFICATE in .env'
      );
    }
  }

  /**
   * Generate Agora RTC token for a user to join a video channel
   * @param channelName - Watch party ID (used as channel name)
   * @param userId - User ID (member ID)
   * @param role - 'publisher' (can publish audio/video) or 'subscriber' (read-only)
   * @returns Token string
   */
  generateToken(
    channelName: string,
    userId: number,
    role: 'publisher' | 'subscriber' = 'publisher'
  ): string {
    if (!this.appId || !this.appCertificate) {
      throw new Error(
        'Agora credentials not configured. Set AGORA_APP_ID and AGORA_APP_CERTIFICATE'
      );
    }

    const tokenRole =
      role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUserAccount(
      this.appId,
      this.appCertificate,
      channelName,
      userId.toString(),
      tokenRole,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    return token;
  }

  /**
   * Validate if Agora is configured
   */
  isConfigured(): boolean {
    return !!this.appId && !!this.appCertificate;
  }

  /**
   * Get Agora App ID (frontend needs this to initialize Agora client)
   */
  getAppId(): string {
    return this.appId;
  }
}

export default new AgoraService();
