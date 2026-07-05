import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Plus, 
  Award, 
  CheckCircle, 
  TrendingUp, 
  Star, 
  ArrowRight,
  Sparkles,
  Zap,
  Code,
  Layout,
  Layers,
  Users,
  FileText
} from 'lucide-react';
import api from '../services/api';

export default function Dashboard({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/interviews/history');
        setHistory(response.data);
      } catch (err) {
        console.error('Error fetching dashboard history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Compute metrics
  const completedInterviews = history.filter(item => item.status === 'completed');
  const totalCompleted = completedInterviews.length;
  
  const averageScore = totalCompleted > 0 
    ? Math.round(completedInterviews.reduce((acc, curr) => acc + curr.overallScore, 0) / totalCompleted)
    : 0;

  const bestScore = totalCompleted > 0
    ? Math.max(...completedInterviews.map(item => item.overallScore))
    : 0;

  // Determine candidate level badge
  let rank = 'Novice';
  let rankColor = 'hsl(var(--text-muted))';
  if (totalCompleted >= 8) {
    rank = 'Elite Expert';
    rankColor = 'hsl(var(--accent))';
  } else if (totalCompleted >= 4) {
    rank = 'Professional';
    rankColor = 'hsl(var(--secondary))';
  } else if (totalCompleted >= 1) {
    rank = 'Apprentice';
    rankColor = 'hsl(var(--primary))';
  }

  // Quick Start Actions
  const handleQuickStart = (role, type) => {
    navigate('/interview', { state: { presetRole: role, presetType: type } });
  };

  // SVG Chart rendering data
  const renderSVGChart = () => {
    if (completedInterviews.length === 0) {
      return (
        <div style={{
          height: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'hsl(var(--text-muted))',
          fontSize: '0.9rem'
        }}>
          Complete your first mock interview to unlock performance tracking charts.
        </div>
      );
    }

    // Sort ascending for chart (oldest to newest)
    const chartData = [...completedInterviews]
      .reverse()
      .slice(-6); // Max last 6 interviews
    
    const width = 600;
    const height = 180;
    const padding = 30;
    
    const pointsCount = chartData.length;
    const stepX = pointsCount > 1 ? (width - padding * 2) / (pointsCount - 1) : 0;
    
    // Map score (0-100) to Y position (height - padding to padding)
    const getPointY = (score) => {
      const scale = (height - padding * 2) / 100;
      return height - padding - (score * scale);
    };

    const points = chartData.map((d, index) => {
      const x = padding + index * stepX;
      const y = getPointY(d.overallScore);
      return { x, y, score: d.overallScore, date: new Date(d.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    
    // Fill path for background gradient
    const fillD = points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : '';

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[25, 50, 75, 100].map(val => {
          const y = getPointY(val);
          return (
            <g key={val}>
              <line 
                x1={padding} 
                y1={y} 
                x2={width - padding} 
                y2={y} 
                stroke="hsl(var(--border-light))" 
                strokeDasharray="4 4" 
              />
              <text 
                x={padding - 8} 
                y={y + 4} 
                fill="hsl(var(--text-dark))" 
                fontSize="10" 
                textAnchor="end"
              >
                {val}%
              </text>
            </g>
          );
        })}

        {/* Gradient fill */}
        {points.length > 0 && <path d={fillD} fill="url(#chartGlow)" />}

        {/* Core Line */}
        {points.length > 0 && (
          <path 
            d={pathD} 
            fill="none" 
            stroke="hsl(var(--primary))" 
            strokeWidth="3" 
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Point dots & score labels */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle 
              cx={p.x} 
              cy={p.y} 
              r="5" 
              fill="hsl(var(--secondary))" 
              stroke="hsl(var(--bg-card))" 
              strokeWidth="2" 
            />
            <text 
              x={p.x} 
              y={p.y - 12} 
              fill="white" 
              fontSize="11" 
              fontWeight="bold" 
              textAnchor="middle"
            >
              {p.score}
            </text>
            <text 
              x={p.x} 
              y={height - 10} 
              fill="hsl(var(--text-muted))" 
              fontSize="10" 
              textAnchor="middle"
            >
              {p.date}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            Welcome Back, {user?.name.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'hsl(var(--text-muted))', marginTop: '0.25rem' }}>
            Review your mock history and start polishing your skills.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/mcq" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} />
            <span>New MCQ Test</span>
          </Link>
          <Link to="/interview" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} />
            <span>New Mock Session</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <section className="metrics-grid">
        <div className="glass-card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>COMPLETED MOCKS</span>
            <CheckCircle size={20} style={{ color: 'hsl(var(--success))' }} />
          </div>
          <span className="metric-val">{totalCompleted}</span>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-dark))', marginTop: 'auto' }}>All categories</span>
        </div>

        <div className="glass-card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>AVERAGE SCORE</span>
            <TrendingUp size={20} style={{ color: 'hsl(var(--primary))' }} />
          </div>
          <span className="metric-val">{averageScore}%</span>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-dark))', marginTop: 'auto' }}>Passing target: 80%</span>
        </div>

        <div className="glass-card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>BEST SCORE</span>
            <Star size={20} style={{ color: 'hsl(var(--secondary))' }} />
          </div>
          <span className="metric-val">{bestScore}%</span>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-dark))', marginTop: 'auto' }}>Peak capability</span>
        </div>

        <div className="glass-card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>RANK LEVEL</span>
            <Award size={20} style={{ color: rankColor }} />
          </div>
          <span className="metric-val" style={{ fontSize: '1.75rem', marginTop: '0.85rem', color: rankColor, WebkitTextFillColor: 'initial' }}>{rank}</span>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-dark))', marginTop: 'auto' }}>Based on logs</span>
        </div>
      </section>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '2rem', alignItems: 'start' }}>
        {/* Performance Trend Chart */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} style={{ color: 'hsl(var(--secondary))' }} />
            Performance Trend
          </h3>
          <div style={{ width: '100%', height: '220px' }}>
            {loading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Fetching performance graphs...
              </div>
            ) : renderSVGChart()}
          </div>
        </div>

        {/* Quick Launch Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={20} style={{ color: 'hsl(var(--accent))' }} />
            Quick Practice
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div 
              className="glass-card" 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', cursor: 'pointer' }}
              onClick={() => handleQuickStart('Frontend Developer', 'Technical')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}>
                  <Layout size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem' }}>Frontend Developer</h4>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>React, Javascript, CSS & Web Dev</p>
                </div>
              </div>
              <ArrowRight size={18} style={{ color: 'hsl(var(--text-muted))' }} />
            </div>

            <div 
              className="glass-card" 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', cursor: 'pointer' }}
              onClick={() => handleQuickStart('Backend Developer', 'Technical')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: 'hsl(var(--secondary) / 0.15)', color: 'hsl(var(--secondary))' }}>
                  <Code size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem' }}>Backend Developer</h4>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Node.js, Databases, Scaling, APIs</p>
                </div>
              </div>
              <ArrowRight size={18} style={{ color: 'hsl(var(--text-muted))' }} />
            </div>

            <div 
              className="glass-card" 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', cursor: 'pointer' }}
              onClick={() => handleQuickStart('Software Engineer', 'System Design')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: 'hsl(var(--accent) / 0.15)', color: 'hsl(var(--accent))' }}>
                  <Layers size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem' }}>System Design</h4>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Caching, Microservices, Scalability</p>
                </div>
              </div>
              <ArrowRight size={18} style={{ color: 'hsl(var(--text-muted))' }} />
            </div>

            <div 
              className="glass-card" 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', cursor: 'pointer' }}
              onClick={() => handleQuickStart('General Developer', 'Behavioral')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: 'hsl(var(--success) / 0.15)', color: 'hsl(var(--success))' }}>
                  <Users size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem' }}>Behavioral Preparation</h4>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Leadership, Conflict, Adaptability</p>
                </div>
              </div>
              <ArrowRight size={18} style={{ color: 'hsl(var(--text-muted))' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent History Table */}
      <section style={{ marginTop: '3rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Recent Mock Sessions</h3>
        {loading ? (
          <div>Loading list...</div>
        ) : history.length === 0 ? (
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
            No interview history found. Click "New Mock Session" above to start your first interview!
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '1rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--border-light))', color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
                  <th style={{ padding: '1rem' }}>ROLE</th>
                  <th style={{ padding: '1rem' }}>TYPE</th>
                  <th style={{ padding: '1rem' }}>DIFFICULTY</th>
                  <th style={{ padding: '1rem' }}>DATE</th>
                  <th style={{ padding: '1rem' }}>SCORE</th>
                  <th style={{ padding: '1rem' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 5).map((session) => (
                  <tr key={session._id} style={{ borderBottom: '1px solid hsl(var(--border-light) / 0.5)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{session.role}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${session.type === 'Technical' ? 'badge-primary' : session.type === 'System Design' ? 'badge-warning' : 'badge-success'}`}>
                        {session.type}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{session.difficulty}</td>
                    <td style={{ padding: '1rem', color: 'hsl(var(--text-muted))' }}>
                      {new Date(session.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                      {session.status === 'completed' ? (
                        <span style={{ color: session.overallScore >= 80 ? 'hsl(var(--success))' : session.overallScore >= 65 ? 'hsl(var(--warning))' : 'hsl(var(--danger))' }}>
                          {session.overallScore}/100
                        </span>
                      ) : (
                        <span style={{ color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>Active</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <Link 
                        to={`/history#${session._id}`} 
                        className="btn-secondary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '4px' }}
                      >
                        View Report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
