// Authentication Service
// Handles login validation and session authentication

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthResult {
  success: boolean;
  message?: string;
  user?: string;
}

// Simple authentication for educational VM
// In production, this should connect to actual backend authentication
export class AuthService {
  // Hashed passwords (simple hash, NOT cryptographically secure - for simulation only)
  // kali -> computed hash
  // toor -> computed hash
  private static validCredentialHashes: Record<string, string> = {
    'kali': '30b573',
    'root': '366c86',
  };

  private static computeHash(password: string): string {
    // Simple hash simulation - in production use proper bcrypt/argon2
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }

  static async login(credentials: LoginCredentials): Promise<AuthResult> {
    const { username, password } = credentials;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Validate credentials
    if (!username || !password) {
      return {
        success: false,
        message: 'Username and password are required',
      };
    }

    const expectedHash = this.validCredentialHashes[username];
    if (!expectedHash) {
      return {
        success: false,
        message: 'Invalid username or password',
      };
    }

    const inputHash = this.computeHash(password);
    if (expectedHash !== inputHash) {
      return {
        success: false,
        message: 'Invalid username or password',
      };
    }

    return {
      success: true,
      user: username,
    };
  }

  static logout(): void {
    // Clear any session data
    sessionStorage.removeItem('kali-vm-user');
  }

  static getCurrentUser(): string | null {
    return sessionStorage.getItem('kali-vm-user');
  }

  static setCurrentUser(username: string): void {
    sessionStorage.setItem('kali-vm-user', username);
  }
}
