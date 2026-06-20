import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function PasswordScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as any)?.email || '';
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const verifyPassword = useMutation(api.auth.verifyPassword);

  const handleSignIn = async () => {
    if (!password) { setError('Enter your password.'); return; }
    setError(''); setLoading(true);
    try {
      const result = await verifyPassword({ email, password });
      if (result.success && result.account) {
        login({ email, accountId: result.account._id, role: result.account.role });
        navigate('/dashboard', { replace: true });
      } else {
        setError(result.error || 'Incorrect password.');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-navy rounded-2xl flex items-center justify-center mb-4 shadow-card">
            <span className="text-white text-lg font-bold">NHL</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8">
          <button onClick={() => navigate('/otp', { state: { email } })} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
            <ArrowLeft size={14} /> Back
          </button>

          <div className="flex items-center gap-2 mb-2">
            <Lock size={18} className="text-navy" />
            <h2 className="text-lg font-semibold text-gray-900">Enter your password</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Signing in as <span className="font-medium text-gray-900">{email}</span>
          </p>

          <div className="space-y-4">
            <div className="relative">
              <Input
                label="Password"
                type={show ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSignIn()}
                icon={<Lock size={16} />}
                error={error}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <Button variant="primary" className="w-full" onClick={handleSignIn} loading={loading}>
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
