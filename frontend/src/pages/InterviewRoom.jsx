import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Mic, 
  MicOff, 
  ChevronRight, 
  CheckCircle, 
  RefreshCw, 
  Sparkles,
  AlertCircle,
  HelpCircle,
  Award,
  ChevronLeft
} from 'lucide-react';
import api from '../services/api';

export default function InterviewRoom() {
  const location = useLocation();
  const navigate = useNavigate();

  // Route presets from dashboard quick starts
  const presetRole = location.state?.presetRole || '';
  const presetType = location.state?.presetType || '';

  // Step state: 'setup' | 'interviewing' | 'feedback' | 'completed'
  const [step, setStep] = useState('setup');
  
  // Configuration State
  const [role, setRole] = useState(presetRole || 'Frontend Developer');
  const [type, setType] = useState(presetType || 'Technical');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Active Session State
  const [session, setSession] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastFeedback, setLastFeedback] = useState(null);

  // Overall Results
  const [overallScore, setOverallScore] = useState(0);
  const [overallFeedback, setOverallFeedback] = useState('');

  // Speech Recognition state
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const recognitionRef = useRef(null);

  // Confetti particles state
  const [confetti, setConfetti] = useState([]);

  useEffect(() => {
    // Check speech recognition capability
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setRecognitionSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setAnswer(prev => {
            const spacing = prev && !prev.endsWith(' ') ? ' ' : '';
            return prev + spacing + finalTranscript;
          });
        }
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

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

  const toggleRecording = () => {
    if (!recognitionSupported || !recognitionRef.current) {
      alert('Speech-to-Text is not supported on this browser. Please type your response.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const startInterview = async (e) => {
    if (e) e.preventDefault();
    if (!role) {
      setError('Please specify a target job role.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/interviews', { role, type, difficulty });
      setSession(response.data);
      // Retrieve the first question
      const currentQuestions = response.data.questions;
      setActiveQuestion(currentQuestions[currentQuestions.length - 1]);
      setStep('interviewing');
    } catch (err) {
      console.error('Error starting interview:', err);
      setError(err.response?.data?.message || 'Failed to start interview. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) {
      alert('Please type or speak your answer before submitting.');
      return;
    }

    // Stop voice recorder if active
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setSubmitting(true);
    try {
      const response = await api.post(`/interviews/${session._id}/answer`, { answer });
      
      setLastFeedback(response.data.feedback);
      setSession(response.data.interview);
      
      setStep('feedback');
    } catch (err) {
      console.error('Error submitting response:', err);
      alert(err.response?.data?.message || 'Failed to submit response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleIDontKnow = async () => {
    const text = "I don't know the answer. Please explain the correct concepts and provide the correct response.";
    setAnswer(text);

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setSubmitting(true);
    try {
      const response = await api.post(`/interviews/${session._id}/answer`, { answer: text });
      setLastFeedback(response.data.feedback);
      setSession(response.data.interview);
      setStep('feedback');
    } catch (err) {
      console.error('Error getting help:', err);
      alert(err.response?.data?.message || 'Failed to contact AI Coach. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    const questions = session.questions;
    const activeIndex = questions.findIndex(q => !q.userAnswer);
    
    if (activeIndex !== -1) {
      setActiveQuestion(questions[activeIndex]);
      setAnswer('');
      setLastFeedback(null);
      setStep('interviewing');
    } else {
      // Completed! Compute results
      setOverallScore(session.overallScore);
      setOverallFeedback(session.overallFeedback);
      triggerConfetti();
      setStep('completed');
    }
  };

  const renderMarkdown = (text) => {
    if (!text) return '';
    
    // Normalize line endings to avoid Carriage Return quirks on Windows/other systems
    let html = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
      
    // Parse Javascript/generic code blocks
    html = html.replace(/\`\`\`javascript([\s\S]*?)\`\`\`/gim, (match, code) => {
      return `<pre style="background: hsl(var(--bg-dark)); padding: 0.75rem; border-radius: var(--radius-sm); margin: 0.5rem 0; font-family: monospace; font-size: 0.85rem; overflow-x: auto; border: 1px solid hsl(var(--border-light)); color: #a9b1d6;">${code.trim()}</pre>`;
    });
    
    html = html.replace(/\`\`\`([\s\S]*?)\`\`\`/gim, (match, code) => {
      return `<pre style="background: hsl(var(--bg-dark)); padding: 0.75rem; border-radius: var(--radius-sm); margin: 0.5rem 0; font-family: monospace; font-size: 0.85rem; overflow-x: auto; border: 1px solid hsl(var(--border-light));">${code.trim()}</pre>`;
    });

    // Parse inline code segments
    html = html.replace(/\`([^\`]+)\`/gim, '<code style="background: hsl(var(--bg-dark)); padding: 0.1rem 0.3rem; border-radius: 3px; font-family: monospace; font-size: 0.9rem;">$1</code>');

    // Parse lines to detect header patterns, lists and bullets
    const lines = html.split('\n');
    const processedLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('###')) {
        return `<h4 style="margin: 1rem 0 0.5rem 0; color: hsl(var(--secondary)); font-weight: 600; font-size: 1.05rem;">${trimmed.substring(3).trim()}</h4>`;
      }
      if (trimmed.startsWith('##')) {
        return `<h3 style="margin: 1.25rem 0 0.75rem 0; color: hsl(var(--primary)); font-weight: 700; font-size: 1.2rem;">${trimmed.substring(2).trim()}</h3>`;
      }
      if (trimmed.startsWith('#')) {
        return `<h2 style="margin: 1.5rem 0 1rem 0; color: hsl(var(--primary)); font-weight: 700; font-size: 1.4rem;">${trimmed.substring(1).trim()}</h2>`;
      }
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return `<li style="margin-left: 1.25rem; margin-bottom: 0.35rem; list-style-type: disc;">${trimmed.substring(1).trim()}</li>`;
      }
      return line;
    });

    html = processedLines.join('\n');

    // Parse bold tags
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert breaks
    html = html.replace(/\n/g, '<br />');

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const triggerConfetti = () => {
    const particles = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        id: i,
        x: Math.random() * 100, // percentage x
        y: Math.random() * 50 - 50, // start above viewport
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
      {/* Confetti Render */}
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
            <h1>Start Mock Interview</h1>
            <p style={{ color: 'hsl(var(--text-muted))', marginTop: '0.25rem' }}>
              Configure your customized simulator and evaluate responses.
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
                  <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Interview Type</label>
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
                {loading ? 'Generating Simulator...' : 'Initialize Interview'}
                <ChevronRight size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* INTERVIEWING PHASE */}
      {step === 'interviewing' && session && activeQuestion && (
        <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Progress Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <span className="badge badge-primary">{session.type}</span>
              <span className="badge badge-warning" style={{ marginLeft: '0.5rem', textTransform: 'capitalize' }}>{session.difficulty}</span>
            </div>
            <span style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
              Question {session.questions.findIndex(q => q._id === activeQuestion._id) + 1} of 20
            </span>
          </div>

          <div className="glass-card question-panel">
            <h2 style={{ fontSize: '1.5rem', lineHeight: '1.4' }}>{activeQuestion.questionText}</h2>
          </div>

          {/* Voice Input Recorder */}
          <div className="voice-input-wrapper">
            <button 
              onClick={toggleRecording} 
              className={`mic-button ${isRecording ? 'recording' : ''}`}
              title={isRecording ? 'Stop Recording' : 'Start Speaking'}
            >
              {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
            <span style={{ fontSize: '0.85rem', color: isRecording ? 'hsl(var(--danger))' : 'hsl(var(--text-muted))', fontWeight: 600 }}>
              {isRecording ? 'Listening... Speak clearly into your microphone.' : 'Click to Speak (Web Speech API) or Type below'}
            </span>
            
            {isRecording && (
              <div className="voice-visualizer">
                <div className="voice-bar"></div>
                <div className="voice-bar"></div>
                <div className="voice-bar"></div>
                <div className="voice-bar"></div>
                <div className="voice-bar"></div>
              </div>
            )}
          </div>

          {/* Answer Area */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>Your Response</label>
              <textarea 
                rows="6" 
                placeholder="Formulate your response here..." 
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={submitting}
              />
            </div>

             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <button 
                onClick={handleIDontKnow}
                className="btn-secondary"
                style={{ 
                  backgroundColor: 'hsl(var(--primary) / 0.1)', 
                  borderColor: 'hsl(var(--primary) / 0.3)',
                  color: 'hsl(var(--primary))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
                disabled={submitting}
              >
                <HelpCircle size={16} />
                <span>I don't know - Ask AI</span>
              </button>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => {
                    if(confirm('Are you sure you want to quit this interview session? History will not save fully.')) {
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
                  disabled={submitting || !answer.trim()}
                >
                  {submitting ? 'Analyzing Answer...' : 'Submit Answer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK PHASE */}
      {step === 'feedback' && lastFeedback && activeQuestion && (
        <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={24} style={{ color: 'hsl(var(--success))' }} />
            AI Interviewer Feedback
          </h2>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <h4 style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Question</h4>
              <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{activeQuestion.questionText}</p>
            </div>

            <div style={{ borderTop: '1px solid hsl(var(--border-light))', paddingTop: '1.5rem' }}>
              <h4 style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Your Answer</h4>
              <p style={{ fontStyle: 'italic', color: 'hsl(var(--text-muted))' }}>"{answer}"</p>
            </div>
          </div>

          <div className="glass-card feedback-box">
            {/* Status Banner */}
            {(() => {
              const score = lastFeedback.score;
              let bgColor = 'hsl(var(--warning) / 0.15)';
              let borderColor = 'hsl(var(--warning) / 0.3)';
              let textColor = 'hsl(var(--warning))';
              let textMessage = "Not fully correct. Some additions needed.";

              if (score >= 80) {
                bgColor = 'hsl(var(--success) / 0.15)';
                borderColor = 'hsl(var(--success) / 0.3)';
                textColor = 'hsl(var(--success))';
                textMessage = "Correct answer!";
              } else if (score < 40) {
                bgColor = 'hsl(var(--danger) / 0.15)';
                borderColor = 'hsl(var(--danger) / 0.3)';
                textColor = 'hsl(var(--danger))';
                textMessage = "Wrong answer. Let's review the proper solution below.";
              }

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
                  fontSize: '0.95rem',
                  fontWeight: 600
                }}>
                  <AlertCircle size={18} style={{ flexShrink: 0, color: textColor }} />
                  <span>{textMessage}</span>
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'hsl(var(--primary))' }}>Evaluation score</h3>
              <span style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: lastFeedback.score >= 80 ? 'hsl(var(--success))' : lastFeedback.score >= 65 ? 'hsl(var(--warning))' : 'hsl(var(--danger))' 
              }}>
                {lastFeedback.score}/100
              </span>
            </div>

            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>{lastFeedback.comments}</p>

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
                Correct & Proper Answer (Generated via AI)
              </h4>
              <div style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))', lineHeight: '1.6' }}>
                {renderMarkdown(lastFeedback.betterAnswer.replace(/### Correct and Proper Answer:\n/g, ''))}
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
            <h1>Interview Complete!</h1>
            <p style={{ color: 'hsl(var(--text-muted))', marginTop: '0.25rem' }}>
              Your session evaluation results are ready.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
            {/* Left Score Card */}
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
                {overallScore}
              </div>
              <span className="badge badge-primary" style={{ fontSize: '0.8rem' }}>{role}</span>
            </div>

            {/* Right Feedback Details */}
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid hsl(var(--border-light))', paddingBottom: '0.75rem' }}>
                Coach Evaluation Review
              </h3>
              
              <div 
                style={{ 
                  fontSize: '0.95rem', 
                  lineHeight: '1.6', 
                  color: 'hsl(var(--text-muted))'
                }}
              >
                {renderMarkdown(overallFeedback)}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
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
