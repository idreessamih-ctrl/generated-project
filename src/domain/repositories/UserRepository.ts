import pool from '../../config/database';
import { User, UserData } from '../entities/User';
import { AppError } from '../../middleware/errorHandler';

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return User.fromDatabase(result.rows[0] as UserData);
  }

  async findById(id: string): Promise<User | null> {
    const result = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return User.fromDatabase(result.rows[0] as UserData);
  }

  async create(user: User): Promise<User> {
    const hashedPassword = await user.hashPassword();

    const result = await pool.query(
      `INSERT INTO users (id, email, password, display_name, roles, timezone, email_notifications, push_notifications, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        user.id,
        user.email,
        hashedPassword,
        user.displayName,
        user.roles,
        user.timezone,
        user.emailNotifications,
        user.pushNotifications,
        user.createdAt,
        user.updatedAt,
      ]
    );

    return User.fromDatabase(result.rows[0] as UserData);
  }

  async update(id: string, updates: Partial<UserData>): Promise<User> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.displayName !== undefined) {
      fields.push(`display_name = $${paramIndex++}`);
      values.push(updates.displayName);
    }
    if (updates.timezone !== undefined) {
      fields.push(`timezone = $${paramIndex++}`);
      values.push(updates.timezone);
    }
    if (updates.emailNotifications !== undefined) {
      fields.push(`email_notifications = $${paramIndex++}`);
      values.push(updates.emailNotifications);
    }
    if (updates.pushNotifications !== undefined) {
      fields.push(`push_notifications = $${paramIndex++}`);
      values.push(updates.pushNotifications);
    }

    if (fields.length === 0) {
      return this.findById(id) as Promise<User>;
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw AppError.notFound("User not found");
    }

    return User.fromDatabase(result.rows[0] as UserData);
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await new User(
      User.create({
        email: "",
        password: newPassword,
        displayName: "",
      }).toJSON() as unknown as UserData
    ).hashPassword();

    const result = await pool.query(
      "UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2",
      [hashedPassword, id]
    );

    if (result.rowCount === 0) {
      throw AppError.notFound("User not found");
    }
  }

  async delete(id: string): Promise<void> {
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      throw AppError.notFound("User not found");
    }
  }
}