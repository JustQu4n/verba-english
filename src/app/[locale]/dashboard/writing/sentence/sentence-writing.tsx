"use client";

import { useState, useTransition } from "react";

import type { Category, Level, SentencePrompt } from "@/modules/writing/domain/sentence-catalog";

import { nextSentence, type NextSentenceResult } from "./actions";
import { SentencePractice } from "./sentence-practice";
import { SentenceSetup } from "./sentence-setup";

type FailureReason = Extract<NextSentenceResult, { status: "error" }>["reason"];

/** Owns the whole flow: choose level and category, then practise sentence after sentence. */
export function SentenceWriting() {
  const [level, setLevel] = useState<Level | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [prompt, setPrompt] = useState<SentencePrompt | null>(null);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [answer, setAnswer] = useState("");
  const [hintOpen, setHintOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<FailureReason | null>(null);
  const [pending, startTransition] = useTransition();

  function loadSentence(seen: string[]) {
    if (!level || !category) return;
    setError(null);
    startTransition(async () => {
      const result = await nextSentence({ level, category, seenIds: seen });
      if (result.status === "error") return setError(result.reason);
      setPrompt(result.prompt);
      setSeenIds([...seen, result.prompt.id]);
      setAnswer("");
      setHintOpen(false);
      setSubmitted(false);
    });
  }

  function quit() {
    setPrompt(null);
    setSeenIds([]);
    setAnswer("");
    setHintOpen(false);
    setSubmitted(false);
    setError(null);
  }

  if (prompt && level && category) {
    return (
      <SentencePractice
        prompt={prompt}
        level={level}
        category={category}
        position={seenIds.length}
        answer={answer}
        onAnswerChange={setAnswer}
        hintOpen={hintOpen}
        onToggleHint={() => setHintOpen((open) => !open)}
        submitted={submitted}
        onSubmit={() => setSubmitted(true)}
        onSkip={() => loadSentence(seenIds)}
        onNext={() => loadSentence(seenIds)}
        onQuit={quit}
        loading={pending}
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
      error={error}
    />
  );
}
