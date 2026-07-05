import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  Award,
  Sparkles
} from 'lucide-react';
import api from '../services/api';

export default function McqRoom() {
  const location = useLocation();
  const navigate = useNavigate();

  const [step, setStep] = useState('setup');
  
  const [role, setRole] = useState('Frontend Developer');
  const [type, setType] = useState('Technical');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [session, setSession] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastFeedback, setLastFeedback] = useState(null);

  const [overallScore, setOverallScore] = useState(0);
  const [overallFeedback, setOverallFeedback] = useState('');
  const [confetti, setConfetti] = useState([]);

  useEffect(() => {
    if (location.state?.resumeSession) {
      const activeSession = location.state.resumeSession;
      setSession(activeSession);
      setRole(activeSession.role);
      setType(activeSession.type);
      setDifficulty(activeSession.difficulty);

      const questions = activeSession.questions || [];
      const activeIndex = questions.findIndex(q => !q.userAnswer);
      if (activeIndex !== -1) {
        setActiveQuestion(questions[activeIndex]);
        setStep('interviewing');
      } else {
        setStep('setup');
      }
    }
  }, [location.state]);

  const startInterview = async (e) => {
    if (e) e.preventDefault();
    if (!role) {
      setError('Please specify a target job role.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/interviews/mcq', { role, type, difficulty });
      setSession(response.data);
      const currentQuestions = response.data.questions;
      setActiveQuestion(currentQuestions[currentQuestions.length - 1]);
      setStep('interviewing');
    } catch (err) {
      console.error('Error starting MCQ session:', err);
      setError(err.response?.data?.message || 'Failed to start. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!selectedOption) {
      alert('Please select an option.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post(`/interviews/${session._id}/mcq-answer`, { answer: selectedOption });
      setLastFeedback(response.data.feedback);
      setSession(response.data.interview);
      setStep('feedback');
    } catch (err) {
      console.error('Error submitting response:', err);
      alert('Failed to submit response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    const questions = session.questions;
    const activeIndex = questions.findIndex(q => !q.userAnswer);
    
    if (activeIndex !== -1) {
      setActiveQuestion(questions[activeIndex]);
      setSelectedOption('');
      setLastFeedback(null);
      setStep('interviewing');
    } else {
      setOverallScore(session.overallScore);
      setOverallFeedback(session.overallFeedback);
      triggerConfetti();
      setStep('completed');
    }
  };

  const triggerConfetti = () => {
    const particles = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 50 - 50,
        size: Math.random() * 8 + 6,
        color: `hsl(${Math.random() * 360}, 90%, 60%)`,
        delay: Math.random() * 2,
        duration: Math.random() * 2.5 + 1.5,
        rotation: Math.random() * 360
      });
    }
    setConfetti(particles);
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {step === 'completed' && confetti.map(p => (
        <div 
          key={p.id}
          style={{
            position: 'fixed',
            left: `${p.x}%`,
            top: '0px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            zIndex: 1000,
            opacity: 0.8,
            transform: `rotate(${p.rotation}deg)`,
            pointerEvents: 'none',
            animation: `fadeIn ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
            transformOrigin: 'center'
          }}
        />
      ))}

      {/* SETUP PHASE */}
      {step === 'setup' && (
        <div className="animate-fade-in interview-config">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <Sparkles size={40} style={{ color: 'hsl(var(--primary))', marginBottom: '0.5rem' }} />
            <h1>Start Mock MCQ Test</h1>
            <p style={{ color: 'hsl(var(--text-muted))', marginTop: '0.25rem' }}>
              Configure your multiple-choice test.
            </p>
          </div>

          <div className="glass-card">
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'hsl(var(--danger) / 0.15)',
                border: '1px solid hsl(var(--danger) / 0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                color: 'hsl(var(--danger))',
                fontSize: '0.875rem'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={startInterview} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Target Job Role</label>
                <input 
                  type="text" 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)} 
                  placeholder="e.g. Frontend Developer, Backend Engineer, Product Manager"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Category</label>
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="Technical">Technical</option>
                    <option value="Behavioral">Behavioral</option>
                    <option value="System Design">System Design</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Difficulty Level</label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ padding: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}
                disabled={loading}
              >
                {loading ? 'Generating Test...' : 'Start MCQ Test'}
                <ChevronRight size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* INTERVIEWING PHASE */}
      {step === 'interviewing' && session && activeQuestion && (
        <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <span className="badge badge-primary">{session.type}</span>
              <span className="badge badge-warning" style={{ marginLeft: '0.5rem', textTransform: 'capitalize' }}>{session.difficulty}</span>
            </div>
            <span style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
              Question {session.questions.findIndex(q => q._id === activeQuestion._id) + 1} of 10
            </span>
          </div>

          <div className="glass-card question-panel" style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', lineHeight: '1.4' }}>{activeQuestion.questionText}</h2>
          </div>

          {/* Options Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {(activeQuestion.options || []).map((opt, idx) => (
              <div 
                key={idx}
                onClick={() => setSelectedOption(opt)}
                style={{
                  padding: '1rem 1.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${selectedOption === opt ? 'hsl(var(--primary))' : 'hsl(var(--border-light))'}`,
                  backgroundColor: selectedOption === opt ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--bg-dark))',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '1rem',
                  color: selectedOption === opt ? 'hsl(var(--primary))' : 'var(--text-color)'
                }}
              >
                {opt}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <button 
              onClick={() => {
                if(confirm('Are you sure you want to quit? History will not save fully.')) {
                  navigate('/dashboard');
                }
              }} 
              className="btn-secondary"
              disabled={submitting}
            >
              Quit Session
            </button>
            <button 
              onClick={submitAnswer} 
              className="btn-primary"
              disabled={submitting || !selectedOption}
            >
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          </div>
        </div>
      )}

      {/* FEEDBACK PHASE */}
      {step === 'feedback' && lastFeedback && activeQuestion && (
        <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={24} style={{ color: 'hsl(var(--success))' }} />
            Result
          </h2>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <h4 style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Question</h4>
              <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{activeQuestion.questionText}</p>
            </div>
          </div>

          <div className="glass-card feedback-box">
            {(() => {
              const score = lastFeedback.score;
              let bgColor = score === 100 ? 'hsl(var(--success) / 0.15)' : 'hsl(var(--danger) / 0.15)';
              let borderColor = score === 100 ? 'hsl(var(--success) / 0.3)' : 'hsl(var(--danger) / 0.3)';
              let textColor = score === 100 ? 'hsl(var(--success))' : 'hsl(var(--danger))';
              
              return (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  backgroundColor: bgColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.5rem',
                  color: textColor,
                  fontSize: '1rem',
                  fontWeight: 600
                }}>
                  <AlertCircle size={20} style={{ flexShrink: 0 }} />
                  <span>{lastFeedback.comments}</span>
                </div>
              );
            })()}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>
                Your Answer: <span style={{ color: 'var(--text-color)', fontWeight: 500 }}>{selectedOption}</span>
              </div>
              <div style={{ color: 'hsl(var(--success))', fontSize: '0.9rem' }}>
                Correct Answer: <span style={{ fontWeight: 500 }}>{activeQuestion.correctAnswer || selectedOption}</span>
              </div>
            </div>

            <div className="better-answer-box" style={{ 
              backgroundColor: 'hsl(var(--bg-dark))', 
              border: '1px solid hsl(var(--border-light))',
              borderLeft: '4px solid hsl(var(--primary))',
              padding: '1.25rem',
              borderRadius: 'var(--radius-sm)',
              marginTop: '1.5rem'
            }}>
              <h4 style={{ fontSize: '0.9rem', color: 'hsl(var(--secondary))', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} />
                Explanation
              </h4>
              <div style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))', lineHeight: '1.6' }}>
                {lastFeedback.betterAnswer || "No explanation provided."}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button onClick={handleNextQuestion} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>{session.questions.findIndex(q => !q.userAnswer) !== -1 ? 'Next Question' : 'View Final Analysis'}</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* COMPLETED REPORT PHASE */}
      {step === 'completed' && (
        <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <Award size={48} style={{ color: 'hsl(var(--secondary))', marginBottom: '0.5rem' }} />
            <h1>MCQ Test Complete!</h1>
            <p style={{ color: 'hsl(var(--text-muted))', marginTop: '0.25rem' }}>
              Your session evaluation results are ready.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', alignItems: 'start' }}>
            <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
              <h3 style={{ fontSize: '1rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Overall Score</h3>
              <div style={{ 
                width: '120px', 
                height: '120px', 
                borderRadius: '50%', 
                border: '6px solid hsl(var(--primary))', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '1.5rem auto',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                fontFamily: 'var(--font-title)',
                color: overallScore >= 80 ? 'hsl(var(--success))' : overallScore >= 65 ? 'hsl(var(--warning))' : 'hsl(var(--danger))',
                borderColor: overallScore >= 80 ? 'hsl(var(--success))' : overallScore >= 65 ? 'hsl(var(--warning))' : 'hsl(var(--danger))'
              }}>
                {overallScore}%
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'center' }}>
                <button onClick={() => navigate('/dashboard')} className="btn-secondary">
                  Go to Dashboard
                </button>
                <button onClick={() => navigate('/history')} className="btn-primary">
                  Review Questions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
