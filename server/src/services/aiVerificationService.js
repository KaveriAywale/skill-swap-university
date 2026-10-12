'use strict';

const env = require('../config/env');

/**
 * AI skill-assessment service abstraction.
 *
 * - When AI_PROVIDER=openai AND OPENAI_API_KEY is set, real AI assessment is
 *   used (question generation + grading).
 * - Otherwise a transparent, deterministic DEMO assessment runs. Demo results
 *   are always labelled `mode: 'demo'` so the UI can distinguish them, and the
 *   wording makes clear this is an assessment-based indicator, not proof of
 *   real-world expertise.
 */

const DEMO_BANK = {
  default: [
    {
      id: 'q1',
      prompt: 'Explain the core concept of {skill} in your own words.',
      hint: 'Aim for 2-4 sentences with a concrete example.',
    },
    {
      id: 'q2',
      prompt: 'Describe a real problem you solved using {skill} and the steps you took.',
      hint: 'Mention tools, decisions, and the outcome.',
    },
    {
      id: 'q3',
      prompt: 'What are two common mistakes beginners make with {skill}, and how do you avoid them?',
      hint: 'Demonstrate practical awareness.',
    },
  ],
};

function buildDemoQuestions(skillName) {
  return DEMO_BANK.default.map((q) => ({
    ...q,
    prompt: q.prompt.replace('{skill}', skillName),
  }));
}

async function openaiChat(messages, { temperature = 0.4 } = {}) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: env.openaiModel,
      messages,
      temperature,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`AI provider error (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  return JSON.parse(content);
}

async function generateQuestions(skillName) {
  if (!env.aiEnabled) {
    return { mode: 'demo', provider: 'demo', questions: buildDemoQuestions(skillName) };
  }

  try {
    const parsed = await openaiChat([
      {
        role: 'system',
        content:
          'You are a supportive university peer-mentor assessor. Respond ONLY with JSON: {"questions":[{"id":"q1","prompt":"...","hint":"..."}]}. Provide exactly 3 short, practical questions.',
      },
      { role: 'user', content: `Create a short skill assessment for the skill: ${skillName}.` },
    ]);
    const questions = Array.isArray(parsed.questions) && parsed.questions.length
      ? parsed.questions.slice(0, 3)
      : buildDemoQuestions(skillName);
    return { mode: 'ai', provider: 'openai', questions };
  } catch {
    return {
      mode: 'demo',
      provider: 'demo (AI unavailable, fell back)',
      questions: buildDemoQuestions(skillName),
    };
  }
}

function heuristicScore(answer) {
  const text = String(answer || '').trim();
  if (!text) return { score: 0, feedback: 'No answer was provided.' };
  const words = text.split(/\s+/).filter(Boolean).length;
  let score = 0;
  if (words >= 15) score += 40;
  else if (words >= 8) score += 25;
  else if (words >= 3) score += 12;

  if (/[.!?]/.test(text)) score += 15;
  if (/\b(for example|because|such as|when|then|first|next|finally)\b/i.test(text)) score += 20;
  if (words >= 40) score += 15;
  score = Math.min(100, score);

  const feedback =
    score >= 70
      ? 'Clear, specific and well-structured answer.'
      : score >= 40
      ? 'Reasonable answer. Add a concrete example to strengthen it.'
      : 'Answer is too brief. Expand with detail and an example.';
  return { score, feedback };
}

async function evaluate(skillName, questions, answers) {
  const answerMap = new Map((answers || []).map((a) => [a.questionId, a.response]));

  if (!env.aiEnabled) {
    const graded = questions.map((q) => {
      const { score, feedback } = heuristicScore(answerMap.get(q.id));
      return { questionId: q.id, response: answerMap.get(q.id) || '', score, feedback };
    });
    const score = Math.round(graded.reduce((sum, g) => sum + g.score, 0) / (graded.length || 1));
    return {
      mode: 'demo',
      provider: 'demo',
      score,
      passed: score >= env.aiPassThreshold,
      answers: graded,
      summary:
        'Demo assessment score. This is an assessment-based indicator generated locally and does not definitively prove real-world expertise.',
    };
  }

  try {
    const parsed = await openaiChat([
      {
        role: 'system',
        content:
          'You assess peer-mentor skill answers fairly. Respond ONLY with JSON: {"scores":[{"questionId":"q1","score":0-100,"feedback":"..."}],"summary":"..."}. Be encouraging but honest.',
      },
      {
        role: 'user',
        content: JSON.stringify({ skill: skillName, questions, answers: answers || [] }),
      },
    ]);

    const scores = Array.isArray(parsed.scores) ? parsed.scores : [];
    const graded = questions.map((q) => {
      const found = scores.find((s) => s.questionId === q.id) || {};
      return {
        questionId: q.id,
        response: answerMap.get(q.id) || '',
        score: Math.max(0, Math.min(100, Number(found.score) || 0)),
        feedback: found.feedback || '',
      };
    });
    const score = Math.round(graded.reduce((sum, g) => sum + g.score, 0) / (graded.length || 1));
    return {
      mode: 'ai',
      provider: 'openai',
      score,
      passed: score >= env.aiPassThreshold,
      answers: graded,
      summary:
        parsed.summary ||
        'AI-assisted assessment completed. This is an assessment-based indicator, not a certification of real-world expertise.',
    };
  } catch {
    return demoEvaluate(questions, answerMap);
  }
}

async function demoEvaluate(questions, answerMap) {
  const graded = questions.map((q) => {
    const { score, feedback } = heuristicScore(answerMap.get(q.id));
    return { questionId: q.id, response: answerMap.get(q.id) || '', score, feedback };
  });
  const score = Math.round(graded.reduce((sum, g) => sum + g.score, 0) / (graded.length || 1));
  return {
    mode: 'demo',
    provider: 'demo (AI unavailable, fell back)',
    score,
    passed: score >= env.aiPassThreshold,
    answers: graded,
    summary:
      'Demo assessment score (AI provider unavailable). Assessment-based indicator only.',
  };
}

module.exports = { generateQuestions, evaluate, buildDemoQuestions };
