'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronRight, ChevronLeft, CheckCircle2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { T, S } from '@/components/playground/pyramid/tokens';
import { simulationApi } from '@/lib/api/simulationApi';
import type { IRiskQuizResult, IRiskScoreResult } from '@/types/simulation';
import { getZoneConfig, fmtScoreFull } from './risk-tokens';

interface Props {
  portfolioScore: number;
  className?: string;
}

// ─── Quiz questions ──────────────────────────────────────────

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is your investment horizon?',
    options: [
      'Less than 1 year',
      '1-3 years',
      '3-5 years',
      '5-10 years',
      'More than 10 years',
    ],
  },
  {
    id: 2,
    question: 'How would you react to a 20% portfolio drop?',
    options: [
      'Sell everything immediately',
      'Sell some holdings to reduce risk',
      'Hold and wait for recovery',
      'Buy a little more at lower prices',
      'Aggressively buy the dip',
    ],
  },
  {
    id: 3,
    question: 'How stable is your primary income source?',
    options: [
      'Very unstable (freelance/gig)',
      'Somewhat unstable',
      'Moderately stable',
      'Stable (salaried)',
      'Very stable (government/tenured)',
    ],
  },
  {
    id: 4,
    question: 'How much investment experience do you have?',
    options: [
      'None (just starting)',
      'Beginner (< 1 year)',
      'Intermediate (1-3 years)',
      'Experienced (3-7 years)',
      'Expert (7+ years)',
    ],
  },
  {
    id: 5,
    question: 'What is your primary investment goal?',
    options: [
      'Capital preservation',
      'Steady income generation',
      'Balanced growth and income',
      'Capital appreciation',
      'Maximum growth (high risk OK)',
    ],
  },
];

// ─── Result screen ───────────────────────────────────────────

function QuizResult({
  result,
  portfolioScore,
  onReset,
}: {
  result: IRiskQuizResult;
  portfolioScore: number;
  onReset: () => void;
}) {
  const zoneConfig = getZoneConfig(result.recommendedZone.name);
  const portfolioZone = getZoneConfig(
    portfolioScore <= 20 ? 'conservative'
      : portfolioScore <= 40 ? 'moderate'
      : portfolioScore <= 60 ? 'balanced'
      : portfolioScore <= 80 ? 'aggressive'
      : 'speculative',
  );
  const diff = portfolioScore - result.totalScore;
  const isAligned = Math.abs(diff) <= 15;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-4 py-2"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <CheckCircle2 className="h-8 w-8 mx-auto" style={{ color: zoneConfig.hex }} />
        <h4 className={cn(T.heading, 'text-white/80')}>Your Risk Profile</h4>
      </div>

      {/* Recommended zone */}
      <div
        className={cn(
          'rounded-lg border p-4 text-center',
          zoneConfig.bg,
          zoneConfig.border,
        )}
      >
        <p className={cn(T.badge, 'uppercase tracking-wider mb-1')} style={{ color: zoneConfig.hex }}>
          Recommended Zone
        </p>
        <p className="text-xl font-bold font-mono" style={{ color: zoneConfig.hex }}>
          {zoneConfig.label}
        </p>
        <p className={cn(T.mono, 'text-white/50 mt-1')}>
          Score: {result.totalScore} (range {result.recommendedRange[0]}-{result.recommendedRange[1]})
        </p>
      </div>

      {/* Portfolio comparison */}
      <div className={cn(S.inner, 'p-3')}>
        <div className="flex items-center justify-between">
          <span className={cn(T.label, 'text-white/50')}>Your Portfolio</span>
          <span className={cn(T.mono)} style={{ color: portfolioZone.hex }}>
            {fmtScoreFull(portfolioScore)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className={cn(T.label, 'text-white/50')}>Recommended</span>
          <span className={cn(T.mono)} style={{ color: zoneConfig.hex }}>
            {fmtScoreFull(result.totalScore)}
          </span>
        </div>
        <div className="mt-2 pt-2 border-t border-white/[0.04]">
          <p className={cn(T.caption, 'text-center')}>
            {isAligned ? (
              <span className="text-emerald-400">
                Your portfolio risk is well-aligned with your profile.
              </span>
            ) : diff > 0 ? (
              <span className="text-amber-400">
                Your portfolio is {Math.abs(Math.round(diff))} points riskier than recommended.
                Consider reducing exposure.
              </span>
            ) : (
              <span className="text-blue-400">
                Your portfolio is {Math.abs(Math.round(diff))} points more conservative than
                your profile. You may have room for growth.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className={cn(T.caption, 'text-center leading-relaxed px-2')}>
        {result.description}
      </p>

      {/* Retake */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-[10px] text-white/40 hover:text-white/70"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Retake Quiz
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Main component ──────────────────────────────────────────

export function RiskMatchQuiz({ portfolioScore, className }: Props) {
  const prefersReduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<IRiskQuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = QUESTIONS[step];
  const totalSteps = QUESTIONS.length;
  const isComplete = step >= totalSteps;

  const handleSelect = useCallback(
    (answerIdx: number) => {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answerIdx }));
    },
    [currentQuestion],
  );

  const handleNext = useCallback(async () => {
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
    } else {
      // Submit quiz
      setSubmitting(true);
      setError(null);
      try {
        const quizAnswers = QUESTIONS.map((q) => ({
          questionId: q.id,
          answer: answers[q.id] ?? 0,
        }));
        const res = await simulationApi.submitRiskQuiz(quizAnswers);
        if (res.success) {
          setResult(res.data);
          setStep(totalSteps);
        } else {
          setError(res.error.message);
        }
      } catch {
        setError('Failed to submit quiz');
      } finally {
        setSubmitting(false);
      }
    }
  }, [step, totalSteps, answers]);

  const handleBack = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  const handleReset = useCallback(() => {
    setStep(0);
    setAnswers({});
    setResult(null);
    setError(null);
  }, []);

  const canProceed = currentQuestion ? answers[currentQuestion.id] != null : false;

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className={cn(T.heading, 'text-white/70 mb-4')}>Risk Tolerance Quiz</h3>

      {/* Progress bar */}
      {!isComplete && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className={cn(T.legend)}>
              Step {step + 1} of {totalSteps}
            </span>
            <span className={cn(T.legend)}>
              {Math.round(((step + (canProceed ? 1 : 0)) / totalSteps) * 100)}%
            </span>
          </div>
          <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-indigo-500/60"
              animate={{ width: `${((step + (canProceed ? 1 : 0)) / totalSteps) * 100}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Quiz content */}
      <AnimatePresence mode="wait">
        {isComplete && result ? (
          <QuizResult
            key="result"
            result={result}
            portfolioScore={portfolioScore}
            onReset={handleReset}
          />
        ) : currentQuestion ? (
          <motion.div
            key={step}
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {/* Question */}
            <p className={cn(T.mono, 'text-white/80 text-sm leading-relaxed')}>
              {currentQuestion.question}
            </p>

            {/* Options */}
            <div className="space-y-2">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = answers[currentQuestion.id] === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(idx)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-lg border transition-all',
                      'text-xs text-white/70',
                      isSelected
                        ? 'border-indigo-500/40 bg-indigo-500/10 text-white/90'
                        : 'border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03] hover:border-white/[0.10]',
                    )}
                  >
                    <span className={cn(T.badge, 'text-white/30 mr-2')}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-red-400 text-center">{error}</p>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={step === 0}
                className="text-[10px] text-white/40 hover:text-white/70"
              >
                <ChevronLeft className="h-3 w-3 mr-0.5" />
                Back
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNext}
                disabled={!canProceed || submitting}
                className="text-[10px] text-white/40 hover:text-white/70"
              >
                {step === totalSteps - 1 ? (
                  submitting ? 'Submitting...' : 'Complete'
                ) : (
                  'Next'
                )}
                {step < totalSteps - 1 && <ChevronRight className="h-3 w-3 ml-0.5" />}
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
