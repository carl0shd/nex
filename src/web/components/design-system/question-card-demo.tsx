import { useState } from "react";
import { QuestionCard, type Question } from "@/components/task/question-card";

const LOGOUT: Question = {
  question: "Where should logout go when next is missing?",
  options: [
    { value: "home", label: "Home", hint: "Same as login today · recommended" },
    { value: "login", label: "Login page", hint: "Ask them to sign in again" },
    { value: "previous", label: "Previous page", hint: "Uses the referrer when it is ours" },
  ],
};

const TESTS: Question = {
  question: "Which cases should the tests cover?",
  multiple: true,
  options: [
    { value: "double", label: "Two slashes", hint: "//evil.com" },
    { value: "absolute", label: "Absolute urls" },
    { value: "missing", label: "Missing next" },
  ],
};

export function QuestionCardDemo({ multiple = false }: { multiple?: boolean }) {
  const questions = multiple ? [LOGOUT, TESTS] : [LOGOUT];
  const [answers, setAnswers] = useState<string[][]>([["home"]]);
  return (
    <QuestionCard
      questions={questions}
      answers={answers}
      onChange={(index, values) =>
        setAnswers((current) => {
          const next = [...current];
          next[index] = values;
          return next;
        })
      }
    />
  );
}
