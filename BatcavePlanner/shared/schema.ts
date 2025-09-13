import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Tasks table for productivity management
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  domain: text("domain").notNull(), // academic, fitness, creative, social, maintenance
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  estimatedHours: numeric("estimated_hours", { precision: 4, scale: 1 }).notNull().default("1.0"),
  actualHours: numeric("actual_hours", { precision: 4, scale: 1 }),
  xpReward: integer("xp_reward").notNull().default(0),
  euReward: integer("eu_reward").notNull().default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  xpReward: true,
  euReward: true,
  isCompleted: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

// Secure update schema - excludes reward fields that must be server-controlled
export const updateTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  userId: true,
  xpReward: true,
  euReward: true,
  createdAt: true,
  updatedAt: true,
}).partial();

// Transform numeric fields from database strings to numbers
const numericFieldTransform = z.string().transform((val) => parseFloat(val));

// Client-side schema that validates input with proper data types (strings for dates)
export const clientTaskSchema = insertTaskSchema.extend({
  estimatedHours: z.number().min(0.5).max(24).multipleOf(0.5),
  dueDate: z.string().optional(),
}).omit({
  userId: true,
});

// Update schema for client with proper validation (strings for dates)
export const clientUpdateTaskSchema = updateTaskSchema.extend({
  actualHours: z.number().min(0.1).max(100).multipleOf(0.1).optional(),
  estimatedHours: z.number().min(0.5).max(24).multipleOf(0.5).optional(),
  dueDate: z.string().optional(),
}).omit({
  completedAt: true, // Server-controlled when completion happens
});

// Database response schema - transforms numeric strings to numbers for frontend consumption
export const taskResponseSchema = createInsertSchema(tasks).extend({
  estimatedHours: numericFieldTransform,
  actualHours: z.string().transform((val) => val ? parseFloat(val) : null).nullable(),
}).omit({});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type ClientTask = z.infer<typeof clientTaskSchema>;
export type ClientUpdateTask = z.infer<typeof clientUpdateTaskSchema>;
export type Task = typeof tasks.$inferSelect;
