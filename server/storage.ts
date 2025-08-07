import { type User, type InsertUser, type Lesson, type InsertLesson, type Exercise, type InsertExercise, type UserProgress, type InsertUserProgress, type AiLesson, type InsertAiLesson } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Lesson methods
  getAllLessons(): Promise<Lesson[]>;
  getLesson(id: number): Promise<Lesson | undefined>;
  getLessonsByUnit(unit: number): Promise<Lesson[]>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  
  // Exercise methods
  getExercisesByLessonId(lessonId: number): Promise<Exercise[]>;
  getExercise(id: string): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  
  // Progress methods
  getUserProgress(userId: string, lessonId: number): Promise<UserProgress[]>;
  updateProgress(progress: InsertUserProgress): Promise<UserProgress>;
  
  // AI Lesson methods
  getUserAiLessons(userId: string): Promise<AiLesson[]>;
  createAiLesson(lesson: InsertAiLesson): Promise<AiLesson>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private lessons: Map<number, Lesson>;
  private exercises: Map<string, Exercise>;
  private userProgress: Map<string, UserProgress>;
  private aiLessons: Map<string, AiLesson>;

  constructor() {
    this.users = new Map();
    this.lessons = new Map();
    this.exercises = new Map();
    this.userProgress = new Map();
    this.aiLessons = new Map();
    
    // Initialize with default user and sample data
    this.initializeData();
  }

  private initializeData() {
    // Create default user
    const defaultUser: User = {
      id: "default-user",
      username: "learner",
      email: "learner@example.com",
      hearts: 4,
      xp: 1250,
      streak: 7,
      gems: 500,
      lastActivityDate: new Date().toISOString(),
      currentLessonId: 2,
      completedLessons: [1],
      achievements: ["first_lesson"],
      createdAt: new Date(),
    };
    this.users.set(defaultUser.id, defaultUser);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      hearts: 5,
      xp: 0,
      streak: 0,
      gems: 500,
      currentLessonId: 1,
      completedLessons: [],
      achievements: [],
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllLessons(): Promise<Lesson[]> {
    return Array.from(this.lessons.values()).sort((a, b) => a.order - b.order);
  }

  async getLesson(id: number): Promise<Lesson | undefined> {
    return this.lessons.get(id);
  }

  async getLessonsByUnit(unit: number): Promise<Lesson[]> {
    return Array.from(this.lessons.values())
      .filter(lesson => lesson.unit === unit)
      .sort((a, b) => a.order - b.order);
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const newLesson: Lesson = { ...lesson };
    this.lessons.set(lesson.id, newLesson);
    return newLesson;
  }

  async getExercisesByLessonId(lessonId: number): Promise<Exercise[]> {
    return Array.from(this.exercises.values())
      .filter(exercise => exercise.lessonId === lessonId)
      .sort((a, b) => a.order - b.order);
  }

  async getExercise(id: string): Promise<Exercise | undefined> {
    return this.exercises.get(id);
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const id = randomUUID();
    const newExercise: Exercise = { ...exercise, id };
    this.exercises.set(id, newExercise);
    return newExercise;
  }

  async getUserProgress(userId: string, lessonId: number): Promise<UserProgress[]> {
    return Array.from(this.userProgress.values())
      .filter(progress => progress.userId === userId && progress.lessonId === lessonId);
  }

  async updateProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const id = randomUUID();
    const newProgress: UserProgress = { 
      ...progress, 
      id,
      completedAt: progress.isCompleted ? new Date() : null,
    };
    this.userProgress.set(id, newProgress);
    return newProgress;
  }

  async getUserAiLessons(userId: string): Promise<AiLesson[]> {
    return Array.from(this.aiLessons.values())
      .filter(lesson => lesson.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createAiLesson(lesson: InsertAiLesson): Promise<AiLesson> {
    const id = randomUUID();
    const newLesson: AiLesson = { 
      ...lesson, 
      id,
      createdAt: new Date(),
    };
    this.aiLessons.set(id, newLesson);
    return newLesson;
  }
}

import { FirebaseStorage } from './firebase-storage';

// Use Firebase storage for production, memory storage for development
const useFirebase = process.env.NODE_ENV === 'production' || process.env.USE_FIREBASE === 'true';
export const storage = useFirebase ? new FirebaseStorage() : new MemStorage();

// Export memory storage for migration purposes
export const memoryStorage = new MemStorage();
