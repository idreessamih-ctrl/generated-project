import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

export const TaskTagSchema = z.object({
  id: z.string().uuid().optional(),
  taskId: z.string().uuid(),
  tagId: z.string().uuid(),
});

export type TaskTagData = z.infer<typeof TaskTagSchema>;

export class TaskTag {
  public readonly id: string;
  public readonly taskId: string;
  public readonly tagId: string;

  private constructor(data: TaskTagData) {
    this.id = data.id ?? uuidv4();
    this.taskId = data.taskId;
    this.tagId = data.tagId;
  }

  static create(data: Omit<TaskTagData, "id">): TaskTag {
    const validated = TaskTagSchema.omit({ id: true }).parse(data);
    return new TaskTag(validated);
  }

  static fromDatabase(data: TaskTagData): TaskTag {
    const validated = TaskTagSchema.parse(data);
    return new TaskTag(validated);
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      taskId: this.taskId,
      tagId: this.tagId,
    };
  }
}