import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { TopHeader } from "@/components/top-header";
import { LessonNode } from "@/components/lesson-node";
import { ExerciseComponent } from "@/components/exercise";
import { CelebrationModal } from "@/components/celebration-modal";
import { DuolingoButton } from "@/components/ui/duolingo-button";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest } from "@/lib/queryClient";
import type { Lesson, Exercise, User } from "@shared/schema";

const CURRENT_USER_ID = "default-user";

export default function Learn() {
  const [currentView, setCurrentView] = useState<'lessonMap' | 'exercise'>('lessonMap');
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const isMobile = useIsMobile();
  
  const queryClient = useQueryClient();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user", CURRENT_USER_ID],
  });

  const { data: lessons = [] } = useQuery<Lesson[]>({
    queryKey: ["/api/lessons"],
  });

  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ["/api/lessons", currentLesson?.id, "exercises"],
    enabled: !!currentLesson,
  });

  const { data: aiLessons = [] } = useQuery({
    queryKey: ["/api/user", CURRENT_USER_ID, "ai-lessons"],
  });

  const completeLessonMutation = useMutation({
    mutationFn: (lessonId: number) =>
      apiRequest("POST", `/api/lesson/${lessonId}/complete`, { userId: CURRENT_USER_ID }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", CURRENT_USER_ID] });
      setShowCelebration(true);
    },
  });

  const generateAILessonMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/ai-lesson/generate", {
        userId: CURRENT_USER_ID,
        userLevel: "intermediate",
        completedTopics: lessons.filter(l => user?.completedLessons?.includes(l.id)).map(l => l.title),
        preferredExerciseTypes: ["translation", "multiple-choice", "speaking"],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", CURRENT_USER_ID, "ai-lessons"] });
    },
  });

  const openLesson = (lesson: Lesson) => {
    if (lesson.isLocked && !user?.completedLessons?.includes(lesson.id - 1)) {
      return; // Don't open locked lessons
    }
    setCurrentLesson(lesson);
    setCurrentExerciseIndex(0);
    setCurrentView('exercise');
  };

  const handleExerciseComplete = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    } else {
      // Lesson complete
      if (currentLesson) {
        completeLessonMutation.mutate(currentLesson.id);
      }
      setCurrentView('lessonMap');
      setCurrentLesson(null);
      setCurrentExerciseIndex(0);
    }
  };

  const handleCelebrationClose = () => {
    setShowCelebration(false);
  };

  const hasCompletedAllLessons = user?.completedLessons?.length === 50;

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-duolingo-gray">
      <Sidebar />
      
      <div className="flex-1 lg:pl-64">
        <TopHeader />
        
        <main className="flex-1 p-4 max-w-7xl mx-auto">
          {currentView === 'lessonMap' ? (
            <div className="space-y-8">
              {/* Progress Banner */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-2xl font-bold text-duolingo-text">CroatianLearn Course</h1>
                  <div className="text-right">
                    <p className="text-sm text-duolingo-text-light">
                      Unit {Math.ceil((user.completedLessons?.length || 0) / 10)} of 5
                    </p>
                    <p className="text-lg font-bold text-duolingo-green">
                      {Math.ceil((user.completedLessons?.length || 0) / 10) === 1 ? 'Form basic sentences' :
                       Math.ceil((user.completedLessons?.length || 0) / 10) === 2 ? 'Navigate familiar places' :
                       Math.ceil((user.completedLessons?.length || 0) / 10) === 3 ? 'Express yourself' :
                       Math.ceil((user.completedLessons?.length || 0) / 10) === 4 ? 'Past and future' :
                       'Advanced topics'}
                    </p>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className="bg-duolingo-green h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${((user.completedLessons?.length || 0) / 50) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-duolingo-text-light">
                  {user.completedLessons?.length || 0} of 50 lessons completed
                </p>
              </div>

              {/* Unit 1: Basic Phrases */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-bold text-duolingo-text">Unit 1</h2>
                  <div className="bg-duolingo-green-light rounded-full px-3 py-1">
                    <span className="text-white text-sm font-semibold">Form basic sentences</span>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-1 lesson-path-line h-full"></div>
                  
                  <div className="space-y-12">
                    {lessons.slice(0, 10).map((lesson, index) => (
                      <LessonNode
                        key={lesson.id}
                        lesson={lesson}
                        isCompleted={user.completedLessons?.includes(lesson.id) || false}
                        isCurrent={user.currentLessonId === lesson.id}
                        isLocked={lesson.isLocked && !user.completedLessons?.includes(lesson.id - 1) && lesson.id !== 1}
                        position={index % 3 === 0 ? 'center' : index % 3 === 1 ? 'left' : 'right'}
                        onClick={() => openLesson(lesson)}
                        stars={user.completedLessons?.includes(lesson.id) ? 3 : 0}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Additional Units */}
              {lessons.length > 10 && (
                <div className="space-y-6 opacity-50">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-bold text-gray-500">Unit 2</h2>
                    <div className="bg-gray-300 rounded-full px-3 py-1">
                      <span className="text-gray-600 text-sm font-semibold">Navigate familiar places</span>
                    </div>
                  </div>
                  
                  <div className="space-y-12">
                    {lessons.slice(10, 20).map((lesson, index) => (
                      <LessonNode
                        key={lesson.id}
                        lesson={lesson}
                        isCompleted={false}
                        isCurrent={false}
                        isLocked={true}
                        position={index % 3 === 0 ? 'center' : index % 3 === 1 ? 'left' : 'right'}
                        onClick={() => {}}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* AI Lessons Section */}
              {hasCompletedAllLessons && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h2 className="text-xl font-bold text-duolingo-text">AI-Powered Lessons</h2>
                      <div className="bg-purple-500 rounded-full px-3 py-1">
                        <span className="text-white text-sm font-semibold">Unlimited Practice</span>
                      </div>
                    </div>
                    <DuolingoButton
                      onClick={() => generateAILessonMutation.mutate()}
                      disabled={generateAILessonMutation.isPending}
                      variant="primary"
                    >
                      {generateAILessonMutation.isPending ? 'Generating...' : 'Generate New Lesson'}
                    </DuolingoButton>
                  </div>

                  {aiLessons.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {aiLessons.map((aiLesson) => (
                        <div key={aiLesson.id} className="bg-white rounded-xl p-4 shadow-lg">
                          <h3 className="font-bold text-duolingo-text mb-2">{aiLesson.title}</h3>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-duolingo-text-light capitalize">
                              {aiLesson.difficulty}
                            </span>
                            <Button variant="outline" size="sm">
                              Start
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Exercise View
            currentLesson && exercises.length > 0 && (
              <ExerciseComponent
                exercise={exercises[currentExerciseIndex]}
                exerciseIndex={currentExerciseIndex}
                totalExercises={exercises.length}
                onComplete={handleExerciseComplete}
                onClose={() => {
                  setCurrentView('lessonMap');
                  setCurrentLesson(null);
                  setCurrentExerciseIndex(0);
                }}
                user={user}
              />
            )
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40">
          <div className="flex justify-around">
            <button className="flex flex-col items-center py-2 px-4 text-duolingo-green">
              <span className="text-xs font-semibold">Learn</span>
            </button>
            <button className="flex flex-col items-center py-2 px-4 text-duolingo-text-light">
              <span className="text-xs font-semibold">Leagues</span>
            </button>
            <button className="flex flex-col items-center py-2 px-4 text-duolingo-text-light">
              <span className="text-xs font-semibold">Quests</span>
            </button>
            <button className="flex flex-col items-center py-2 px-4 text-duolingo-text-light">
              <span className="text-xs font-semibold">Shop</span>
            </button>
            <button className="flex flex-col items-center py-2 px-4 text-duolingo-text-light">
              <span className="text-xs font-semibold">Profile</span>
            </button>
          </div>
        </div>
      )}

      {/* Celebration Modal */}
      <CelebrationModal
        isOpen={showCelebration}
        onClose={handleCelebrationClose}
        xpEarned={currentLesson?.xpReward || 10}
        totalXP={user.xp}
      />
    </div>
  );
}
