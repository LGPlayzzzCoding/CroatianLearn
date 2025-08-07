import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserProgressSchema } from "@shared/schema";
import { baseLessons, baseExercises } from "./data/lessons";
import { generateAILesson, validateCroatianPronunciation, generateHint } from "./services/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Initialize base lessons and exercises in storage
  for (const lesson of baseLessons) {
    await storage.createLesson(lesson);
  }
  
  for (const exercise of baseExercises) {
    await storage.createExercise(exercise);
  }

  // User routes
  app.get("/api/user/:id", async (req, res) => {
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

  app.post("/api/user/:id/update", async (req, res) => {
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

  // Lesson routes
  app.get("/api/lessons", async (req, res) => {
    try {
      const lessons = await storage.getAllLessons();
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ message: "Failed to get lessons" });
    }
  });

  app.get("/api/lessons/:id", async (req, res) => {
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

  app.get("/api/lessons/:id/exercises", async (req, res) => {
    try {
      const exercises = await storage.getExercisesByLessonId(parseInt(req.params.id));
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ message: "Failed to get exercises" });
    }
  });

  // Progress routes
  app.post("/api/progress", async (req, res) => {
    try {
      const validatedProgress = insertUserProgressSchema.parse(req.body);
      const progress = await storage.updateProgress(validatedProgress);
      res.json(progress);
    } catch (error) {
      res.status(400).json({ message: "Invalid progress data" });
    }
  });

  app.get("/api/user/:userId/progress/:lessonId", async (req, res) => {
    try {
      const progress = await storage.getUserProgress(req.params.userId, parseInt(req.params.lessonId));
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to get progress" });
    }
  });

  // AI Lesson routes
  app.post("/api/ai-lesson/generate", async (req, res) => {
    try {
      const { userId, userLevel, completedTopics, preferredExerciseTypes } = req.body;
      
      const aiLessonContent = await generateAILesson(userLevel, completedTopics, preferredExerciseTypes);
      
      const aiLesson = await storage.createAiLesson({
        userId,
        title: aiLessonContent.title,
        content: aiLessonContent,
        difficulty: userLevel,
      });
      
      res.json(aiLesson);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate AI lesson: " + (error as Error).message });
    }
  });

  app.get("/api/user/:userId/ai-lessons", async (req, res) => {
    try {
      const aiLessons = await storage.getUserAiLessons(req.params.userId);
      res.json(aiLessons);
    } catch (error) {
      res.status(500).json({ message: "Failed to get AI lessons" });
    }
  });

  // Pronunciation validation
  app.post("/api/pronunciation/validate", async (req, res) => {
    try {
      const { originalText, spokenText } = req.body;
      const result = await validateCroatianPronunciation(originalText, spokenText);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to validate pronunciation: " + (error as Error).message });
    }
  });

  // Hint generation
  app.post("/api/hint/generate", async (req, res) => {
    try {
      const { exerciseType, question, croatianText, englishText } = req.body;
      const hint = await generateHint(exerciseType, question, croatianText, englishText);
      res.json({ hint });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate hint" });
    }
  });

  // Complete lesson
  app.post("/api/lesson/:lessonId/complete", async (req, res) => {
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

      // Update user progress
      const updatedCompletedLessons = [...(user.completedLessons || [])];
      if (!updatedCompletedLessons.includes(lessonId)) {
        updatedCompletedLessons.push(lessonId);
      }

      const updatedUser = await storage.updateUser(userId, {
        completedLessons: updatedCompletedLessons,
        xp: user.xp + lesson.xpReward,
        currentLessonId: lessonId + 1,
      });

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete lesson" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
