
// I am assuming NotificationProvider is defined elsewhere or this is just the service class provided.
// I will create the structure as requested.

export interface PlaqueNotificationPayload {
  recipient: string;
  plaquename: string;
}

export interface NotificationProvider {
  sendEmail: (to: string, subject: string, body: string) => Promise<void>;
}

export class PlaqueNotificationService {
  private provider: NotificationProvider | null = null;

  constructor(provider: NotificationProvider | null = null) {
    this.provider = provider;
  }

  async notifyPlaqueEarned(payload: PlaqueNotificationPayload): Promise<void> {
    const subject = `🏆 You Have Earned a Record Plaque!`;
    const body = `Congratulations! You have earned the ${payload.plaquename} plaque.`;

    if (!this.provider) {
      console.warn(`[PlaqueNotificationService] Integration Pending: No email provider configured.`);
      return;
    }
    
    await this.provider.sendEmail('admin@pyrexspinna.com', subject, body);
  }
}
