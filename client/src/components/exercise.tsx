import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Volume2 } from "lucide-react";
import { DuolingoButton } from "./ui/duolingo-button";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useSpeech } from "@/hooks/use-speech";
import { useAudio } from "@/hooks/use-audio";
import type { Exercise, User } from "@shared/schema";

interface ExerciseProps {
  exercise: Exercise;
  exerciseIndex: number;
  totalExercises: number;
  onComplete: () => void;
  onClose: () => void;
  user: User;
}

export function ExerciseComponent({ 
  exercise, 
  exerciseIndex, 
  totalExercises, 
  onComplete, 
  onClose, 
  user 
}: ExerciseProps) {
  const [answer, setAnswer] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'incorrect' | null; message?: string }>({ type: null });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const queryClient = useQueryClient();
  const { startListening, stopListening, isListening, transcript } = useSpeech();
  const { playAudio } = useAudio();

  const progress = ((exerciseIndex + 1) / totalExercises) * 100;

  const updateUserMutation = useMutation({
    mutationFn: (updates: Partial<User>) => 
      apiRequest("POST", `/api/user/${user.id}/update`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", user.id] });
    },
  });

  const generateHintMutation = useMutation({
    mutationFn: () => 
      apiRequest("POST", "/api/hint/generate", {
        exerciseType: exercise.type,
        question: exercise.question,
        croatianText: exercise.croatianText,
        englishText: exercise.englishText,
      }),
  });

  const validatePronunciationMutation = useMutation({
    mutationFn: (spokenText: string) =>
      apiRequest("POST", "/api/pronunciation/validate", {
        originalText: exercise.croatianText,
        spokenText,
      }),
  });

  const handleSubmit = async () => {
    if (isSubmitted) {
      if (feedback.type === 'correct') {
        onComplete();
      } else {
        // Reset for another attempt
        setIsSubmitted(false);
        setFeedback({ type: null });
        setAnswer("");
        setSelectedOptions([]);
      }
      return;
    }

    let userAnswer = "";
    if (exercise.type === 'word-bank') {
      userAnswer = selectedOptions.join(' ');
    } else if (exercise.type === 'speaking') {
      userAnswer = transcript;
    } else {
      userAnswer = answer;
    }

    const isCorrect = userAnswer.toLowerCase().trim() === exercise.correctAnswer.toLowerCase().trim();

    if (isCorrect) {
      setFeedback({ type: 'correct', message: `Correct! +${10} XP` });
      // Award XP
      await updateUserMutation.mutateAsync({ xp: user.xp + 10 });
    } else {
      setFeedback({ 
        type: 'incorrect', 
        message: `Correct answer: ${exercise.correctAnswer}` 
      });
      // Lose a heart
      if (user.hearts > 0) {
        await updateUserMutation.mutateAsync({ hearts: user.hearts - 1 });
      }
    }

    setIsSubmitted(true);
  };

  const handleWordBankSelect = (word: string) => {
    if (selectedOptions.includes(word)) {
      setSelectedOptions(selectedOptions.filter(w => w !== word));
    } else {
      setSelectedOptions([...selectedOptions, word]);
    }
  };

  const handleMultipleChoice = (option: string) => {
    setAnswer(option);
  };

  const handlePlayAudio = () => {
    if (exercise.croatianText) {
      playAudio(exercise.croatianText);
    }
  };

  const handleSpeechRecognition = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleShowHint = async () => {
    if (!showHint) {
      await generateHintMutation.mutateAsync();
      setShowHint(true);
    } else {
      setShowHint(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Exercise Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="w-6 h-6 text-duolingo-text-light" />
        </Button>
        
        {/* Progress Bar */}
        <div className="flex-1 mx-4">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-duolingo-green h-3 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        {/* Hearts Display */}
        <div className="flex space-x-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`text-xl ${i < user.hearts ? 'text-duolingo-red' : 'text-gray-300'}`}>
              {i < user.hearts ? '❤️' : '🤍'}
            </span>
          ))}
        </div>
      </div>

      {/* Exercise Content */}
      <div className="bg-white rounded-2xl p-8 shadow-lg min-h-96">
        <div className="text-center space-y-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-duolingo-text mb-2">{exercise.question}</h2>
            
            {exercise.croatianText && (
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">🇭🇷</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handlePlayAudio}>
                  <Volume2 className="w-8 h-8 text-duolingo-blue" />
                </Button>
              </div>
            )}
            
            {exercise.croatianText && (
              <p className="text-3xl font-semibold text-duolingo-text mb-6">
                {exercise.croatianText}
              </p>
            )}
          </div>

          {/* Exercise Type Specific Content */}
          <div className="space-y-4">
            {exercise.type === 'translation' && (
              <Input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type in English..."
                className="w-full p-4 border-2 border-gray-200 rounded-xl text-lg focus:border-duolingo-green"
                disabled={isSubmitted}
              />
            )}

            {exercise.type === 'multiple-choice' && exercise.options && (
              <div className="space-y-3">
                {exercise.options.map((option, index) => (
                  <Button
                    key={index}
                    variant={answer === option ? "default" : "outline"}
                    className={`w-full p-4 text-lg rounded-xl ${
                      answer === option 
                        ? 'bg-duolingo-green text-white' 
                        : 'bg-gray-100 hover:bg-duolingo-green hover:text-white'
                    }`}
                    onClick={() => handleMultipleChoice(option)}
                    disabled={isSubmitted}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            )}

            {exercise.type === 'word-bank' && exercise.options && (
              <div>
                <div className="min-h-16 p-4 border-2 border-gray-200 rounded-xl mb-4 flex flex-wrap gap-2">
                  {selectedOptions.map((word, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleWordBankSelect(word)}
                      className="bg-duolingo-green text-white"
                      disabled={isSubmitted}
                    >
                      {word}
                    </Button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 justify-center">
                  {exercise.options
                    .filter(word => !selectedOptions.includes(word))
                    .map((word, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        onClick={() => handleWordBankSelect(word)}
                        className="bg-gray-100 hover:bg-duolingo-green hover:text-white border-2 border-gray-200"
                        disabled={isSubmitted}
                      >
                        {word}
                      </Button>
                    ))}
                </div>
              </div>
            )}

            {exercise.type === 'speaking' && (
              <div className="space-y-4">
                <DuolingoButton
                  variant={isListening ? 'danger' : 'primary'}
                  size="lg"
                  onClick={handleSpeechRecognition}
                  disabled={isSubmitted}
                >
                  {isListening ? 'Stop Recording' : 'Start Speaking'}
                </DuolingoButton>
                {transcript && (
                  <p className="text-lg text-duolingo-text bg-gray-100 p-4 rounded-xl">
                    "{transcript}"
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Hint Button */}
          {exercise.hints && exercise.hints.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowHint}
              className="text-duolingo-blue hover:text-duolingo-blue"
              disabled={generateHintMutation.isPending}
            >
              {generateHintMutation.isPending ? 'Loading hint...' : showHint ? 'Hide Hint' : 'Show Hint'}
            </Button>
          )}

          {/* Hint Display */}
          {showHint && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-duolingo-blue">
                {generateHintMutation.data?.hint || exercise.hints?.[0] || "No hint available"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Check Button */}
      <div className="mt-6 flex justify-center">
        <DuolingoButton
          size="lg"
          onClick={handleSubmit}
          disabled={
            (!answer && !selectedOptions.length && !transcript) || 
            updateUserMutation.isPending
          }
        >
          {isSubmitted ? (feedback.type === 'correct' ? 'CONTINUE' : 'TRY AGAIN') : 'CHECK'}
        </DuolingoButton>
      </div>

      {/* Feedback Area */}
      {feedback.type && (
        <div className="mt-6 p-4 rounded-xl">
          {feedback.type === 'correct' ? (
            <div className="bg-green-100 border-l-4 border-duolingo-green p-4 rounded">
              <div className="flex items-center">
                <Check className="w-6 h-6 text-duolingo-green mr-2" />
                <span className="font-semibold text-duolingo-green">{feedback.message}</span>
              </div>
            </div>
          ) : (
            <div className="bg-red-100 border-l-4 border-duolingo-red p-4 rounded">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <X className="w-6 h-6 text-duolingo-red mr-2" />
                  <div>
                    <span className="font-semibold text-duolingo-red">Correct answer:</span>
                    <p className="text-duolingo-text">{exercise.correctAnswer}</p>
                  </div>
                </div>
                <span className="text-duolingo-red">-1 ❤️</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
