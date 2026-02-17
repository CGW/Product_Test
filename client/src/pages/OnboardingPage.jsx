import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTenant } from '../context/TenantContext.jsx';
import { api } from '../api/client.js';

export default function OnboardingPage() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.onboarding_completed) {
      navigate('/');
      return;
    }
    api.get('/onboarding/questions').then(d => setQuestions(d.questions)).catch(() => {});
  }, [user, navigate]);

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const answerList = Object.entries(answers).map(([question_id, answer]) => ({
        question_id,
        answer: String(answer),
      }));
      await api.post('/onboarding/submit', { answers: answerList });
      window.location.href = '/'; // Full reload to refresh user state
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const isWelcomeStep = currentStep === 0;
  const isQuestionStep = currentStep > 0 && currentStep <= questions.length;
  const isCompleteStep = currentStep > questions.length;

  const steps = [
    { type: 'welcome' },
    ...questions.map(q => ({ type: 'question', question: q })),
    { type: 'complete' },
  ];

  const step = steps[currentStep];

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: 500, width: '100%' }}>
        {/* Progress */}
        <div style={{ display: 'flex', gap: 4, marginBottom: '2rem' }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= currentStep ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          {step.type === 'welcome' && (
            <>
              <h1 style={{ marginBottom: '1rem' }}>Welcome!</h1>
              <p className="text-muted mb-4">
                Welcome to {tenant?.name || 'Oracle App'}. Let's get to know you a little before we begin.
              </p>
              <button className="btn btn-primary" onClick={() => setCurrentStep(1)}>
                Let's Get Started
              </button>
            </>
          )}

          {step.type === 'question' && (
            <>
              <h2 style={{ marginBottom: '1.5rem' }}>{step.question.question_text}</h2>

              {step.question.question_type === 'text' && (
                <input
                  type="text"
                  value={answers[step.question.id] || ''}
                  onChange={e => handleAnswer(step.question.id, e.target.value)}
                  placeholder="Type your answer..."
                  style={{ textAlign: 'center', fontSize: '1.1rem', marginBottom: '1.5rem' }}
                />
              )}

              {step.question.question_type === 'select' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {JSON.parse(step.question.options || '[]').map(option => (
                    <button key={option}
                      className={`btn ${answers[step.question.id] === option ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleAnswer(step.question.id, option)}
                      style={{ width: '100%' }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-between">
                <button className="btn btn-secondary" onClick={handleBack}>Back</button>
                <button className="btn btn-primary" onClick={handleNext}
                  disabled={!answers[step.question.id]}>
                  Next
                </button>
              </div>
            </>
          )}

          {step.type === 'complete' && (
            <>
              <h2 style={{ marginBottom: '1rem' }}>You're All Set!</h2>
              <p className="text-muted mb-4">
                Thank you for sharing. You're ready to explore {tenant?.name || 'your oracle readings'}.
              </p>
              <div className="flex gap-2" style={{ justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={handleBack}>Back</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Setting up...' : 'Enter the App'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
