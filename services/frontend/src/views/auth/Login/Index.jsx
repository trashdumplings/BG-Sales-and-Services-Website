import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../stores/AuthProvider';
import { apiLoginChallenge } from '../../../utils/api';
import logo from '../../../assets/logo.png';
import './Login.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [challengeAnswer, setChallengeAnswer] = useState('');

  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      // Clear the state after showing the message
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // Remove auto-redirect to allow users to see the login page manually if they want
  // if (user) return <Navigate to={`/dashboard/${user.role}`} replace />;

  const loadChallenge = async () => {
    if (!email) return;
    try {
      const nextChallenge = await apiLoginChallenge(email);
      setChallenge(nextChallenge);
      setChallengeAnswer('');
    } catch (_) {
      setChallenge(null);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const u = await login(email, password, {
        rememberMe,
        challengeId: challenge?.challenge_id,
        challengeAnswer,
      });
      setChallenge(null);
      setChallengeAnswer('');
      navigate(`/dashboard/${u.role}`);
    } catch (err) {
      setError(err.message || 'Login failed');
      if (err.captchaRequired || err.status === 429 || err.status === 403) {
        await loadChallenge();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-wrap">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-header">
          <img src={logo} alt="BG Consultancy and Services" className="login-logo" />
          <h1 id="login-title">Sign In</h1>
          <p>Welcome back to BG Services Portal</p>
        </div>
        {success && <div className="login-success" role="status">{success}</div>}
        {error && <div className="login-error" role="alert">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input 
              type="email" 
              id="email"
              name="email"
              value={email} 
              onChange={(e)=>{
                setEmail(e.target.value);
                setChallenge(null);
                setChallengeAnswer('');
              }} 
              placeholder="Enter your email"
              autoComplete="username"
              inputMode="email"
              required 
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password"
              name="password"
              value={password} 
              onChange={(e)=>setPassword(e.target.value)} 
              placeholder="Enter your password"
              autoComplete="current-password"
              required 
            />
          </div>
          <div className="login-options">
            <label className="remember-option" htmlFor="rememberMe">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              className="forgot-link"
              onClick={() => setSuccess('Ask a system administrator to reset your password.')}
            >
              Forgot password?
            </button>
          </div>
          {challenge && (
            <div className="form-group challenge-group">
              <label htmlFor="challengeAnswer">Verification: {challenge.question}</label>
              <input
                type="text"
                id="challengeAnswer"
                name="challengeAnswer"
                value={challengeAnswer}
                onChange={(e) => setChallengeAnswer(e.target.value)}
                inputMode="numeric"
                autoComplete="off"
                required
              />
            </div>
          )}
          <button disabled={loading} type="submit" className="login-btn">
            {loading? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="login-footer">
          <p>Accounts are created and managed by a system administrator.</p>
        </div>
      </section>
    </main>
  );
}
