import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

export const TagSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(50).trim().toLowerCase(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
  userId: z.string().uuid(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type TagData = z.infer<typeof TagSchema>;

export class Tag {
  public readonly id: string;
  public readonly name: string;
  public readonly color: string;
  public readonly userId: string;
  public readonly createdAt: string;
  public readonly updatedAt: string;

  private constructor(data: TagData) {
    this.id = data.id ?? uuidv4();
    this.name = data.name;
    this.color = data.color;
    this.userId = data.userId;
    this.createdAt = data.createdAt ?? new Date().toISOString();
    this.updatedAt = data.updatedAt ?? new Date().toISOString();
  }

  static create(data: Omit<TagData, "id" | "createdAt" | "updatedAt">): Tag {
    const validated = TagSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(data);
    return new Tag(validated);
  }

  static fromDatabase(data: TagData): Tag {
    const validated = TagSchema.parse(data);
    return new Tag(validated);
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}