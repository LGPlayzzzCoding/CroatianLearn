import admin from 'firebase-admin';
import { type User, type InsertUser, type Lesson, type InsertLesson, type Exercise, type InsertExercise, type UserProgress, type InsertUserProgress, type AiLesson, type InsertAiLesson } from "@shared/schema";
import { IStorage } from './storage';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

export class FirebaseStorage implements IStorage {
  private usersCollection = db.collection('users');
  private lessonsCollection = db.collection('lessons');
  private exercisesCollection = db.collection('exercises');
  private progressCollection = db.collection('user_progress');
  private aiLessonsCollection = db.collection('ai_lessons');

  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    // Check if default user exists, if not create it
    const defaultUserDoc = await this.usersCollection.doc('default-user').get();
    if (!defaultUserDoc.exists) {
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
      await this.usersCollection.doc('default-user').set(defaultUser);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const doc = await this.usersCollection.doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const query = await this.usersCollection.where('username', '==', username).limit(1).get();
    if (query.empty) return undefined;
    const doc = query.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const docRef = this.usersCollection.doc();
    const user: User = {
      ...insertUser,
      id: docRef.id,
      hearts: 5,
      xp: 0,
      streak: 0,
      gems: 500,
      lastActivityDate: null,
      currentLessonId: 1,
      completedLessons: [],
      achievements: [],
      createdAt: new Date(),
    };
    await docRef.set(user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const docRef = this.usersCollection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return undefined;

    await docRef.update(updates);
    const updatedDoc = await docRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() } as User;
  }

  async getAllLessons(): Promise<Lesson[]> {
    const query = await this.lessonsCollection.orderBy('order').get();
    return query.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() } as Lesson));
  }

  async getLesson(id: number): Promise<Lesson | undefined> {
    const doc = await this.lessonsCollection.doc(id.toString()).get();
    if (!doc.exists) return undefined;
    return { id: parseInt(doc.id), ...doc.data() } as Lesson;
  }

  async getLessonsByUnit(unit: number): Promise<Lesson[]> {
    const query = await this.lessonsCollection
      .where('unit', '==', unit)
      .orderBy('order')
      .get();
    return query.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() } as Lesson));
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    await this.lessonsCollection.doc(lesson.id.toString()).set(lesson);
    return lesson as Lesson;
  }

  async getExercisesByLessonId(lessonId: number): Promise<Exercise[]> {
    const query = await this.exercisesCollection
      .where('lessonId', '==', lessonId)
      .orderBy('order')
      .get();
    return query.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise));
  }

  async getExercise(id: string): Promise<Exercise | undefined> {
    const doc = await this.exercisesCollection.doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as Exercise;
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const docRef = this.exercisesCollection.doc();
    const newExercise: Exercise = { 
      ...exercise, 
      id: docRef.id,
      lessonId: exercise.lessonId || null,
      croatianText: exercise.croatianText || null,
      englishText: exercise.englishText || null,
      audioUrl: exercise.audioUrl || null,
      options: exercise.options || null,
      hints: exercise.hints || null
    };
    await docRef.set(newExercise);
    return newExercise;
  }

  async getUserProgress(userId: string, lessonId: number): Promise<UserProgress[]> {
    const query = await this.progressCollection
      .where('userId', '==', userId)
      .where('lessonId', '==', lessonId)
      .get();
    return query.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProgress));
  }

  async updateProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const docRef = this.progressCollection.doc();
    const newProgress: UserProgress = {
      ...progress,
      id: docRef.id,
      userId: progress.userId || null,
      lessonId: progress.lessonId || null,
      exerciseId: progress.exerciseId || null,
      isCompleted: progress.isCompleted || false,
      attempts: progress.attempts || 0,
      correctAttempts: progress.correctAttempts || 0,
      completedAt: progress.isCompleted ? new Date() : null,
    };
    await docRef.set(newProgress);
    return newProgress;
  }

  async getUserAiLessons(userId: string): Promise<AiLesson[]> {
    const query = await this.aiLessonsCollection
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    return query.docs.map(doc => ({ id: doc.id, ...doc.data() } as AiLesson));
  }

  async createAiLesson(lesson: InsertAiLesson): Promise<AiLesson> {
    const docRef = this.aiLessonsCollection.doc();
    const newLesson: AiLesson = {
      ...lesson,
      id: docRef.id,
      userId: lesson.userId || null,
      content: lesson.content || null,
      createdAt: new Date(),
    };
    await docRef.set(newLesson);
    return newLesson;
  }

  // Migration helper method to transfer data from memory storage to Firebase
  async migrateFromMemoryStorage(memoryStorage: any): Promise<void> {
    console.log('Starting migration from memory storage to Firebase...');

    // Migrate users
    const users = Array.from(memoryStorage.users.values()) as User[];
    for (const user of users) {
      await this.usersCollection.doc(user.id).set({
        ...user,
        lastActivityDate: user.lastActivityDate || null,
        currentLessonId: user.currentLessonId || null,
        completedLessons: user.completedLessons || [],
        achievements: user.achievements || [],
        createdAt: user.createdAt || new Date()
      });
    }
    console.log(`Migrated ${users.length} users`);

    // Migrate lessons
    const lessons = Array.from(memoryStorage.lessons.values()) as Lesson[];
    for (const lesson of lessons) {
      await this.lessonsCollection.doc(lesson.id.toString()).set(lesson);
    }
    console.log(`Migrated ${lessons.length} lessons`);

    // Migrate exercises
    const exercises = Array.from(memoryStorage.exercises.values()) as Exercise[];
    for (const exercise of exercises) {
      await this.exercisesCollection.doc(exercise.id).set({
        ...exercise,
        lessonId: exercise.lessonId || null,
        croatianText: exercise.croatianText || null,
        englishText: exercise.englishText || null,
        audioUrl: exercise.audioUrl || null,
        options: exercise.options || null,
        hints: exercise.hints || null
      });
    }
    console.log(`Migrated ${exercises.length} exercises`);

    // Migrate user progress
    const userProgress = Array.from(memoryStorage.userProgress.values()) as UserProgress[];
    for (const progress of userProgress) {
      await this.progressCollection.doc(progress.id).set({
        ...progress,
        userId: progress.userId || null,
        lessonId: progress.lessonId || null,
        exerciseId: progress.exerciseId || null,
        completedAt: progress.completedAt || null
      });
    }
    console.log(`Migrated ${userProgress.length} progress records`);

    // Migrate AI lessons
    const aiLessons = Array.from(memoryStorage.aiLessons.values()) as AiLesson[];
    for (const aiLesson of aiLessons) {
      await this.aiLessonsCollection.doc(aiLesson.id).set({
        ...aiLesson,
        userId: aiLesson.userId || null,
        content: aiLesson.content || null,
        createdAt: aiLesson.createdAt || new Date()
      });
    }
    console.log(`Migrated ${aiLessons.length} AI lessons`);

    console.log('Migration completed successfully!');
  }
}