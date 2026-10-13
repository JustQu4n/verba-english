"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { useCredits } from "@/components/dashboard/credits-context";
import { DEFAULT_GRADING_MODE, type GradingMode } from "@/modules/writing/domain/grading-mode";
import { normalizeAnswer } from "@/modules/writing/domain/sentence-answer";
import type { Category, Level, SentencePrompt } from "@/modules/writing/domain/sentence-catalog";
import type { SentenceProgress } from "@/modules/writing/domain/sentence-progress";

import { gradeAnswer, nextSentence, sentenceProgress, type NextSentenceResult } from "./actions";
import { hasPassed, type FeedbackState } from "./feedback-state";
import { SentenceDone } from "./sentence-done";
import { SentencePractice } from "./sentence-practice";
import { SentenceSetup } from "./sentence-setup";

type FailureReason = Extract<NextSentenceResult, { status: "error" }>["reason"];

const IDLE: FeedbackState = { status: "idle" };

/** Owns the whole flow: choose level and category, then practise sentence after sentence until each one is right. */
export function SentenceWriting() {
  const [level, setLevel] = useState<Level | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [prompt, setPrompt] = useState<SentencePrompt | null>(null);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [answer, setAnswer] = useState("");
  const [hintOpen, setHintOpen] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(IDLE);
  // Kept across sentences: it is a preference, not part of one answer.
  const [mode, setMode] = useState<GradingMode>(DEFAULT_GRADING_MODE);
  const { credits, setCredits, setPoints } = useCredits();
  const [progress, setProgress] = useState<SentenceProgress | null>(null);
  const [allDone, setAllDone] = useState(false);
  // Fireworks only when the pair was finished in this visit, not when the learner returns to a finished pair.
  const [celebrate, setCelebrate] = useState(false);
  const completedNow = useRef(false);
  // Progress shown on the choose screen, tagged with the pair it belongs to so a stale answer is never shown.
  const [setupProgress, setSetupProgress] = useState<{ key: string; progress: SentenceProgress } | null>(null);
  const [error, setError] = useState<FailureReason | null>(null);
  const [pending, startTransition] = useTransition();
  // A grade that arrives after the learner left the sentence must not show up on the next one.
  const currentPromptId = useRef<string | null>(null);

  function resetSentence() {
    setAnswer("");
    setHintOpen(false);
    setFeedback(IDLE);
  }

  function loadSentence(seen: string[]) {
    if (!level || !category) return;
    setError(null);
    startTransition(async () => {
      const result = await nextSentence({ level, category, seenIds: seen });
      if (result.status === "error") return setError(result.reason);
      setProgress(result.progress);
      if (!result.prompt) {
        currentPromptId.current = null;
        setPrompt(null);
        setAllDone(true);
        setCelebrate(completedNow.current);
        completedNow.current = false;
        return;
      }
      currentPromptId.current = result.prompt.id;
      setPrompt(result.prompt);
      setSeenIds([...seen, result.prompt.id]);
      resetSentence();
    });
  }

  function quit() {
    currentPromptId.current = null;
    setPrompt(null);
    setSeenIds([]);
    setAllDone(false);
    setCelebrate(false);
    completedNow.current = false;
    setProgress(null);
    resetSentence();
    setError(null);
  }

  function submit() {
    if (!prompt) return;
    const promptId = prompt.id;
    setFeedback({ status: "grading" });
    startTransition(async () => {
      const result = await gradeAnswer({ promptId, answer, mode });
      if (currentPromptId.current !== promptId) return;
      if (result.status === "error") return setFeedback({ status: "error", reason: result.reason, mode });
      setCredits(result.credits);
      if (result.progress) setProgress(result.progress);
      if (result.points) {
        setPoints(result.points.total);
        completedNow.current = true;
      }
      setFeedback({ status: "graded", grade: result.grade, answer: normalizeAnswer(answer), earned: result.points?.earned ?? 0, mode, source: result.source });
    });
  }

  // On the choose screen, look up how far the learner is in the chosen pair.
  const pairKey = level && category && !prompt && !allDone ? `${level}/${category}` : null;
  useEffect(() => {
    if (!pairKey || !level || !category) return;
    let cancelled = false;
    void sentenceProgress({ level, category }).then((result) => {
      if (!cancelled && result.status === "ok") setSetupProgress({ key: pairKey, progress: result.progress });
    });
    return () => {
      cancelled = true;
    };
  }, [pairKey, level, category]);

  if (allDone && level && category && progress) {
    return <SentenceDone level={level} category={category} progress={progress} celebrate={celebrate} onBack={quit} />;
  }

  if (prompt && level && category) {
    return (
      <SentencePractice
        prompt={prompt}
        level={level}
        category={category}
        progress={progress}
        answer={answer}
        onAnswerChange={setAnswer}
        hintOpen={hintOpen}
        onToggleHint={() => setHintOpen((open) => !open)}
        feedback={feedback}
        passed={hasPassed(feedback, answer)}
        credits={credits}
        mode={mode}
        onModeChange={setMode}
        onSubmit={submit}
        onSkip={() => loadSentence(seenIds)}
        onNext={() => loadSentence(seenIds)}
        onQuit={quit}
        loading={pending && feedback.status !== "grading"}
        error={error}
      />
    );
  }

  return (
    <SentenceSetup
      level={level}
      category={category}
      onLevelChange={setLevel}
      onCategoryChange={setCategory}
      onStart={() => loadSentence([])}
      starting={pending}
      progress={setupProgress && setupProgress.key === pairKey ? setupProgress.progress : null}
      error={error}
    />
  );
}
