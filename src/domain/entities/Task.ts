import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

export const TaskStatus = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const TaskPriority = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const;

export type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];
export type TaskPriorityType = (typeof TaskPriority)[keyof typeof TaskPriority];

export const TaskSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(500).trim(),
  description: z.string().max(10000).nullable().optional(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).default("pending"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: z.string().datetime().nullable().optional(),
  sortOrder: z.number().int().default(0),
  version: z.number().int().positive().default(1),
  userId: z.string().uuid(),
  parentTaskId: z.string().uuid().nullable().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type TaskData = z.infer<typeof TaskSchema>;

export class Task {
  public readonly id: string;
  public readonly title: string;
  public readonly description: string | null;
  public readonly status: TaskStatusType;
  public readonly priority: TaskPriorityType;
  public readonly dueDate: string | null;
  public readonly sortOrder: number;
  public readonly version: number;
  public readonly userId: string;
  public readonly parentTaskId: string | null;
  public readonly createdAt: string;
  public readonly updatedAt: string;

  private constructor(data: TaskData) {
    this.id = data.id ?? uuidv4();
    this.title = data.title;
    this.description = data.description ?? null;
    this.status = data.status as TaskStatusType;
    this.priority = data.priority as TaskPriorityType;
    this.dueDate = data.dueDate ?? null;
    this.sortOrder = data.sortOrder;
    this.version = data.version;
    this.userId = data.userId;
    this.parentTaskId = data.parentTaskId ?? null;
    this.createdAt = data.createdAt ?? new Date().toISOString();
    this.updatedAt = data.updatedAt ?? new Date().toISOString();
  }

  static create(data: Omit<TaskData, "id" | "version" | "createdAt" | "updatedAt">): Task {
    const validated = TaskSchema.omit({ id: true, version: true, createdAt: true, updatedAt: true }).parse(data);
    return new Task(validated);
  }

  static fromDatabase(data: TaskData): Task {
    const validated = TaskSchema.parse(data);
    return new Task(validated);
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      dueDate: this.dueDate,
      sortOrder: this.sortOrder,
      version: this.version,
      userId: this.userId,
      parentTaskId: this.parentTaskId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}