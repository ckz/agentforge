import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = process.env.AUTH_SECRET || 'agentforge-secret-key-change-in-production';

interface User {
  username: string;
  role: 'admin' | 'user';
}

function parseUsers(): Map<string, { password: string; role: 'admin' | 'user' }> {
  const users = new Map<string, { password: string; role: 'admin' | 'user' }>();
  
  const usersEnv = process.env.AUTH_USERS || 'admin:admin123:admin,user:user123:user';
  
  usersEnv.split(',').forEach(entry => {
    const parts = entry.trim().split(':');
    if (parts.length >= 2) {
      const username = parts[0];
      const password = parts[1];
      const role = (parts[2] as 'admin' | 'user') || 'user';
      users.set(username, { password, role });
    }
  });
  
  return users;
}

export function validateUser(username: string, password: string): User | null {
  const users = parseUsers();
  const user = users.get(username);
  
  if (user && user.password === password) {
    return { username, role: user.role };
  }
  
  return null;
}

export async function createSession(user: User): Promise<string> {
  const secret = new TextEncoder().encode(SECRET_KEY);
  
  const token = await new SignJWT({ username: user.username, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
  
  return token;
}

export async function getSession(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    
    if (!token) return null;
    
    const secret = new TextEncoder().encode(SECRET_KEY);
    const { payload } = await jwtVerify(token, secret);
    
    return {
      username: payload.username as string,
      role: payload.role as 'admin' | 'user',
    };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
