import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { securityConfig } from '../../config/security';

export const UserSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email().min(5).max(255),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(100).trim(),
  roles: z.array(z.string()).default(["user"]),
  timezone: z.string().optional(),
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type UserData = z.infer<typeof UserSchema>;

export class User {
  public readonly id: string;
  public readonly email: string;
  public readonly password: string;
  public readonly displayName: string;
  public readonly roles: string[];
  public readonly timezone: string;
  public readonly emailNotifications: boolean;
  public readonly pushNotifications: boolean;
  public readonly createdAt: string;
  public readonly updatedAt: string;

  private constructor(data: UserData) {
    this.id = data.id ?? uuidv4();
    this.email = data.email;
    this.password = data.password;
    this.displayName = data.displayName;
    this.roles = data.roles;
    this.timezone = data.timezone ?? "UTC";
    this.emailNotifications = data.emailNotifications;
    this.pushNotifications = data.pushNotifications;
    this.createdAt = data.createdAt ?? new Date().toISOString();
    this.updatedAt = data.updatedAt ?? new Date().toISOString();
  }

  static create(data: Omit<UserData, "id" | "createdAt" | "updatedAt">): User {
    const validated = UserSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(data);
    return new User(validated);
  }

  static fromDatabase(data: UserData): User {
    const validated = UserSchema.parse(data);
    return new User(validated);
  }

  async hashPassword(): Promise<string> {
    return bcrypt.hash(this.password, securityConfig.bcrypt.saltRounds);
  }

  async verifyPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      email: this.email,
      displayName: this.displayName,
      roles: this.roles,
      timezone: this.timezone,
      emailNotifications: this.emailNotifications,
      pushNotifications: this.pushNotifications,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}