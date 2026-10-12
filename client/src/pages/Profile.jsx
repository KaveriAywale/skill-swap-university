import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, MapPin, BadgeCheck, Flame, MessageSquare, Settings, GraduationCap, Users } from 'lucide-react';
import Page from '../components/Page';
import { Avatar, Button, Card, Chip, Skeleton, SkillIcon, EmptyState } from '../components/ui';
import { AvailabilityDots } from '../components/cards';
import api, { extractError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { timeAgo } from '../lib/utils';

export default function Profile() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();
  const isMine = !id || id === me?._id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      if (isMine) {
        const [profile, insights] = await Promise.all([
          api.get(`/users/${me._id}`),
          api.get(`/users/me/insights`),
        ]);
        setData({
          ...profile.data.data,
          reviews: insights.data.data.reviews || [],
        });
      } else {
        const res = await api.get(`/users/${id}`);
        setData(res.data.data);
      }
    } catch (e) {
      setError(extractError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const startChat = async () => {
    try {
      const res = await api.post('/conversations', { userId: data.id });
      navigate(`/messages/${res.data.data._id}`);
    } catch (e) {
      showError(extractError(e));
    }
  };

  if (loading) return <ProfileSkeleton />;
  if (error) return <Page><p className="text-rose-300">{error}</p></Page>;

  const p = data;
  const avg = p.avgRating || 0;

  return (
    <Page>
      <div className="card relative overflow-hidden">
        <div className="h-28 bg-[radial-gradient(circle_at_20%_20%,rgba(124,92,255,0.5),transparent_60%),radial-gradient(circle_at_80%_40%,rgba(201,242,75,0.25),transparent_55%),#1F1830]" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-end gap-4">
              <Avatar src={p.avatar} name={p.name} size={80} className="border-4 border-midnight-800" />
              <div className="pb-1">
                <h1 className="font-display text-2xl font-bold">
                  {p.name}
                  {isMine ? <span className="ml-2 text-sm font-medium text-ivory/40">(you)</span> : null}
                </h1>
                <p className="text-sm text-ivory/55">
                  {p.department} · Year {p.year} · {p.headline || 'Student'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isMine ? (
                <Link to="/settings"><Button variant="secondary" size="sm" icon={Settings}>Edit profile</Button></Link>
              ) : (
                <Button size="sm" onClick={startChat} icon={MessageSquare}>Message</Button>
              )}
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ivory/70">{p.bio || 'No bio yet.'}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {p.avgRating ? <Chip color="#F5B62D"><Star size={12} /> {avg.toFixed(1)} rating</Chip> : null}
            <Chip color="#34D399"><Users size={12} /> {p.stats?.completedSessions || 0} sessions</Chip>
            {p.locationEnabled ? <Chip color="#A78BFA"><MapPin size={12} /> {p.locationLabel || 'On campus'}</Chip> : null}
            {p.isDemo ? <Chip color="#F5B62D">demo profile</Chip> : null}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat icon={Flame} label="Karma" value={p.karma ?? 0} />
            <MiniStat icon={GraduationCap} label="Taught" value={p.stats?.taughtCount ?? 0} />
            <MiniStat icon={Star} label="Learned" value={p.stats?.learnedCount ?? 0} />
            <MiniStat icon={BadgeCheck} label="Verified skills" value={p.verifiedSkills?.length ?? 0} />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Offers */}
          <Card className="p-6">
            <h2 className="section-title">Skills offered</h2>
            {p.offers?.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {p.offers.map((o) => {
                  return (
                    <div key={o._id || o.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center gap-2">
                        <SkillIcon name={o.skill?.icon} size={16} />
                        <span className="font-semibold">{o.skill?.name}</span>
                        {o.verified ? <BadgeCheck size={15} className="text-lime" /> : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-ivory/55">{o.title}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-ivory/45">
                        <span className="chip">{o.level}</span>
                        <span className="chip capitalize">{o.format}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="No skills offered yet" description={isMine ? 'Offer your first skill to start helping peers.' : `${p.name} hasn't offered any skills yet.`} />
            )}
          </Card>

          {/* Skills wanted */}
          <Card className="p-6">
            <h2 className="section-title">Wants to learn</h2>
            {p.skillsWanted?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {p.skillsWanted.map((s) => (
                  <span key={s._id} className="chip">{s.name}</span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-ivory/50">Nothing listed yet.</p>
            )}
          </Card>

          {/* Reviews */}
          <Card className="p-6">
            <h2 className="section-title">Reviews</h2>
            {p.reviews?.length ? (
              <div className="mt-4 space-y-3">
                {p.reviews.map((r) => (
                  <div key={r._id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{r.author?.name}</span>
                      <span className="flex items-center gap-0.5 text-accent-amber">
                        {Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={13} fill="currentColor" />)}
                      </span>
                    </div>
                    {r.comment ? <p className="mt-1.5 text-sm text-ivory/65">{r.comment}</p> : null}
                    <p className="mt-1 text-xs text-ivory/35">{timeAgo(r.createdAt)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-ivory/50">No reviews yet — completed sessions unlock ratings.</p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="section-title">Availability</h2>
            <div className="mt-4">
              <AvailabilityDots availability={p.availability || []} size={22} />
              <div className="mt-4 space-y-1.5">
                {(p.availability || []).map((a, i) => (
                  <p key={i} className="text-sm text-ivory/65">
                    <span className="inline-block w-9 font-semibold text-lavender">{a.day}</span>
                    {a.from}–{a.to}
                  </p>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="section-title">Badges</h2>
            {p.badges?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {p.badges.map((b) => (
                  <span key={b.key} title={b.description} className="chip" style={{ borderColor: `${b.definition?.color || '#A78BFA'}55`, color: b.definition?.color }}>
                    {b.definition?.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-ivory/50">No badges yet.</p>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="section-title">Verified skills</h2>
            {(p.verifiedSkills || []).length ? (
              <ul className="mt-3 space-y-1.5 text-sm">
                {(p.verifiedSkills || []).map((v, i) => (
                  <li key={i} className="flex items-center gap-2 text-lime">
                    <BadgeCheck size={15} /> <span className="text-ivory/70">{v.skill?.name || 'Skill'}</span>
                    <span className="ml-auto text-ivory/40">{v.score}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ivory/50">
                {isMine ? 'Complete a skill check to get verified.' : 'No verified skills yet.'}
              </p>
            )}
          </Card>
        </div>
      </div>
    </Page>
  );
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime/15 text-lime">
        <Icon size={17} />
      </span>
      <div>
        <p className="font-display text-lg font-bold leading-none">{value}</p>
        <p className="mt-0.5 text-[11px] text-ivory/50">{label}</p>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <Page>
      <Skeleton className="h-56" />
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-80" />
      </div>
    </Page>
  );
}