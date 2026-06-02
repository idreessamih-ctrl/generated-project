import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors/types';
import { Role, Permission } from '../types/auth';

interface AuthorizationOptions {
  requiredRoles?: Role[];
  requiredPermissions?: Permission[];
}

export const authorize = (options: AuthorizationOptions) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      const { roles: userRoles = [] } = req.user;

      if (options.requiredRoles && options.requiredRoles.length > 0) {
        const hasRequiredRole = options.requiredRoles.some(role =>
          userRoles.includes(role)
        );

        if (!hasRequiredRole) {
          throw new ForbiddenError('Insufficient role permissions');
        }
      }

      if (options.requiredPermissions && options.requiredPermissions.length > 0) {
        const hasRequiredPermission = options.requiredPermissions.every(permission => {
          if (userRoles.includes('admin')) return true;
          return checkPermission(userRoles, permission);
        });

        if (!hasRequiredPermission) {
          throw new ForbiddenError('Insufficient permissions');
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

function checkPermission(userRoles: string[], permission: Permission): boolean {
  const rolePermissions: Record<string, Permission[]> = {
    user: [
      { resource: 'bookmarks', action: 'create' },
      { resource: 'bookmarks', action: 'read' },
      { resource: 'bookmarks', action: 'update' },
      { resource: 'bookmarks', action: 'delete' },
      { resource: 'tags', action: 'create' },
      { resource: 'tags', action: 'read' },
      { resource: 'tags', action: 'update' },
      { resource: 'tags', action: 'delete' },
    ],
    moderator: [
      { resource: 'bookmarks', action: 'manage' },
      { resource: 'tags', action: 'manage' },
      { resource: 'users', action: 'read' },
    ],
    admin: [
      { resource: '*', action: 'manage' },
    ],
  };

  return userRoles.some(role => {
    const permissions = rolePermissions[role];
    if (!permissions) return false;

    return permissions.some(p =>
      (p.resource === '*' || p.resource === permission.resource) &&
      (p.action === 'manage' || p.action === permission.action)
    );
  });
}

export const requireRole = (...roles: Role[]) => {
  return authorize({ requiredRoles: roles });
};