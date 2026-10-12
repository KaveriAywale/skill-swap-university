import { useEffect, useState } from 'react';
import { Sparkles, ShieldCheck, Award, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import Page from '../components/Page';
import { Button, Card, Chip, Field, Select, Textarea, Skeleton, StatusPill, SkillIcon, EmptyState, ProgressRing } from '../components/ui';
import api, { extractError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CATEGORY_META, timeAgo } from '../lib/utils';

export default function Verification() {
  const { skills, refresh } = useAuth();
  const { showToast, showError } = useToast();
  const [history, setHistory] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [pickSkill, setPickSkill] = useState('');
  const [starting, setStarting] = useState(false);

  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/verification/history');
      setHistory(res.data.data);
      setMeta(res.data.meta || {});
    } catch (e) {
      showError(extractError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = async () => {
    if (!pickSkill) return;
    setStarting(true);
    try {
      const res = await api.post('/verification/start', { skill: pickSkill });
      setAssessment(res.data.data);
      setAnswers({});
      setResult(null);
      showToast(res.data.message || 'Assessment ready');
    } catch (e) {
      showError(extractError(e));
    } finally {
      setStarting(false);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload = assessment.questions.map((q) => ({ questionId: q.id, response: answers[q.id] || '' }));
      const res = await api.post(`/verification/${assessment._id}/submit`, { answers: payload });
      setResult(res.data.data);
      showToast(res.data.message || 'Assessment submitted');
      if (res.data.data.passed) refresh?.();
      load();
    } catch (e) {
      showError(extractError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const restart = () => {
    setAssessment(null);
    setResult(null);
    setAnswers({});
    setPickSkill('');
  };

  // ---- Taking an assessment ----
  if (assessment && !result) {
    return (
      <Page>
        <div className="mx-auto max-w-2xl">
          <button onClick={restart} className="mb-4 flex items-center gap-1.5 text-sm text-ivory/60 hover:text-ivory">
            <ArrowLeft size={16} /> Cancel assessment
          </button>
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Chip color="#6366F1"><Sparkles size={12} /> {assessment.mode === 'ai' ? 'AI assessment' : 'Demo assessment'}</Chip>
              <Chip color="#2563EB">{assessment.skill?.name}</Chip>
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold">Skill assessment</h1>
            <p className="mt-1 text-sm text-ivory/60">
              Answer in your own words. {assessment.mode === 'demo' ? 'Demo mode: answers are scored locally with a transparent heuristic.' : 'An AI assessor grades clarity and correctness.'} Pass mark {meta.passThreshold ?? 70}/100.
            </p>

            <div className="mt-6 space-y-5">
              {assessment.questions.map((q, i) => (
                <div key={q.id}>
                  <label className="block text-sm font-semibold">
                    <span className="mr-2 text-lime">{i + 1}.</span>{q.prompt}
                  </label>
                  {q.hint ? <p className="mt-1 text-xs text-ivory/45">{q.hint}</p> : null}
                  <Textarea
                    rows={4}
                    className="mt-2"
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                    placeholder="Type your answerâ€¦"
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={restart}>Cancel</Button>
              <Button onClick={submit} loading={submitting} disabled={assessment.questions.some((q) => !(answers[q.id] || '').trim())}>
                Submit assessment
              </Button>
            </div>
          </Card>
        </div>
      </Page>
    );
  }

  // ---- Result view ----
  if (result) {
    return (
      <Page>
        <div className="mx-auto max-w-2xl">
          <Card className="p-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl" style={{ background: result.passed ? 'rgba(52,211,153,0.15)' : 'rgba(245,182,45,0.15)' }}>
              {result.passed ? <CheckCircle2 size={38} className="text-emerald-400" /> : <XCircle size={38} className="text-amber-400" />}
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold">
              {result.passed ? 'You passed!' : 'Not quite there yet'}
            </h1>
            <div className="mt-5 flex items-center justify-center gap-6">
              <ProgressRing value={result.score / 100} size={120} label={`${result.score}%`} />
              <div className="text-left text-sm">
                <p className="flex items-center gap-2 text-ivory/70"><ShieldCheck size={15} className="text-lime" /> Pass mark: {meta.passThreshold ?? 70}/100</p>
                <p className="mt-2 flex items-center gap-2 text-ivory/70"><Award size={15} className="text-lime" /> {result.mode === 'ai' ? 'AI-graded' : 'Demo-graded'}</p>
                {result.passed ? <p className="mt-2 text-lime">+15 karma & verified badge</p> : null}
              </div>
            </div>
            <p className="mx-auto mt-5 max-w-lg text-sm text-ivory/50">{result.summary}</p>

            <div className="mt-6 space-y-3 text-left">
              {result.answers.map((a, i) => (
                <div key={a.questionId} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Question {i + 1}</span>
                    <span className={`text-sm font-bold ${a.score >= (meta.passThreshold ?? 70) ? 'text-emerald-400' : 'text-amber-400'}`}>{a.score}/100</span>
                  </div>
                  <p className="mt-1 text-xs text-ivory/50">{a.feedback}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center gap-2">
              <Button variant="secondary" onClick={restart}>Take another</Button>
              <Button onClick={() => { setResult(null); setAssessment(null); }}>Done</Button>
            </div>
          </Card>
        </div>
      </Page>
    );
  }

  // ---- Landing / history ----
  const verified = history.filter((h) => h.passed);

  return (
    <Page
      title="Skill verification"
      subtitle="Earn assessment-based verified badges and extra karma."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime/15 text-lime">
                <Sparkles size={20} />
              </span>
              <div className="flex-1">
                <h2 className="font-display text-lg font-semibold">Take a skill assessment</h2>
                <p className="mt-1 text-sm text-ivory/60">
                  {meta.aiEnabled
                    ? 'An AI assessor will generate and grade a short assessment.'
                    : 'Demo mode is active â€” a transparent local scorer grades your answers. Set AI_PROVIDER to enable real AI.'}
                </p>
                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <div className="min-w-[200px] flex-1">
                    <Field label="Skill to verify">
                      <Select value={pickSkill} onChange={(e) => setPickSkill(e.target.value)} options={skills.map((s) => ({ value: s._id, label: s.name }))} placeholder="Choose a skill" />
                    </Field>
                  </div>
                  <Button onClick={start} loading={starting} disabled={!pickSkill} icon={Sparkles}>
                    Start assessment
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="section-title">Assessment history</h2>
            {loading ? (
              <div className="mt-4 space-y-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : history.length === 0 ? (
              <EmptyState title="No assessments yet" description="Verify a skill above to get started." />
            ) : (
              <div className="mt-4 space-y-3">
                {history.map((h) => {
                  const meta2 = CATEGORY_META[h.skill?.category] || {};
                  return (
                    <div key={h._id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: `${meta2.color || '#6366F1'}18`, color: meta2.color || '#6366F1' }}>
                        <SkillIcon name={h.skill?.icon} size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{h.skill?.name}</p>
                        <p className="text-xs text-ivory/45">
                          {h.status === 'evaluated' ? `Scored ${h.score}/100 Â· ${h.mode === 'ai' ? 'AI' : 'demo'}` : 'In progress'} Â· {timeAgo(h.createdAt)}
                        </p>
                      </div>
                      {h.status === 'evaluated' ? (
                        <StatusPill label={h.passed ? 'Passed' : 'Below pass'} color={h.passed ? '#059669' : '#D97706'} />
                      ) : (
                        <Chip color="#6366F1">In progress</Chip>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="p-6">
            <h2 className="section-title">Why verify?</h2>
            <ul className="mt-3 space-y-3 text-sm text-ivory/65">
              <li className="flex gap-2"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-lime" /> Verified badges show on your offers and profile.</li>
              <li className="flex gap-2"><Award size={16} className="mt-0.5 shrink-0 text-lime" /> +15 karma on a pass.</li>
              <li className="flex gap-2"><Sparkles size={16} className="mt-0.5 shrink-0 text-lime" /> Higher trust means more matches.</li>
            </ul>
          </Card>
          <Card className="p-6">
            <h2 className="section-title">Your verified skills</h2>
            {verified.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {verified.map((v) => (
                  <li key={v._id} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-emerald-400"><CheckCircle2 size={15} /> {v.skill?.name}</span>
                    <span className="text-ivory/50">{v.score}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ivory/50">None yet.</p>
            )}
          </Card>
        </aside>
      </div>
    </Page>
  );
}