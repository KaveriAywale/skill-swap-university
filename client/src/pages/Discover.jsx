import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid, List, Map as MapIcon } from 'lucide-react';
import Page from '../components/Page';
import CampusMap from '../components/CampusMap';
import { StudentCard } from '../components/cards';
import { Button, Card, Select, Skeleton, EmptyState, ErrorState } from '../components/ui';
import api, { extractError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { CATEGORY_META, DAYS } from '../lib/utils';

export default function Discover() {
  const { categories, skills } = useAuth();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState('grid');
  const [category, setCategory] = useState(params.get('category') || '');
  const [skill, setSkill] = useState(params.get('skill') || '');
  const [q, setQ] = useState(params.get('q') || '');
  const [day, setDay] = useState('');
  const [sort, setSort] = useState('karma');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    const query = new URLSearchParams();
    if (q) query.set('q', q);
    if (category) query.set('category', category);
    if (skill) query.set('skill', skill);
    if (day) query.set('day', day);
    query.set('sort', sort);
    try {
      const res = await api.get(`/users?${query.toString()}`);
      setData(res.data.data);
    } catch (e) {
      setError(extractError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, skill, day, sort]);

  useEffect(() => {
    if (q) setParams({ q });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasFilters = Boolean(q || category || skill || day);

  return (
    <Page
      title="Discover skills"
      subtitle="Find nearby students who can teach what you need. Fuzzy distance labels only — never exact locations."
      actions={
        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          {[
            { key: 'grid', icon: LayoutGrid, label: 'Grid' },
            { key: 'list', icon: List, label: 'List' },
            { key: 'map', icon: MapIcon, label: 'Map' },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              aria-label={label}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition ${
                view === key ? 'bg-lime text-midnight-950' : 'text-ivory/70 hover:text-ivory'
              }`}
            >
              <Icon size={16} /> <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      }
    >
      {/* Search + filters */}
      <div className="mb-6 space-y-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
        >
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, headline or bio…" className="input-field" aria-label="Search students" />
          <Button type="submit">Search</Button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setSkill('');
            }}
            options={[{ value: '', label: 'All categories' }, ...categories.map((c) => ({ value: c.key, label: c.name }))]}
            className="!w-auto min-w-[180px]"
            placeholder="All categories"
          />
          <Select
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            options={[{ value: '', label: 'All skills' }, ...skills.map((s) => ({ value: s._id, label: s.name }))]}
            className="!w-auto min-w-[160px]"
            placeholder="All skills"
          />
          <Select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            options={[{ value: '', label: 'Any day' }, ...DAYS.map((d) => ({ value: d, label: d }))]}
            className="!w-auto"
            placeholder="Any day"
          />
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            options={[
              { value: 'karma', label: 'Sort: top karma' },
              { value: 'rating', label: 'Sort: top rated' },
              { value: 'recent', label: 'Sort: recently active' },
            ]}
            className="!w-auto"
          />
          {hasFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQ('');
                setCategory('');
                setSkill('');
                setDay('');
                setParams({});
              }}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>

      {/* Category chips */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((cat) => {
          const active = category === cat.key;
          const meta = CATEGORY_META[cat.key];
          return (
            <button
              key={cat.key}
              onClick={() => {
                setCategory(active ? '' : cat.key);
                setSkill('');
              }}
              className="chip transition"
              style={active ? { borderColor: `${meta?.color}66`, background: `${meta?.color}1E`, color: meta?.color } : undefined}
            >
              {cat.key === 'programming' ? '💻' : cat.key === 'ai-data' ? '🧠' : cat.key === 'mathematics' ? '📐' : cat.key === 'design' ? '🎨' : cat.key === 'hardware' ? '🖥️' : cat.key === 'robotics' ? '🤖' : cat.key === 'languages' ? '🗣️' : '🎸'}
              {cat.name}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : data.length === 0 ? (
        <EmptyState
          title="No students found"
          description="Try clearing a filter or posting a help request — helpers will come to you."
        />
      ) : view === 'map' ? (
        <Card className="p-5">
          <CampusMap students={data} height={360} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.slice(0, 6).map((s) => (
              <StudentCard key={s.id} student={s} />
            ))}
          </div>
        </Card>
      ) : view === 'list' ? (
        <Card className="divide-y divide-white/5">
          {data.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-4 p-4">
              <StudentCard student={s} />
            </div>
          ))}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((s) => (
            <StudentCard key={s.id} student={s} />
          ))}
        </div>
      )}
    </Page>
  );
}