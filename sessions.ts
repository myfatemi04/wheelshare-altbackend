export interface Session {
  userId: number;
}

const letters =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function random(): string {
  let id = "";
  for (let i = 0; i < 32; i++) {
    const idx = Math.floor(Math.random() * letters.length);
    id += letters[idx];
  }
  return id;
}

class SessionManager {
  private sessions: Record<string, Session> = {};

  getSession(id: string): Session | null {
    return this.sessions[id] ?? null;
  }

  createSession(userId: number): string {
    const id = random();
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
