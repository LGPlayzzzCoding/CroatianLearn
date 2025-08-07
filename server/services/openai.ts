import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface AIExercise {
  type: 'translation' | 'multiple-choice' | 'listening' | 'speaking' | 'word-bank';
  question: string;
  croatianText?: string;
  englishText?: string;
  options?: string[];
  correctAnswer: string;
  hints?: string[];
}

export interface AILessonContent {
  title: string;
  description: string;
  exercises: AIExercise[];
}

export async function generateAILesson(
  userLevel: string,
  completedTopics: string[],
  preferredExerciseTypes: string[]
): Promise<AILessonContent> {
  try {
    const prompt = `Create a Croatian language lesson for a ${userLevel} level 13-year-old American student. 

Previously completed topics: ${completedTopics.join(', ')}
Preferred exercise types: ${preferredExerciseTypes.join(', ')}

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
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content!);
    return result as AILessonContent;
  } catch (error) {
    throw new Error("Failed to generate AI lesson: " + (error as Error).message);
  }
}

export async function validateCroatianPronunciation(
  originalText: string,
  spokenText: string
): Promise<{ score: number; feedback: string; isCorrect: boolean }> {
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
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content!);
    return {
      score: Math.max(0, Math.min(100, result.score)),
      feedback: result.feedback,
      isCorrect: result.score >= 70
    };
  } catch (error) {
    throw new Error("Failed to validate pronunciation: " + (error as Error).message);
  }
}

export async function generateHint(
  exerciseType: string,
  question: string,
  croatianText?: string,
  englishText?: string
): Promise<string> {
  try {
    const prompt = `Provide a helpful hint for this Croatian language exercise:

Exercise Type: ${exerciseType}
Question: ${question}
${croatianText ? `Croatian text: ${croatianText}` : ''}
${englishText ? `English text: ${englishText}` : ''}

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
      ],
    });

    return response.choices[0].message.content || "Try breaking down the sentence word by word!";
  } catch (error) {
    return "Try your best! You can do this!";
  }
}
