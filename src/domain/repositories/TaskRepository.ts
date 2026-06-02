import pool from '../../config/database';
import { Task, TaskData } from '../entities/Task';
import { AppError } from '../../middleware/errorHandler';

interface TaskQuery {
  page?: number;
  limit?: number;
  sort?: string;
  direction?: "asc" | "desc";
  status?: string;
  priority?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  tagIds?: string;
  search?: string;
  isOverdue?: string;
  noDueDate?: string;
}

export class TaskRepository {
  async findById(id: string): Promise<Task | null> {
    const result = await pool.query(
      "SELECT * FROM tasks WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return Task.fromDatabase(result.rows[0] as TaskData);
  }

  async findByUserId(
    userId: string,
    query: TaskQuery = {}
  ): Promise<{ tasks: Task[]; total: number }> {
    const conditions: string[] = ["user_id = $1"];
    const values: unknown[] = [userId];
    let paramIndex = 2;

    if (query.status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(query.status);
    }

    if (query.priority) {
      conditions.push(`priority = $${paramIndex++}`);
      values.push(query.priority);
    }

    if (query.dueDateFrom) {
      conditions.push(`due_date >= $${paramIndex++}`);
      values.push(query.dueDateFrom);
    }

    if (query.dueDateTo) {
      conditions.push(`due_date <= $${paramIndex++}`);
      values.push(query.dueDateTo);
    }

    if (query.search) {
      conditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      values.push(`%${query.search}%`);
      paramIndex++;
    }

    if (query.isOverdue === "true") {
      conditions.push("due_date < NOW() AND status != 'completed'");
    }

    if (query.noDueDate === "true") {
      conditions.push("due_date IS NULL");
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const allowedSortFields = ["created_at", "updated_at", "due_date", "priority", "status", "title", "sort_order"];
    const sortField = query.sort && allowedSortFields.includes(query.sort) ? query.sort : "created_at";
    const direction = query.direction === "asc" ? "ASC" : "DESC";

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM tasks ${whereClause}`,
      values
    );

    const total = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query(
      `SELECT * FROM tasks ${whereClause} ORDER BY ${sortField} ${direction} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    const tasks = result.rows.map((row) => Task.fromDatabase(row as TaskData));

    return { tasks, total };
  }

  async create(task: Task): Promise<Task> {
    const result = await pool.query(
      `INSERT INTO tasks (id, title, description, status, priority, due_date, sort_order, version, user_id, parent_task_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        task.id,
        task.title,
        task.description,
        task.status,
        task.priority,
        task.dueDate,
        task.sortOrder,
        task.version,
        task.userId,
        task.parentTaskId,
        task.createdAt,
        task.updatedAt,
      ]
    );

    return Task.fromDatabase(result.rows[0] as TaskData);
  }

  async update(id: string, updates: Partial<TaskData>, userId: string): Promise<Task> {
    const existing = await this.findById(id);
    if (!existing) {
      throw AppError.notFound("Task not found");
    }

    if (existing.userId !== userId) {
      throw AppError.forbidden("You don't own this task");
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${paramIndex++}`);
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.priority !== undefined) {
      fields.push(`priority = $${paramIndex++}`);
      values.push(updates.priority);
    }
    if (updates.dueDate !== undefined) {
      fields.push(`due_date = $${paramIndex++}`);
      values.push(updates.dueDate);
    }
    if (updates.sortOrder !== undefined) {
      fields.push(`sort_order = $${paramIndex++}`);
      values.push(updates.sortOrder);
    }
    if (updates.parentTaskId !== undefined) {
      fields.push(`parent_task_id = $${paramIndex++}`);
      values.push(updates.parentTaskId);
    }

    fields.push(`version = version + 1`);
    fields.push(`updated_at = NOW()`);

    values.push(id);

    const result = await pool.query(
      `UPDATE tasks SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw AppError.notFound("Task not found");
    }

    return Task.fromDatabase(result.rows[0] as TaskData);
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw AppError.notFound("Task not found");
    }

    if (existing.userId !== userId) {
      throw AppError.forbidden("You don't own this task");
    }

    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    if (result.rowCount === 0) {
      throw AppError.notFound("Task not found");
    }
  }

  async batchCreate(tasks: Task[]): Promise<Task[]> {
    const createdTasks: Task[] = [];

    for (const task of tasks) {
      const created = await this.create(task);
      createdTasks.push(created);
    }

    return createdTasks;
  }

  async batchDelete(ids: string[], userId: string): Promise<void> {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = ANY($1::uuid[]) AND user_id = $2",
      [ids, userId]
    );

    if (result.rowCount !== ids.length) {
      throw AppError.badRequest("Some tasks were not found or you don't own them");
    }
  }

  async reorder(
    items: Array<{ taskId: string; sortOrder: number }>,
    userId: string
  ): Promise<void> {
    for (const item of items) {
      const existing = await this.findById(item.taskId);
      if (!existing || existing.userId !== userId) {
        throw AppError.forbidden(`Task ${item.taskId} not found or not owned by you`);
      }
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      for (const item of items) {
        await client.query(
          "UPDATE tasks SET sort_order = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3",
          [item.sortOrder, item.taskId, userId]
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}