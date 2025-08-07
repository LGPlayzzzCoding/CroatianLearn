import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  hearts: integer("hearts").notNull().default(5),
  xp: integer("xp").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  gems: integer("gems").notNull().default(500),
  lastActivityDate: text("last_activity_date"),
  currentLessonId: integer("current_lesson_id").default(1),
  completedLessons: jsonb("completed_lessons").$type<number[]>().default([]),
  achievements: jsonb("achievements").$type<string[]>().default([]),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const lessons = pgTable("lessons", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  unit: integer("unit").notNull(),
  order: integer("order").notNull(),
  isLocked: boolean("is_locked").notNull().default(true),
  xpReward: integer("xp_reward").notNull().default(10),
  type: text("type").notNull(), // 'base' or 'ai-generated'
});

export const exercises = pgTable("exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: integer("lesson_id").references(() => lessons.id),
  type: text("type").notNull(), // 'translation', 'multiple-choice', 'listening', 'speaking', 'word-bank'
  question: text("question").notNull(),
  croatianText: text("croatian_text"),
  englishText: text("english_text"),
  audioUrl: text("audio_url"),
  options: jsonb("options").$type<string[]>(),
  correctAnswer: text("correct_answer").notNull(),
  hints: jsonb("hints").$type<string[]>(),
  order: integer("order").notNull(),
});

export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  lessonId: integer("lesson_id").references(() => lessons.id),
  exerciseId: varchar("exercise_id").references(() => exercises.id),
  isCompleted: boolean("is_completed").notNull().default(false),
  attempts: integer("attempts").notNull().default(0),
  correctAttempts: integer("correct_attempts").notNull().default(0),
  completedAt: timestamp("completed_at"),
});

export const aiLessons = pgTable("ai_lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  title: text("title").notNull(),
  content: jsonb("content").$type<any>(),
  difficulty: text("difficulty").notNull(), // 'beginner', 'intermediate', 'advanced'
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertLessonSchema = createInsertSchema(lessons);

export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  completedAt: true,
});

export const insertAiLessonSchema = createInsertSchema(aiLessons).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type AiLesson = typeof aiLessons.$inferSelect;
export type InsertAiLesson = z.infer<typeof insertAiLessonSchema>;
