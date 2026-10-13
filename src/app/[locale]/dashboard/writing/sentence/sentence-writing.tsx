"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { useCredits } from "@/components/dashboard/credits-context";
import { DEFAULT_GRADING_MODE, type GradingMode } from "@/modules/writing/domain/grading-mode";
import { normalizeAnswer } from "@/modules/writing/domain/sentence-answer";
import type { Category, Level, SentencePrompt } from "@/modules/writing/domain/sentence-catalog";
import type { LevelProgress } from "@/modules/writing/application/get-level-progress";
import type { SentenceProgress } from "@/modules/writing/domain/sentence-progress";

import { gradeAnswer, levelProgress, nextSentence, type NextSentenceResult } from "./actions";
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
  // Sentences shown so far in this visit and the one on screen, so the learner can step back and forward.
  const [history, setHistory] = useState<SentencePrompt[]>([]);
  const [position, setPosition] = useState(0);
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
  // Progress of every category shown on the choose screen, tagged with its level so a stale answer is never shown.
  const [setupProgress, setSetupProgress] = useState<{ level: Level; progress: LevelProgress } | null>(null);
  const [error, setError] = useState<FailureReason | null>(null);
  const [pending, startTransition] = useTransition();
  // A grade that arrives after the learner left the sentence must not show up on the next one.
  const currentPromptId = useRef<string | null>(null);

  function resetSentence() {
    setAnswer("");
    setHintOpen(false);
    setFeedback(IDLE);
  }

  function finish(done: SentenceProgress) {
    currentPromptId.current = null;
    setPrompt(null);
    setProgress(done);
    setAllDone(true);
    setCelebrate(completedNow.current);
    completedNow.current = false;
  }

  function loadSentence(seen: string[]) {
    if (!level || !category) return;
    setError(null);
    startTransition(async () => {
      const result = await nextSentence({ level, category, seenIds: seen });
      if (result.status === "error") return setError(result.reason);
      setProgress(result.progress);
      if (!result.prompt) return finish(result.progress);
      const next = result.prompt;
      currentPromptId.current = next.id;
      setPrompt(next);
      setHistory((previous) => [...previous.slice(0, seen.length), next]);
      setPosition(seen.length);
      resetSentence();
    });
  }

  function showFromHistory(index: number) {
    const target = history[index];
    if (!target) return;
    setError(null);
    currentPromptId.current = target.id;
    setPrompt(target);
    setPosition(index);
    resetSentence();
  }

  function goBack() {
    if (position > 0) showFromHistory(position - 1);
  }

  /** Forward through sentences already seen, then on to a new one. */
  function goNext() {
    if (position < history.length - 1) showFromHistory(position + 1);
    else loadSentence(history.map((item) => item.id));
  }

  function quit() {
    currentPromptId.current = null;
    setPrompt(null);
    setHistory([]);
    setPosition(0);
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
        // The last sentence of the pair: go straight to the finish page, no extra click.
        if (result.progress && result.progress.total > 0 && result.progress.completed >= result.progress.total) {
          return finish(result.progress);
        }
      }
      setFeedback({ status: "graded", grade: result.grade, answer: normalizeAnswer(answer), earned: result.points?.earned ?? 0, mode, source: result.source });
    });
  }

  // On the choose screen, look up how far the learner is in each category of the chosen level.
  const setupLevel = level && !prompt && !allDone ? level : null;
  useEffect(() => {
    if (!setupLevel) return;
    let cancelled = false;
    void levelProgress({ level: setupLevel }).then((result) => {
      if (!cancelled && result.status === "ok") setSetupProgress({ level: setupLevel, progress: result.progress });
    });
    return () => {
      cancelled = true;
    };
  }, [setupLevel]);

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
        canGoBack={position > 0}
        onBack={goBack}
        onNext={goNext}
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
      progress={setupProgress && setupProgress.level === level ? setupProgress.progress : null}
      error={error}
    />
  );
}
