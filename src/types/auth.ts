export type TokenType = 'access' | 'refresh';

export interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
  type?: TokenType;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
  sub?: string;
}

export interface AuthenticatedRequest {
  user: TokenPayload;
  requestId: string;
}

export type Role = 'user' | 'admin' | 'moderator';

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}