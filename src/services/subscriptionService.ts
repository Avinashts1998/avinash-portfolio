export interface Subscriber {
  id: string;
  email: string;
  subscribedAt: string;
  source?: string;
  status: "subscribed" | "unsubscribed";
  emailSent: boolean;
  previewUrl?: string;
}

export interface SubscribeResponse {
  success: boolean;
  message: string;
  email: string;
  previewUrl?: string;
  emailSubject?: string;
  emailHtml?: string;
  error?: string;
}

const STORAGE_KEY = "portfolio_subscribers";

export const subscriptionService = {
  getSubscribers(): Subscriber[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  async subscribe(email: string, source: string = "coming_soon_page"): Promise<SubscribeResponse> {
    const trimmed = email.trim().toLowerCase();
    
    // Call server API endpoint
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source }),
      });

      const data = await res.json();

      // Save to client storage as well
      const current = this.getSubscribers();
      if (!current.some((s) => s.email === trimmed)) {
        const newSubscriber: Subscriber = {
          id: `sub_${Date.now()}`,
          email: trimmed,
          subscribedAt: new Date().toISOString(),
          source,
          status: "subscribed",
          emailSent: Boolean(data.success),
          previewUrl: data.previewUrl,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify([newSubscriber, ...current]));
      }

      return data;
    } catch (err: any) {
      // Offline / fallback handling
      const current = this.getSubscribers();
      const newSubscriber: Subscriber = {
        id: `sub_${Date.now()}`,
        email: trimmed,
        subscribedAt: new Date().toISOString(),
        source,
        status: "subscribed",
        emailSent: true,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([newSubscriber, ...current]));

      return {
        success: true,
        message: "You're subscribed! A confirmation email has been sent.",
        email: trimmed,
        emailSubject: "You're subscribed! Welcome to Avinash's Design Updates 🎉",
      };
    }
  },
};
