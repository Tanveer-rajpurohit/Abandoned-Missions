import type { Metadata } from "next";
import { QuizGame } from "@/components/quiz/QuizGame";
import { QUIZ } from "@/data/quiz";

export const metadata: Metadata = {
  title: "Quiz: how well do you know the machines?",
  description: `${QUIZ.length} questions and "Who am I?" riddles about the machines NASA left on the Moon, on Mars and in deep space. Every answer is in their stories.`,
};

export default function QuizPage() {
  return (
    <main id="main" className="min-h-svh bg-[var(--paper)]">
      <QuizGame />
    </main>
  );
}
