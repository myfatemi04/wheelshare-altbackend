import { randomUUID } from "crypto";

export interface Session {
  userId: number;
}

class SessionManager {
  private sessions: Record<string, Session>;

  constructor() {}

  getSession(id: string): Session | null {
    return this.sessions[id] ?? null;
  }

  createSession(userId: number): string {
    const id = randomUUID();
    this.sessions[id] = {
      userId,
    };
    return id;
  }

  deleteSession(id: string) {
    delete this.sessions[id];
  }
}

export default new SessionManager();
