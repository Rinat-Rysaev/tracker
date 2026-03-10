import type { Doc, Id } from '../../convex/_generated/dataModel';

export type Task = Doc<"tasks">;
export type WorkStream = Doc<"streams">;
export type Quarter = Doc<"quarters">;

export type TaskId = Id<"tasks">;
export type StreamId = Id<"streams">;
export type QuarterId = Id<"quarters">;

export type TaskStatus = 'todo' | 'in-progress' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high';
