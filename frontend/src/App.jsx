import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

/* ────────────────────────────────────────────────────────────
   API CLIENT
   ──────────────────────────────────────────────────────────── */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('spendwise_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('spendwise_token');
      localStorage.removeItem('spendwise_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/* ────────────────────────────────────────────────────────────
   AUTH CONTEXT — real backend
   ──────────────────────────────────────────────────────────── */
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('spendwise_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('spendwise_token') || null);
  const [booting, setBooting] = useState(true);

  // On mount: if we have a token, validate it by hitting a protected endpoint
  useEffect(() => {
    (async () => {
      if (!token) {
        setBooting(false);
        return;
      }
      try {
        await api.get('/api/categories');
      } catch {
        // 401 interceptor already handled cleanup
      } finally {
        setBooting(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('spendwise_user', JSON.stringify(data.user));
    localStorage.setItem('spendwise_token', data.token);
    return data.user;
  };

  const register = async (email, password, fullName) => {
    const { data } = await api.post('/api/auth/register', { email, password, fullName });
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('spendwise_user', JSON.stringify(data.user));
    localStorage.setItem('spendwise_token', data.token);
    return data.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('spendwise_user');
    localStorage.removeItem('spendwise_token');
  };

  const value = useMemo(
    () => ({ user, token, booting, login, register, logout }),
    [user, token, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ────────────────────────────────────────────────────────────
   UTILITIES
   ──────────────────────────────────────────────────────────── */
const formatINR = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const formatDate = (date) => {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

const getMonthName = (month) =>
  new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(2026, month - 1, 1));

const initials = (name = 'You') =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const extractError = (err) =>
  err?.response?.data?.error || err?.message || 'Something went wrong';

/* ────────────────────────────────────────────────────────────
   CORE UI PRIMITIVES
   ──────────────────────────────────────────────────────────── */
function AnimatedBackground() {
  return (
    <div className="ambient" aria-hidden="true">
      <span className="orb orb-one" />
      <span className="orb orb-two" />
      <span className="orb orb-three" />
      <span className="grain" />
    </div>
  );
}

function Logo({ compact = false }) {
  return (
    <Link className={`brand ${compact ? 'brand-compact' : ''}`} to="/">
      <span className="brand-mark">
        <i />
        <b />
      </span>
      <span>
        Spend<span>Wise</span>
      </span>
    </Link>
  );
}

function CountUp({ value, prefix = '', suffix = '' }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start;
    const duration = 750;
    const tick = (time) => {
      if (!start) start = time;
      const progress = Math.min((time - start) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return (
    <>
      {prefix}
      {count.toLocaleString('en-IN')}
      {suffix}
    </>
  );
}

function TiltCard({ children, className = '' }) {
  const ref = useRef(null);
  const move = (event) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    const x = ((event.clientX - box.left) / box.width - 0.5) * 4;
    const y = ((event.clientY - box.top) / box.height - 0.5) * -4;
    ref.current.style.transform = `perspective(900px) rotateX(${y}deg) rotateY(${x}deg) translateY(-3px)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = '';
  };
  return (
    <div
      ref={ref}
      onMouseMove={move}
      onMouseLeave={reset}
      className={`tilt-card ${className}`}
    >
      {children}
    </div>
  );
}

function LoadingSpinner() {
  return <span className="spinner" aria-label="Loading" />;
}

function EmptyState({ title = 'No expenses yet', message = 'Your next intentional rupee starts here.' }) {
  return (
    <div className="empty-state">
      <div className="empty-orb">
        <span>₹</span>
      </div>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}

function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      >
        <motion.div
          className={`modal ${wide ? 'modal-wide' : ''}`}
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        >
          <div className="modal-heading">
            <div>
              <span className="eyebrow">SpendWise workspace</span>
              <h2>{title}</h2>
            </div>
            <button className="icon-button" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ProtectedRoute({ children }) {
  const { token, booting } = useContext(AuthContext);
  if (booting) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <LoadingSpinner />
      </div>
    );
  }
  return token ? children : <Navigate to="/login" replace />;
}

/* ────────────────────────────────────────────────────────────
   LANDING PAGE
   ──────────────────────────────────────────────────────────── */
function PublicNav() {
  return (
    <nav className="public-nav">
      <Logo />
      <div className="public-links">
        <a href="#features">Features</a>
        <a href="#how-it-works">How it works</a>
        <Link className="nav-login" to="/login">
          Log in <span>↗</span>
        </Link>
      </div>
    </nav>
  );
}

function Landing() {
  const features = [
    ['◒', 'See the whole picture', 'A dashboard that turns scattered transactions into a clear money story.'],
    ['⌁', 'Make patterns visible', 'Understand what is quietly shaping your month before it shapes your goals.'],
    ['↗', 'Move with intention', 'Lightweight tracking that keeps you focused on the next smart decision.'],
    ['◈', 'Categories that click', 'Make your spending feel legible with calm, color-coded context.'],
    ['⌁', 'Built for real life', 'Add an expense in seconds, from your desk or while you are out.'],
    ['✦', 'Your data, your rhythm', 'A personal command center that adapts to how you think about money.'],
  ];
  return (
    <div className="landing">
      <AnimatedBackground />
      <PublicNav />
      <main className="hero">
        <div className="hero-copy">
          <div className="kicker">
            <span className="kicker-dot" /> Personal finance, with perspective
          </div>
          <h1>
            Track smarter.
            <br />
            <em>Spend wiser.</em>
          </h1>
          <p>
            SpendWise helps you understand every rupee — so your everyday decisions feel
            lighter, clearer, and more yours.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/register">
              Get started <span>↗</span>
            </Link>
            <Link className="button button-ghost" to="/login">
              Log in
            </Link>
          </div>
          <div className="hero-note">
            <span className="avatar-stack">
              <i>AK</i>
              <i>RM</i>
              <i>+</i>
            </span>
            <span>Made for better money days</span>
          </div>
        </div>
        <DashboardPreview />
      </main>
      <section className="proof-strip">
        <div>
          <strong>₹1.2Cr+</strong>
          <span>tracked by intentional people</span>
        </div>
        <div>
          <strong>4.9/5</strong>
          <span>clarity, not complexity</span>
        </div>
        <div>
          <strong>2 min</strong>
          <span>to your first insight</span>
        </div>
      </section>
      <section className="features-section" id="features">
        <div className="section-intro">
          <span className="eyebrow">A calmer way to know</span>
          <h2>
            Money clarity,
            <br />
            <span>without the noise.</span>
          </h2>
          <p>
            SpendWise gives every rupee a place in the story, without asking you to become a
            spreadsheet person.
          </p>
        </div>
        <div className="feature-grid">
          {features.map(([icon, title, copy], index) => (
            <motion.div
              className="feature-card"
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
            >
              <span className="feature-icon">{icon}</span>
              <span className="feature-index">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
              <span className="feature-arrow">↗</span>
            </motion.div>
          ))}
        </div>
      </section>
      <section className="how-section" id="how-it-works">
        <div className="how-card">
          <div>
            <span className="eyebrow">Your next good decision</span>
            <h2>
              Less guessing.
              <br />
              <span>More going forward.</span>
            </h2>
          </div>
          <div className="steps">
            <div>
              <b>01</b>
              <span>Add your rhythm</span>
              <p>Capture the moments that matter. Nothing more.</p>
            </div>
            <div>
              <b>02</b>
              <span>Spot the signal</span>
              <p>Watch trends emerge as your month takes shape.</p>
            </div>
            <div>
              <b>03</b>
              <span>Choose with context</span>
              <p>Spend from a place of clarity, not second-guessing.</p>
            </div>
          </div>
        </div>
      </section>
      <footer className="public-footer">
        <Logo compact />
        <div>
          <span>© 2026 SpendWise</span>
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <Link to="/login">Log in</Link>
        </div>
        <span className="footer-tag">Track smarter. Spend wiser.</span>
      </footer>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="hero-visual">
      <div className="visual-backdrop" />
      <div className="dashboard-preview">
        <div className="preview-top">
          <div>
            <small>OVERVIEW · OCT 2026</small>
            <h4>
              Good morning, Alex <span>✦</span>
            </h4>
          </div>
          <span className="mini-avatar">AM</span>
        </div>
        <div className="preview-balance">
          <span>Total this month</span>
          <strong>
            ₹44,260<span>.00</span>
          </strong>
          <div className="balance-delta">
            ↗ 12.8% <em>vs last month</em>
          </div>
        </div>
        <div className="preview-chart">
          <div className="chart-label">
            <span>Spending flow</span>
            <span>₹50k</span>
          </div>
          <svg viewBox="0 0 500 150" preserveAspectRatio="none">
            <defs>
              <linearGradient id="heroLine" x1="0" x2="0" y1="0" y2="1">
                <stop stopColor="#43e6a0" stopOpacity=".34" />
                <stop offset="1" stopColor="#43e6a0" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0 125 C40 110 55 95 92 104 S145 104 173 80 S230 94 257 70 S315 76 350 39 S400 65 427 43 S465 33 500 10 V150 H0Z"
              fill="url(#heroLine)"
            />
            <path
              d="M0 125 C40 110 55 95 92 104 S145 104 173 80 S230 94 257 70 S315 76 350 39 S400 65 427 43 S465 33 500 10"
              fill="none"
              stroke="#43e6a0"
              strokeWidth="3"
            />
          </svg>
          <div className="chart-months">
            <span>May</span>
            <span>Jun</span>
            <span>Jul</span>
            <span>Aug</span>
            <span>Sep</span>
            <span>Oct</span>
          </div>
        </div>
        <div className="preview-bottom">
          <div>
            <span className="preview-icon food">🍜</span>
            <span>
              <b>Food</b>
              <small>34.5% of spend</small>
            </span>
            <strong>₹15,260</strong>
          </div>
          <div>
            <span className="preview-icon travel">✈️</span>
            <span>
              <b>Travel</b>
              <small>18.2% of spend</small>
            </span>
            <strong>₹8,040</strong>
          </div>
        </div>
      </div>
      <div className="floating-stat stat-one">
        <span>↗</span>
        <div>
          <b>12.8%</b>
          <small>spending up</small>
        </div>
      </div>
      <div className="floating-stat stat-two">
        <span>◉</span>
        <div>
          <b>On track</b>
          <small>for your goal</small>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   APP SHELL
   ──────────────────────────────────────────────────────────── */
function Topbar({ onMenu }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const title =
    {
      '/dashboard': 'Overview',
      '/expenses': 'Expenses',
      '/categories': 'Categories',
      '/profile': 'Profile',
    }[location.pathname] || 'Overview';

  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={onMenu}>
        ☰
      </button>
      <div>
        <span className="topbar-context">
          Workspace / <b>{title}</b>
        </span>
        <h1>{title}</h1>
      </div>
      <div className="topbar-actions">
        <button className="round-action" aria-label="Notifications">
          ♢<i />
        </button>
        <div className="topbar-user">
          <span className="user-avatar">{initials(user?.fullName)}</span>
          <div>
            <b>{user?.fullName || 'You'}</b>
            <small>Personal account</small>
          </div>
          <span className="chevron">⌄</span>
        </div>
      </div>
    </header>
  );
}

function Sidebar({ open, onClose }) {
  const items = [
    ['/dashboard', 'Overview', '⌂'],
    ['/expenses', 'Expenses', '↗'],
    ['/categories', 'Categories', '◈'],
    ['/profile', 'Profile', '◎'],
  ];
  return (
    <>
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar-brand">
          <Logo />
          <button className="sidebar-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="sidebar-label">Workspace</div>
        <nav>
          {items.map(([path, label, icon]) => (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-insight">
          <span className="insight-spark">✦</span>
          <b>
            Small steps,
            <br />
            big picture.
          </b>
          <p>Every entry is a little more clarity.</p>
          <Link to="/expenses">
            Add expense <span>↗</span>
          </Link>
        </div>
        <div className="sidebar-bottom">
          <span className="sync-dot" /> <span>Live</span>
          <span className="sidebar-version">v1.0</span>
        </div>
      </aside>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
    </>
  );
}

function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-column">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

function StatCard({ label, value, prefix = '', suffix = '', delta, tone, icon }) {
  return (
    <TiltCard className="stat-card">
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <span className="stat-label">{label}</span>
      <strong>
        <CountUp value={value} prefix={prefix} suffix={suffix} />
      </strong>
      {delta && (
        <span className={`stat-delta ${delta?.startsWith('-') ? 'negative' : ''}`}>
          {delta} <em>vs last month</em>
        </span>
      )}
    </TiltCard>
  );
}

function FilterSelect({ value, onChange, children }) {
  return (
    <div className="select-wrap">
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
      <span>⌄</span>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <small>{label}</small>
      <b>{formatINR(payload[0].value)}</b>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   DASHBOARD
   ──────────────────────────────────────────────────────────── */
function Dashboard() {
  const { user } = useContext(AuthContext);
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/dashboard/summary', {
        params: { month: Number(month), year: Number(year) },
      });
      setSummary(data);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await api.get('/api/categories');
      setCategories(data);
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  useEffect(() => {
    loadCategories();
  }, []);

  const total = summary?.totalThisMonth ? Number(summary.totalThisMonth) : 0;
  const categoryData =
    summary?.categoryBreakdown?.map((slice) => ({
      name: slice.name,
      value: Number(slice.amount),
      color: slice.color,
    })) || [];
  const monthlyTrend =
    summary?.monthlyTrend?.map((point) => ({
      month: point.month,
      amount: Number(point.amount),
    })) || [];

  const handleSave = async (expense) => {
    await loadSummary();
    toast.success('Expense added');
  };

  return (
    <AppShell>
      <motion.div
        className="page dashboard-page"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">
              {new Intl.DateTimeFormat('en-IN', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              }).format(now)}
            </span>
            <h2>
              Good{' '}
              {now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'}
              , <span>{user?.fullName?.split(' ')[0] || 'there'}.</span>
            </h2>
            <p>Here's the shape of your money this month.</p>
          </div>
          <div className="date-filters">
            <FilterSelect value={month} onChange={setMonth}>
              {Array.from({ length: 12 }, (_, i) => (
                <option value={String(i + 1)} key={i}>
                  {getMonthName(i + 1)}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect value={year} onChange={setYear}>
              <option>{now.getFullYear()}</option>
              <option>{now.getFullYear() - 1}</option>
            </FilterSelect>
          </div>
        </div>

        {loading && !summary ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <StatCard
                label="This month"
                value={Math.round(total)}
                prefix="₹"
                tone="green"
                icon="↗"
              />
              <StatCard
                label="This year"
                value={Math.round(Number(summary?.totalThisYear || 0))}
                prefix="₹"
                tone="amber"
                icon="◫"
              />
              <StatCard
                label="Avg. per day"
                value={Math.round(Number(summary?.avgPerDay || 0))}
                prefix="₹"
                tone="blue"
                icon="◌"
              />
              <StatCard
                label="Transactions"
                value={Number(summary?.transactionCount || 0)}
                tone="pink"
                icon="⌁"
              />
            </div>

            <div className="dashboard-grid">
              <TiltCard className="chart-card category-card">
                <div className="card-heading">
                  <div>
                    <span className="eyebrow">Where it goes</span>
                    <h3>Category breakdown</h3>
                  </div>
                  <button className="more-button">···</button>
                </div>
                <div className="pie-wrap">
                  {categoryData.length > 0 ? (
                    <>
                      <PieChart width={220} height={220}>
                        <Pie
                          data={categoryData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={72}
                          outerRadius={96}
                          paddingAngle={4}
                          stroke="none"
                        >
                          {categoryData.map((entry) => (
                            <Cell fill={entry.color} key={entry.name} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                      <div className="pie-center">
                        <strong>₹{(total / 1000).toFixed(1)}k</strong>
                        <span>Total</span>
                      </div>
                      <div className="legend-list">
                        {categoryData.map((entry) => (
                          <div key={entry.name}>
                            <span style={{ background: entry.color }} />{' '}
                            <span>{entry.name}</span>
                            <b>{Math.round((entry.value / (total || 1)) * 100)}%</b>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <EmptyState
                      title="No data yet"
                      message="Add an expense to see your category breakdown."
                    />
                  )}
                </div>
              </TiltCard>

              <TiltCard className="chart-card trend-card">
                <div className="card-heading">
                  <div>
                    <span className="eyebrow">Last 6 months</span>
                    <h3>Spending flow</h3>
                  </div>
                </div>
                <div className="line-chart">
                  <ResponsiveContainer width="100%" height={235}>
                    <LineChart data={monthlyTrend} margin={{ top: 16, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid
                        strokeDasharray="3 7"
                        vertical={false}
                        stroke="rgba(255,255,255,.07)"
                      />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#77829a', fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#77829a', fontSize: 11 }}
                        tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#43e6a0"
                        strokeWidth={3}
                        dot={{ fill: '#0b1228', stroke: '#43e6a0', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#f6a623', stroke: '#f6a623' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="trend-foot">
                  <span>
                    <i className="trend-dot" /> 6-month view
                  </span>
                </div>
              </TiltCard>
            </div>
          </>
        )}

        <button className="fab" onClick={() => setModalOpen(true)}>
          <span>＋</span>
          <small>Add expense</small>
        </button>

        <ExpenseModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          categories={categories}
          onSave={handleSave}
        />
      </motion.div>
    </AppShell>
  );
}

/* ────────────────────────────────────────────────────────────
   EXPENSE MODAL
   ──────────────────────────────────────────────────────────── */
function ExpenseModal({ open, onClose, expense, categories = [], onSave }) {
  const empty = {
    amount: '',
    description: '',
    categoryId: categories[0]?.id ? String(categories[0].id) : '',
    expenseDate: new Date().toISOString().slice(0, 10),
  };
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (expense) {
      setForm({
        amount: expense.amount,
        description: expense.description,
        categoryId: expense.categoryId ? String(expense.categoryId) : '',
        expenseDate: expense.expenseDate,
      });
    } else {
      setForm(empty);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expense, open]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      return toast.error('Enter a valid amount');
    }
    if (!form.expenseDate) {
      return toast.error('Pick a date');
    }

    setBusy(true);
    try {
      const payload = {
        amount: Number(form.amount),
        description: form.description?.trim() || '',
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        expenseDate: form.expenseDate,
      };

      if (expense?.id) {
        await api.put(`/api/expenses/${expense.id}`, payload);
      } else {
        await api.post('/api/expenses', payload);
      }

      onSave?.();
      onClose();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={expense ? 'Edit expense' : 'Add an expense'}>
      <form className="expense-form" onSubmit={submit}>
        <label>
          What was it for?
          <span className="field-wrap">
            <span className="field-icon">✦</span>
            <input
              value={form.description}
              onChange={(event) => update('description', event.target.value)}
              placeholder="e.g. Dinner at Mizu"
            />
          </span>
        </label>
        <div className="form-row">
          <label>
            Amount
            <span className="field-wrap">
              <span className="field-icon">₹</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(event) => update('amount', event.target.value)}
                placeholder="0"
              />
            </span>
          </label>
          <label>
            Date
            <span className="field-wrap">
              <input
                type="date"
                value={form.expenseDate}
                onChange={(event) => update('expenseDate', event.target.value)}
              />
            </span>
          </label>
        </div>
        <label>
          Category
          <span className="field-wrap select-field">
            <select
              value={form.categoryId}
              onChange={(event) => update('categoryId', event.target.value)}
            >
              <option value="">— None —</option>
              {categories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
            <span>⌄</span>
          </span>
        </label>
        <button className="button button-primary button-full" type="submit" disabled={busy}>
          {busy ? <LoadingSpinner /> : expense ? 'Save changes' : 'Add expense'}
          {!busy && <span>↗</span>}
        </button>
      </form>
    </Modal>
  );
}

/* ────────────────────────────────────────────────────────────
   EXPENSES PAGE
   ──────────────────────────────────────────────────────────── */
function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [month, setMonth] = useState('all');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [expensesRes, categoriesRes] = await Promise.all([
        api.get('/api/expenses'),
        api.get('/api/categories'),
      ]);
      setExpenses(expensesRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = expenses.filter((expense) => {
    const matchesSearch = `${expense.description} ${expense.categoryName}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory =
      category === 'all' || String(expense.categoryId) === category;
    const matchesMonth =
      month === 'all' || (expense.expenseDate || '').slice(5, 7) === month;
    return matchesSearch && matchesCategory && matchesMonth;
  });

  const remove = async (id) => {
    if (!window.confirm('Delete this expense? This cannot be undone.')) return;
    try {
      await api.delete(`/api/expenses/${id}`);
      setExpenses((current) => current.filter((expense) => expense.id !== id));
      toast.success('Expense removed');
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const save = async () => {
    await load();
    toast.success(editing ? 'Expense updated' : 'Expense added');
    setEditing(null);
  };

  return (
    <AppShell>
      <motion.div
        className="page"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <SectionHeader
          eyebrow="Your money trail"
          title="Expenses"
          description="A clear record of the choices behind your month."
          action={
            <button
              className="button button-primary"
              onClick={() => {
                setEditing(null);
                setModal(true);
              }}
            >
              ＋ Add expense
            </button>
          }
        />

        <div className="filter-bar">
          <div className="search-field">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search expenses..."
            />
          </div>
          <FilterSelect value={month} onChange={setMonth}>
            <option value="all">All months</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option value={String(i + 1).padStart(2, '0')} key={i}>
                {getMonthName(i + 1)}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect value={category} onChange={setCategory}>
            <option value="all">All categories</option>
            {categories.map((item) => (
              <option value={item.id} key={item.id}>
                {item.icon} {item.name}
              </option>
            ))}
          </FilterSelect>
        </div>

        <div className="expense-table-wrap">
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <LoadingSpinner />
            </div>
          ) : filtered.length ? (
            <div className="expense-table">
              <div className="table-head">
                <span>Expense</span>
                <span>Category</span>
                <span>Date</span>
                <span>Amount</span>
                <span />
              </div>
              {filtered.map((expense, index) => (
                <motion.div
                  className="table-row"
                  key={expense.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <div className="table-expense">
                    <span
                      className="expense-icon"
                      style={{
                        background: `${expense.categoryColor || '#8690A9'}18`,
                        color: expense.categoryColor || '#8690A9',
                      }}
                    >
                      {expense.categoryIcon || '···'}
                    </span>
                    <span>
                      <b>{expense.description || 'Untitled'}</b>
                      <small>#{String(expense.id).slice(-4)} · Personal</small>
                    </span>
                  </div>
                  <span
                    className="category-pill"
                    style={{
                      color: expense.categoryColor || '#8690A9',
                      background: `${expense.categoryColor || '#8690A9'}13`,
                    }}
                  >
                    {expense.categoryName || 'Uncategorized'}
                  </span>
                  <span className="table-date">{formatDate(expense.expenseDate)}</span>
                  <strong>{formatINR(expense.amount)}</strong>
                  <div className="row-actions">
                    <button
                      onClick={() => {
                        setEditing(expense);
                        setModal(true);
                      }}
                      aria-label="Edit"
                    >
                      ↗
                    </button>
                    <button onClick={() => remove(expense.id)} aria-label="Delete">
                      ×
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState message="Try changing your filters, or add your first expense." />
          )}
        </div>

        <div className="table-footer">
          <span>
            Showing <b>{filtered.length}</b> of {expenses.length} expenses
          </span>
          <span className="footer-total">
            This view{' '}
            <b>{formatINR(filtered.reduce((sum, item) => sum + Number(item.amount), 0))}</b>
          </span>
        </div>

        <ExpenseModal
          open={modal}
          onClose={() => {
            setModal(false);
            setEditing(null);
          }}
          expense={editing}
          categories={categories}
          onSave={save}
        />
      </motion.div>
    </AppShell>
  );
}

/* ────────────────────────────────────────────────────────────
   CATEGORIES PAGE
   ──────────────────────────────────────────────────────────── */
function Categories() {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '✦', color: '#43e6a0' });
  const [loading, setLoading] = useState(true);
  const icons = ['✦', '☕', '🎧', '🏠', '🐾', '⚡', '◌', '✚'];

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/categories');
      setCategories(data);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (event) => {
    event.preventDefault();
    if (!form.name) return toast.error('Give your category a name.');
    try {
      await api.post('/api/categories', form);
      setForm({ name: '', icon: '✦', color: '#43e6a0' });
      setOpen(false);
      toast.success('Category created');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/api/categories/${id}`);
      toast.success('Category removed');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <AppShell>
      <motion.div
        className="page"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <SectionHeader
          eyebrow="Make it legible"
          title="Categories"
          description="Give every kind of spend a little more context."
        />
        <div className="category-grid">
          {loading ? (
            <div style={{ gridColumn: '1/-1', padding: 60, textAlign: 'center' }}>
              <LoadingSpinner />
            </div>
          ) : (
            categories.map((category, index) => (
              <motion.div
                className="category-card"
                key={category.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.04 }}
              >
                <div className="category-card-top">
                  <span
                    className="category-large-icon"
                    style={{
                      background: `${category.color}18`,
                      color: category.color,
                    }}
                  >
                    {category.icon}
                  </span>
                  {category.isDefault ? (
                    <span className="default-badge">Default</span>
                  ) : (
                    <button
                      className="delete-category"
                      onClick={() => remove(category.id)}
                    >
                      ×
                    </button>
                  )}
                </div>
                <h3>{category.name}</h3>
                <div className="category-meta">
                  <span style={{ background: category.color }} />{' '}
                  <small>{category.isDefault ? 'SpendWise default' : 'Created by you'}</small>
                </div>
                <div className="category-line">
                  <span
                    style={{ width: `${14 + index * 7}%`, background: category.color }}
                  />
                </div>
              </motion.div>
            ))
          )}
          <button className="add-category-card" onClick={() => setOpen(true)}>
            <span>＋</span>
            <b>Add category</b>
            <small>Make your own lane</small>
          </button>
        </div>

        <Modal open={open} onClose={() => setOpen(false)} title="Create a category">
          <form className="expense-form" onSubmit={add}>
            <label>
              Category name
              <span className="field-wrap">
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="e.g. Self care"
                />
              </span>
            </label>
            <label>
              Pick an icon
              <div className="emoji-picker">
                {icons.map((icon) => (
                  <button
                    type="button"
                    key={icon}
                    className={form.icon === icon ? 'selected' : ''}
                    onClick={() => setForm({ ...form, icon })}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </label>
            <label>
              Accent color
              <span className="color-picker">
                <input
                  type="color"
                  value={form.color}
                  onChange={(event) => setForm({ ...form, color: event.target.value })}
                />
                <span>{form.color}</span>
              </span>
            </label>
            <button className="button button-primary button-full" type="submit">
              Create category <span>↗</span>
            </button>
          </form>
        </Modal>
      </motion.div>
    </AppShell>
  );
}

/* ────────────────────────────────────────────────────────────
   PROFILE PAGE
   ──────────────────────────────────────────────────────────── */
function Profile() {
  const { user, logout } = useContext(AuthContext);
  const [light, setLight] = useState(
    () => localStorage.getItem('spendwise_theme') === 'light'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
    localStorage.setItem('spendwise_theme', light ? 'light' : 'dark');
  }, [light]);

  const leave = () => {
    logout();
    toast('You are signed out. See you soon.', { icon: '↗' });
  };

  return (
    <AppShell>
      <motion.div
        className="page"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <SectionHeader
          eyebrow="Your account"
          title="Profile"
          description="A few details about the person behind the plan."
        />
        <div className="profile-layout">
          <div className="profile-card profile-identity">
            <div className="profile-avatar">{initials(user?.fullName)}</div>
            <span className="online-dot" />
            <h3>{user?.fullName}</h3>
            <p>{user?.email}</p>
            <span className="member-chip">Signed in</span>
          </div>
          <div className="profile-settings">
            <div className="settings-card">
              <div className="settings-card-heading">
                <span className="settings-icon">◐</span>
                <div>
                  <h3>Preferences</h3>
                  <p>Make SpendWise feel like yours.</p>
                </div>
              </div>
              <div className="setting-row">
                <div>
                  <b>Color theme</b>
                  <span>{light ? 'Light mode is on' : 'Dark mode is on'}</span>
                </div>
                <button
                  className={`theme-switch ${light ? 'light' : ''}`}
                  onClick={() => setLight(!light)}
                  aria-label="Toggle theme"
                >
                  <i />
                </button>
              </div>
            </div>
            <div className="settings-card danger-card">
              <div className="settings-card-heading">
                <span className="settings-icon danger">↗</span>
                <div>
                  <h3>Session</h3>
                  <p>Keep your account private and tidy.</p>
                </div>
              </div>
              <button className="logout-button" onClick={leave}>
                Log out of SpendWise <span>↗</span>
              </button>
            </div>
            <div className="about-note">
              <span>✦</span>
              <div>
                <b>SpendWise v1.0</b>
                <p>React · Spring Boot · PostgreSQL · JWT</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AppShell>
  );
}

/* ────────────────────────────────────────────────────────────
   AUTH PAGES
   ──────────────────────────────────────────────────────────── */
function AuthLayout({ children, mode }) {
  return (
    <div className="auth-page">
      <AnimatedBackground />
      <div className="auth-left">
        <Logo />
        <div className="auth-art">
          <div className="auth-art-orb">₹</div>
          <span className="art-line art-line-one" />
          <span className="art-line art-line-two" />
          <div className="art-copy">
            <span className="eyebrow">A better money rhythm</span>
            <h2>
              {mode === 'login' ? (
                <>
                  Your clarity
                  <br />
                  <em>is waiting.</em>
                </>
              ) : (
                <>
                  Start with one
                  <br />
                  <em>good habit.</em>
                </>
              )}
            </h2>
            <p>Small entries turn into a bigger picture.</p>
          </div>
        </div>
        <span className="auth-left-foot">Track smarter. Spend wiser.</span>
      </div>
      <div className="auth-right">
        <Link className="auth-back" to="/">
          ← Back to home
        </Link>
        {children}
      </div>
    </div>
  );
}

function AuthForm({ mode }) {
  const isLogin = mode === 'login';
  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const strength = Math.min(
    4,
    [
      form.password.length >= 8,
      /[A-Z]/.test(form.password),
      /\d/.test(form.password),
      /[^A-Za-z0-9]/.test(form.password),
    ].filter(Boolean).length
  );

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
        toast.success('Welcome back.');
      } else {
        await register(form.email, form.password, form.fullName);
        toast.success('Your account is ready.');
      }
      navigate('/dashboard');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout mode={mode}>
      <div className="auth-form-wrap">
        <span className="eyebrow">{isLogin ? 'Welcome back' : 'Begin here'}</span>
        <h1>
          {isLogin ? (
            <>
              Log in to your
              <br />
              <em>money clarity.</em>
            </>
          ) : (
            <>
              Make the next rupee
              <br />
              <em>intentional.</em>
            </>
          )}
        </h1>
        <p className="auth-subtitle">
          {isLogin
            ? 'Your dashboard is ready when you are.'
            : 'A calmer way to understand where it goes.'}
        </p>
        <form className="auth-form" onSubmit={submit}>
          {!isLogin && (
            <label className="floating-field">
              <input
                required
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                placeholder=" "
              />
              <span>Full name</span>
            </label>
          )}
          <label className="floating-field">
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder=" "
            />
            <span>Email address</span>
          </label>
          <label className="floating-field password-field">
            <input
              required
              minLength="6"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder=" "
            />
            <span>Password</span>
            <button type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </label>
          {!isLogin && (
            <div className="strength">
              <div>
                {[0, 1, 2, 3].map((item) => (
                  <i
                    className={item < strength ? `level-${strength}` : ''}
                    key={item}
                  />
                ))}
              </div>
              <span>
                {strength < 2
                  ? 'Use 8+ characters'
                  : strength < 4
                  ? 'Getting stronger'
                  : 'Strong password'}
              </span>
            </div>
          )}
          {error && <div className="form-error">{error}</div>}
          <button
            className="button button-primary button-full auth-submit"
            disabled={busy}
          >
            {busy ? (
              <LoadingSpinner />
            ) : (
              <>
                {isLogin ? 'Log in' : 'Create my account'} <span>↗</span>
              </>
            )}
          </button>
        </form>
        <p className="auth-switch">
          {isLogin ? 'New to SpendWise?' : 'Already have an account?'}{' '}
          <Link to={isLogin ? '/register' : '/login'}>
            {isLogin ? 'Create an account' : 'Log in'}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

/* ────────────────────────────────────────────────────────────
   ROOT
   ──────────────────────────────────────────────────────────── */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#18213c',
              color: '#f7fafc',
              border: '1px solid rgba(255,255,255,.1)',
            },
          }}
        />
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<AuthForm mode="login" />} />
            <Route path="/register" element={<AuthForm mode="register" />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <Expenses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories"
              element={
                <ProtectedRoute>
                  <Categories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </BrowserRouter>
    </AuthProvider>
  );
}

export { api };
export default App;