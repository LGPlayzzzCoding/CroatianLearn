// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";

// server/firebase-storage.ts
import admin from "firebase-admin";
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    }),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}
var db = admin.firestore();
var FirebaseStorage = class {
  usersCollection = db.collection("users");
  lessonsCollection = db.collection("lessons");
  exercisesCollection = db.collection("exercises");
  progressCollection = db.collection("user_progress");
  aiLessonsCollection = db.collection("ai_lessons");
  constructor() {
    this.initializeData();
  }
  async initializeData() {
    const defaultUserDoc = await this.usersCollection.doc("default-user").get();
    if (!defaultUserDoc.exists) {
      const defaultUser = {
        id: "default-user",
        username: "learner",
        email: "learner@example.com",
        hearts: 4,
        xp: 1250,
        streak: 7,
        gems: 500,
        lastActivityDate: (/* @__PURE__ */ new Date()).toISOString(),
        currentLessonId: 2,
        completedLessons: [1],
        achievements: ["first_lesson"],
        createdAt: /* @__PURE__ */ new Date()
      };
      await this.usersCollection.doc("default-user").set(defaultUser);
    }
  }
  async getUser(id) {
    const doc = await this.usersCollection.doc(id).get();
    if (!doc.exists) return void 0;
    return { id: doc.id, ...doc.data() };
  }
  async getUserByUsername(username) {
    const query = await this.usersCollection.where("username", "==", username).limit(1).get();
    if (query.empty) return void 0;
    const doc = query.docs[0];
    return { id: doc.id, ...doc.data() };
  }
  async createUser(insertUser) {
    const docRef = this.usersCollection.doc();
    const user = {
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
      createdAt: /* @__PURE__ */ new Date()
    };
    await docRef.set(user);
    return user;
  }
  async updateUser(id, updates) {
    const docRef = this.usersCollection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return void 0;
    await docRef.update(updates);
    const updatedDoc = await docRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() };
  }
  async getAllLessons() {
    const query = await this.lessonsCollection.orderBy("order").get();
    return query.docs.map((doc) => ({ id: parseInt(doc.id), ...doc.data() }));
  }
  async getLesson(id) {
    const doc = await this.lessonsCollection.doc(id.toString()).get();
    if (!doc.exists) return void 0;
    return { id: parseInt(doc.id), ...doc.data() };
  }
  async getLessonsByUnit(unit) {
    const query = await this.lessonsCollection.where("unit", "==", unit).orderBy("order").get();
    return query.docs.map((doc) => ({ id: parseInt(doc.id), ...doc.data() }));
  }
  async createLesson(lesson) {
    await this.lessonsCollection.doc(lesson.id.toString()).set(lesson);
    return lesson;
  }
  async getExercisesByLessonId(lessonId) {
    const query = await this.exercisesCollection.where("lessonId", "==", lessonId).orderBy("order").get();
    return query.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
  async getExercise(id) {
    const doc = await this.exercisesCollection.doc(id).get();
    if (!doc.exists) return void 0;
    return { id: doc.id, ...doc.data() };
  }
  async createExercise(exercise) {
    const docRef = this.exercisesCollection.doc();
    const newExercise = {
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
  async getUserProgress(userId, lessonId) {
    const query = await this.progressCollection.where("userId", "==", userId).where("lessonId", "==", lessonId).get();
    return query.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
  async updateProgress(progress) {
    const docRef = this.progressCollection.doc();
    const newProgress = {
      ...progress,
      id: docRef.id,
      userId: progress.userId || null,
      lessonId: progress.lessonId || null,
      exerciseId: progress.exerciseId || null,
      isCompleted: progress.isCompleted || false,
      attempts: progress.attempts || 0,
      correctAttempts: progress.correctAttempts || 0,
      completedAt: progress.isCompleted ? /* @__PURE__ */ new Date() : null
    };
    await docRef.set(newProgress);
    return newProgress;
  }
  async getUserAiLessons(userId) {
    const query = await this.aiLessonsCollection.where("userId", "==", userId).orderBy("createdAt", "desc").get();
    return query.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
  async createAiLesson(lesson) {
    const docRef = this.aiLessonsCollection.doc();
    const newLesson = {
      ...lesson,
      id: docRef.id,
      userId: lesson.userId || null,
      content: lesson.content || null,
      createdAt: /* @__PURE__ */ new Date()
    };
    await docRef.set(newLesson);
    return newLesson;
  }
  // Migration helper method to transfer data from memory storage to Firebase
  async migrateFromMemoryStorage(memoryStorage2) {
    console.log("Starting migration from memory storage to Firebase...");
    const users2 = Array.from(memoryStorage2.users.values());
    for (const user of users2) {
      await this.usersCollection.doc(user.id).set({
        ...user,
        lastActivityDate: user.lastActivityDate || null,
        currentLessonId: user.currentLessonId || null,
        completedLessons: user.completedLessons || [],
        achievements: user.achievements || [],
        createdAt: user.createdAt || /* @__PURE__ */ new Date()
      });
    }
    console.log(`Migrated ${users2.length} users`);
    const lessons2 = Array.from(memoryStorage2.lessons.values());
    for (const lesson of lessons2) {
      await this.lessonsCollection.doc(lesson.id.toString()).set(lesson);
    }
    console.log(`Migrated ${lessons2.length} lessons`);
    const exercises2 = Array.from(memoryStorage2.exercises.values());
    for (const exercise of exercises2) {
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
    console.log(`Migrated ${exercises2.length} exercises`);
    const userProgress2 = Array.from(memoryStorage2.userProgress.values());
    for (const progress of userProgress2) {
      await this.progressCollection.doc(progress.id).set({
        ...progress,
        userId: progress.userId || null,
        lessonId: progress.lessonId || null,
        exerciseId: progress.exerciseId || null,
        completedAt: progress.completedAt || null
      });
    }
    console.log(`Migrated ${userProgress2.length} progress records`);
    const aiLessons2 = Array.from(memoryStorage2.aiLessons.values());
    for (const aiLesson of aiLessons2) {
      await this.aiLessonsCollection.doc(aiLesson.id).set({
        ...aiLesson,
        userId: aiLesson.userId || null,
        content: aiLesson.content || null,
        createdAt: aiLesson.createdAt || /* @__PURE__ */ new Date()
      });
    }
    console.log(`Migrated ${aiLessons2.length} AI lessons`);
    console.log("Migration completed successfully!");
  }
};

// server/storage.ts
var MemStorage = class {
  users;
  lessons;
  exercises;
  userProgress;
  aiLessons;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.lessons = /* @__PURE__ */ new Map();
    this.exercises = /* @__PURE__ */ new Map();
    this.userProgress = /* @__PURE__ */ new Map();
    this.aiLessons = /* @__PURE__ */ new Map();
    this.initializeData();
  }
  initializeData() {
    const defaultUser = {
      id: "default-user",
      username: "learner",
      email: "learner@example.com",
      hearts: 4,
      xp: 1250,
      streak: 7,
      gems: 500,
      lastActivityDate: (/* @__PURE__ */ new Date()).toISOString(),
      currentLessonId: 2,
      completedLessons: [1],
      achievements: ["first_lesson"],
      createdAt: /* @__PURE__ */ new Date()
    };
    this.users.set(defaultUser.id, defaultUser);
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const user = {
      ...insertUser,
      id,
      hearts: 5,
      xp: 0,
      streak: 0,
      gems: 500,
      currentLessonId: 1,
      completedLessons: [],
      achievements: [],
      createdAt: /* @__PURE__ */ new Date()
    };
    this.users.set(id, user);
    return user;
  }
  async updateUser(id, updates) {
    const user = this.users.get(id);
    if (!user) return void 0;
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  async getAllLessons() {
    return Array.from(this.lessons.values()).sort((a, b) => a.order - b.order);
  }
  async getLesson(id) {
    return this.lessons.get(id);
  }
  async getLessonsByUnit(unit) {
    return Array.from(this.lessons.values()).filter((lesson) => lesson.unit === unit).sort((a, b) => a.order - b.order);
  }
  async createLesson(lesson) {
    const newLesson = { ...lesson };
    this.lessons.set(lesson.id, newLesson);
    return newLesson;
  }
  async getExercisesByLessonId(lessonId) {
    return Array.from(this.exercises.values()).filter((exercise) => exercise.lessonId === lessonId).sort((a, b) => a.order - b.order);
  }
  async getExercise(id) {
    return this.exercises.get(id);
  }
  async createExercise(exercise) {
    const id = randomUUID();
    const newExercise = { ...exercise, id };
    this.exercises.set(id, newExercise);
    return newExercise;
  }
  async getUserProgress(userId, lessonId) {
    return Array.from(this.userProgress.values()).filter((progress) => progress.userId === userId && progress.lessonId === lessonId);
  }
  async updateProgress(progress) {
    const id = randomUUID();
    const newProgress = {
      ...progress,
      id,
      completedAt: progress.isCompleted ? /* @__PURE__ */ new Date() : null
    };
    this.userProgress.set(id, newProgress);
    return newProgress;
  }
  async getUserAiLessons(userId) {
    return Array.from(this.aiLessons.values()).filter((lesson) => lesson.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async createAiLesson(lesson) {
    const id = randomUUID();
    const newLesson = {
      ...lesson,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.aiLessons.set(id, newLesson);
    return newLesson;
  }
};
var useFirebase = process.env.NODE_ENV === "production" || process.env.USE_FIREBASE === "true";
var storage = useFirebase ? new FirebaseStorage() : new MemStorage();
var memoryStorage = new MemStorage();

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  hearts: integer("hearts").notNull().default(5),
  xp: integer("xp").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  gems: integer("gems").notNull().default(500),
  lastActivityDate: text("last_activity_date"),
  currentLessonId: integer("current_lesson_id").default(1),
  completedLessons: jsonb("completed_lessons").$type().default([]),
  achievements: jsonb("achievements").$type().default([]),
  createdAt: timestamp("created_at").default(sql`now()`)
});
var lessons = pgTable("lessons", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  unit: integer("unit").notNull(),
  order: integer("order").notNull(),
  isLocked: boolean("is_locked").notNull().default(true),
  xpReward: integer("xp_reward").notNull().default(10),
  type: text("type").notNull()
  // 'base' or 'ai-generated'
});
var exercises = pgTable("exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: integer("lesson_id").references(() => lessons.id),
  type: text("type").notNull(),
  // 'translation', 'multiple-choice', 'listening', 'speaking', 'word-bank'
  question: text("question").notNull(),
  croatianText: text("croatian_text"),
  englishText: text("english_text"),
  audioUrl: text("audio_url"),
  options: jsonb("options").$type(),
  correctAnswer: text("correct_answer").notNull(),
  hints: jsonb("hints").$type(),
  order: integer("order").notNull()
});
var userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  lessonId: integer("lesson_id").references(() => lessons.id),
  exerciseId: varchar("exercise_id").references(() => exercises.id),
  isCompleted: boolean("is_completed").notNull().default(false),
  attempts: integer("attempts").notNull().default(0),
  correctAttempts: integer("correct_attempts").notNull().default(0),
  completedAt: timestamp("completed_at")
});
var aiLessons = pgTable("ai_lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  title: text("title").notNull(),
  content: jsonb("content").$type(),
  difficulty: text("difficulty").notNull(),
  // 'beginner', 'intermediate', 'advanced'
  createdAt: timestamp("created_at").default(sql`now()`)
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});
var insertLessonSchema = createInsertSchema(lessons);
var insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true
});
var insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  completedAt: true
});
var insertAiLessonSchema = createInsertSchema(aiLessons).omit({
  id: true,
  createdAt: true
});

// server/data/lessons.ts
var baseLessons = [
  // Unit 1: Form basic sentences
  { id: 1, title: "Greetings", description: "Learn basic Croatian greetings", unit: 1, order: 1, isLocked: false, xpReward: 10, type: "base" },
  { id: 2, title: "Family", description: "Family members and relationships", unit: 1, order: 2, isLocked: false, xpReward: 10, type: "base" },
  { id: 3, title: "Food", description: "Basic food vocabulary", unit: 1, order: 3, isLocked: true, xpReward: 10, type: "base" },
  { id: 4, title: "Animals", description: "Common animals", unit: 1, order: 4, isLocked: true, xpReward: 10, type: "base" },
  { id: 5, title: "Colors", description: "Basic colors", unit: 1, order: 5, isLocked: true, xpReward: 10, type: "base" },
  { id: 6, title: "Numbers", description: "Numbers 1-20", unit: 1, order: 6, isLocked: true, xpReward: 10, type: "base" },
  { id: 7, title: "Days & Time", description: "Days of the week and time", unit: 1, order: 7, isLocked: true, xpReward: 10, type: "base" },
  { id: 8, title: "Weather", description: "Weather expressions", unit: 1, order: 8, isLocked: true, xpReward: 10, type: "base" },
  { id: 9, title: "House", description: "Parts of the house", unit: 1, order: 9, isLocked: true, xpReward: 10, type: "base" },
  { id: 10, title: "Body Parts", description: "Basic body vocabulary", unit: 1, order: 10, isLocked: true, xpReward: 10, type: "base" },
  // Unit 2: Navigate familiar places
  { id: 11, title: "Directions", description: "Basic directions and locations", unit: 2, order: 11, isLocked: true, xpReward: 15, type: "base" },
  { id: 12, title: "City Places", description: "Places in the city", unit: 2, order: 12, isLocked: true, xpReward: 15, type: "base" },
  { id: 13, title: "Transportation", description: "Ways to travel", unit: 2, order: 13, isLocked: true, xpReward: 15, type: "base" },
  { id: 14, title: "Shopping", description: "Shopping vocabulary", unit: 2, order: 14, isLocked: true, xpReward: 15, type: "base" },
  { id: 15, title: "Restaurant", description: "Ordering food", unit: 2, order: 15, isLocked: true, xpReward: 15, type: "base" },
  { id: 16, title: "Hotel", description: "Hotel situations", unit: 2, order: 16, isLocked: true, xpReward: 15, type: "base" },
  { id: 17, title: "Post Office", description: "Postal services", unit: 2, order: 17, isLocked: true, xpReward: 15, type: "base" },
  { id: 18, title: "Bank", description: "Banking basics", unit: 2, order: 18, isLocked: true, xpReward: 15, type: "base" },
  { id: 19, title: "Hospital", description: "Medical situations", unit: 2, order: 19, isLocked: true, xpReward: 15, type: "base" },
  { id: 20, title: "School", description: "School vocabulary", unit: 2, order: 20, isLocked: true, xpReward: 15, type: "base" },
  // Unit 3: Express yourself
  { id: 21, title: "Emotions", description: "Expressing feelings", unit: 3, order: 21, isLocked: true, xpReward: 20, type: "base" },
  { id: 22, title: "Hobbies", description: "Talking about interests", unit: 3, order: 22, isLocked: true, xpReward: 20, type: "base" },
  { id: 23, title: "Sports", description: "Sports and activities", unit: 3, order: 23, isLocked: true, xpReward: 20, type: "base" },
  { id: 24, title: "Music", description: "Musical terms", unit: 3, order: 24, isLocked: true, xpReward: 20, type: "base" },
  { id: 25, title: "Art", description: "Artistic expressions", unit: 3, order: 25, isLocked: true, xpReward: 20, type: "base" },
  { id: 26, title: "Clothes", description: "Clothing vocabulary", unit: 3, order: 26, isLocked: true, xpReward: 20, type: "base" },
  { id: 27, title: "Technology", description: "Modern technology", unit: 3, order: 27, isLocked: true, xpReward: 20, type: "base" },
  { id: 28, title: "Nature", description: "Natural world", unit: 3, order: 28, isLocked: true, xpReward: 20, type: "base" },
  { id: 29, title: "Seasons", description: "Seasons and months", unit: 3, order: 29, isLocked: true, xpReward: 20, type: "base" },
  { id: 30, title: "Holidays", description: "Croatian holidays", unit: 3, order: 30, isLocked: true, xpReward: 20, type: "base" },
  // Unit 4: Past and future
  { id: 31, title: "Past Tense", description: "Talking about the past", unit: 4, order: 31, isLocked: true, xpReward: 25, type: "base" },
  { id: 32, title: "Future Plans", description: "Discussing future", unit: 4, order: 32, isLocked: true, xpReward: 25, type: "base" },
  { id: 33, title: "Childhood", description: "Childhood memories", unit: 4, order: 33, isLocked: true, xpReward: 25, type: "base" },
  { id: 34, title: "Travel", description: "Travel experiences", unit: 4, order: 34, isLocked: true, xpReward: 25, type: "base" },
  { id: 35, title: "Work", description: "Jobs and careers", unit: 4, order: 35, isLocked: true, xpReward: 25, type: "base" },
  { id: 36, title: "Goals", description: "Dreams and ambitions", unit: 4, order: 36, isLocked: true, xpReward: 25, type: "base" },
  { id: 37, title: "History", description: "Croatian history", unit: 4, order: 37, isLocked: true, xpReward: 25, type: "base" },
  { id: 38, title: "Traditions", description: "Cultural traditions", unit: 4, order: 38, isLocked: true, xpReward: 25, type: "base" },
  { id: 39, title: "Celebrations", description: "Special occasions", unit: 4, order: 39, isLocked: true, xpReward: 25, type: "base" },
  { id: 40, title: "Stories", description: "Telling stories", unit: 4, order: 40, isLocked: true, xpReward: 25, type: "base" },
  // Unit 5: Advanced topics
  { id: 41, title: "Business", description: "Business Croatian", unit: 5, order: 41, isLocked: true, xpReward: 30, type: "base" },
  { id: 42, title: "Politics", description: "Political discussions", unit: 5, order: 42, isLocked: true, xpReward: 30, type: "base" },
  { id: 43, title: "Environment", description: "Environmental topics", unit: 5, order: 43, isLocked: true, xpReward: 30, type: "base" },
  { id: 44, title: "Science", description: "Scientific terms", unit: 5, order: 44, isLocked: true, xpReward: 30, type: "base" },
  { id: 45, title: "Philosophy", description: "Abstract concepts", unit: 5, order: 45, isLocked: true, xpReward: 30, type: "base" },
  { id: 46, title: "Literature", description: "Croatian literature", unit: 5, order: 46, isLocked: true, xpReward: 30, type: "base" },
  { id: 47, title: "Media", description: "News and media", unit: 5, order: 47, isLocked: true, xpReward: 30, type: "base" },
  { id: 48, title: "Internet", description: "Digital communication", unit: 5, order: 48, isLocked: true, xpReward: 30, type: "base" },
  { id: 49, title: "Debate", description: "Expressing opinions", unit: 5, order: 49, isLocked: true, xpReward: 30, type: "base" },
  { id: 50, title: "Mastery", description: "Advanced conversation", unit: 5, order: 50, isLocked: true, xpReward: 50, type: "base" }
];
var baseExercises = [
  // Lesson 1: Greetings
  {
    lessonId: 1,
    type: "translation",
    question: "Translate this Croatian greeting to English",
    croatianText: "Dobro jutro",
    englishText: "Good morning",
    correctAnswer: "good morning",
    hints: ["Think about the time of day", "This is a common morning greeting"],
    order: 1,
    audioUrl: null,
    options: null
  },
  {
    lessonId: 1,
    type: "multiple-choice",
    question: "How do you say 'Hello' in Croatian?",
    croatianText: null,
    englishText: "Hello",
    options: ["Bok", "Zbogom", "Molim", "Hvala"],
    correctAnswer: "Bok",
    hints: ["It's a casual greeting", "Starts with 'B'"],
    order: 2,
    audioUrl: null
  },
  {
    lessonId: 1,
    type: "speaking",
    question: "Say 'Good evening' in Croatian",
    croatianText: "Dobra ve\u010Der",
    englishText: "Good evening",
    correctAnswer: "dobra ve\u010Der",
    hints: ["Remember Croatian pronunciation", "Evening = ve\u010Der"],
    order: 3,
    audioUrl: null,
    options: null
  },
  {
    lessonId: 1,
    type: "word-bank",
    question: "Arrange these words to say 'How are you?' in Croatian",
    croatianText: "Kako ste?",
    englishText: "How are you?",
    options: ["Kako", "ste", "?", "dobro"],
    correctAnswer: "Kako ste?",
    hints: ["Start with 'Kako'", "Formal version uses 'ste'"],
    order: 4,
    audioUrl: null
  },
  {
    lessonId: 1,
    type: "translation",
    question: "Translate 'Thank you' to Croatian",
    croatianText: "Hvala",
    englishText: "Thank you",
    correctAnswer: "hvala",
    hints: ["Starts with 'Hv'", "Very common word"],
    order: 5,
    audioUrl: null,
    options: null
  },
  // Lesson 2: Family
  {
    lessonId: 2,
    type: "translation",
    question: "Translate 'My family' to Croatian",
    croatianText: "Moja obitelj",
    englishText: "My family",
    correctAnswer: "moja obitelj",
    hints: ["Moja = my (feminine)", "Family = obitelj"],
    order: 1,
    audioUrl: null,
    options: null
  },
  {
    lessonId: 2,
    type: "multiple-choice",
    question: "What is 'mother' in Croatian?",
    croatianText: null,
    englishText: "mother",
    options: ["majka", "otac", "sestra", "brat"],
    correctAnswer: "majka",
    hints: ["Sounds similar to 'mama'", "Starts with 'maj'"],
    order: 2,
    audioUrl: null
  },
  {
    lessonId: 2,
    type: "speaking",
    question: "Say 'I have a brother' in Croatian",
    croatianText: "Imam brata",
    englishText: "I have a brother",
    correctAnswer: "imam brata",
    hints: ["Imam = I have", "Brother = brat (but changes to 'brata')"],
    order: 3,
    audioUrl: null,
    options: null
  },
  {
    lessonId: 2,
    type: "translation",
    question: "Translate this Croatian sentence",
    croatianText: "Moj otac radi",
    englishText: "My father works",
    correctAnswer: "my father works",
    hints: ["Moj = my (masculine)", "otac = father", "radi = works"],
    order: 4,
    audioUrl: null,
    options: null
  }
];

// server/services/openai.ts
import OpenAI from "openai";
var openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});
async function generateAILesson(userLevel, completedTopics, preferredExerciseTypes) {
  try {
    const prompt = `Create a Croatian language lesson for a ${userLevel} level 13-year-old American student. 

Previously completed topics: ${completedTopics.join(", ")}
Preferred exercise types: ${preferredExerciseTypes.join(", ")}

Generate a lesson with:
- A creative title and description
- 4-5 exercises of varying types (translation, multiple-choice, word-bank, speaking)
- Croatian phrases appropriate for beginners/intermediate level
- Include everyday vocabulary and practical phrases
- Ensure exercises build on each other progressively

Return the response in JSON format with this structure:
{
  "title": "lesson title",
  "description": "lesson description", 
  "exercises": [
    {
      "type": "translation|multiple-choice|word-bank|speaking",
      "question": "exercise question",
      "croatianText": "Croatian text if applicable",
      "englishText": "English text if applicable", 
      "options": ["option1", "option2", "option3", "option4"] // for multiple choice
      "correctAnswer": "correct answer",
      "hints": ["hint1", "hint2"] // optional
    }
  ]
}`;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert Croatian language teacher creating engaging lessons for American teenagers. Focus on practical, everyday Croatian that builds confidence."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });
    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    throw new Error("Failed to generate AI lesson: " + error.message);
  }
}
async function validateCroatianPronunciation(originalText, spokenText) {
  try {
    const prompt = `Compare the spoken Croatian text with the original and provide pronunciation feedback.

Original Croatian: "${originalText}"
Spoken text (approximation): "${spokenText}"

Evaluate pronunciation accuracy on a scale of 0-100 and provide constructive feedback for a 13-year-old learner. Consider common pronunciation challenges for American English speakers learning Croatian.

Return response in JSON format:
{
  "score": number (0-100),
  "feedback": "encouraging feedback with specific tips",
  "isCorrect": boolean (true if score >= 70)
}`;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a Croatian pronunciation expert providing encouraging feedback to young learners."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });
    const result = JSON.parse(response.choices[0].message.content);
    return {
      score: Math.max(0, Math.min(100, result.score)),
      feedback: result.feedback,
      isCorrect: result.score >= 70
    };
  } catch (error) {
    throw new Error("Failed to validate pronunciation: " + error.message);
  }
}
async function generateHint(exerciseType, question, croatianText, englishText) {
  try {
    const prompt = `Provide a helpful hint for this Croatian language exercise:

Exercise Type: ${exerciseType}
Question: ${question}
${croatianText ? `Croatian text: ${croatianText}` : ""}
${englishText ? `English text: ${englishText}` : ""}

Generate an encouraging hint that guides the student without giving away the answer. Make it age-appropriate for a 13-year-old.`;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a supportive Croatian language tutor providing helpful hints to young learners."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });
    return response.choices[0].message.content || "Try breaking down the sentence word by word!";
  } catch (error) {
    return "Try your best! You can do this!";
  }
}

// server/routes.ts
async function registerRoutes(app2) {
  for (const lesson of baseLessons) {
    await storage.createLesson(lesson);
  }
  for (const exercise of baseExercises) {
    await storage.createExercise(exercise);
  }
  app2.get("/api/user/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });
  app2.post("/api/user/:id/update", async (req, res) => {
    try {
      const updatedUser = await storage.updateUser(req.params.id, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  app2.get("/api/lessons", async (req, res) => {
    try {
      const lessons2 = await storage.getAllLessons();
      res.json(lessons2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get lessons" });
    }
  });
  app2.get("/api/lessons/:id", async (req, res) => {
    try {
      const lesson = await storage.getLesson(parseInt(req.params.id));
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ message: "Failed to get lesson" });
    }
  });
  app2.get("/api/lessons/:id/exercises", async (req, res) => {
    try {
      const exercises2 = await storage.getExercisesByLessonId(parseInt(req.params.id));
      res.json(exercises2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get exercises" });
    }
  });
  app2.post("/api/progress", async (req, res) => {
    try {
      const validatedProgress = insertUserProgressSchema.parse(req.body);
      const progress = await storage.updateProgress(validatedProgress);
      res.json(progress);
    } catch (error) {
      res.status(400).json({ message: "Invalid progress data" });
    }
  });
  app2.get("/api/user/:userId/progress/:lessonId", async (req, res) => {
    try {
      const progress = await storage.getUserProgress(req.params.userId, parseInt(req.params.lessonId));
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to get progress" });
    }
  });
  app2.post("/api/ai-lesson/generate", async (req, res) => {
    try {
      const { userId, userLevel, completedTopics, preferredExerciseTypes } = req.body;
      const aiLessonContent = await generateAILesson(userLevel, completedTopics, preferredExerciseTypes);
      const aiLesson = await storage.createAiLesson({
        userId,
        title: aiLessonContent.title,
        content: aiLessonContent,
        difficulty: userLevel
      });
      res.json(aiLesson);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate AI lesson: " + error.message });
    }
  });
  app2.get("/api/user/:userId/ai-lessons", async (req, res) => {
    try {
      const aiLessons2 = await storage.getUserAiLessons(req.params.userId);
      res.json(aiLessons2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get AI lessons" });
    }
  });
  app2.post("/api/pronunciation/validate", async (req, res) => {
    try {
      const { originalText, spokenText } = req.body;
      const result = await validateCroatianPronunciation(originalText, spokenText);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to validate pronunciation: " + error.message });
    }
  });
  app2.post("/api/hint/generate", async (req, res) => {
    try {
      const { exerciseType, question, croatianText, englishText } = req.body;
      const hint = await generateHint(exerciseType, question, croatianText, englishText);
      res.json({ hint });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate hint" });
    }
  });
  app2.post("/api/lesson/:lessonId/complete", async (req, res) => {
    try {
      const { userId } = req.body;
      const lessonId = parseInt(req.params.lessonId);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      const updatedCompletedLessons = [...user.completedLessons || []];
      if (!updatedCompletedLessons.includes(lessonId)) {
        updatedCompletedLessons.push(lessonId);
      }
      const updatedUser = await storage.updateUser(userId, {
        completedLessons: updatedCompletedLessons,
        xp: user.xp + lesson.xpReward,
        currentLessonId: lessonId + 1
      });
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete lesson" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  base: "./",
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
