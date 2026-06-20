import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Button, Input } from '../../components/ui';

export default function LoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!email.trim()) { setError('Enter your email address.'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email address.'); return; }
    setError('');
    setLoading(true);
    try {
      navigate('/otp', { state: { email: email.trim().toLowerCase() } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-navy rounded-2xl flex items-center justify-center mb-4 shadow-card">
            <span className="text-white text-lg font-bold">NHL</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">NHL Connect</h1>
          <p className="text-sm text-gray-500 mt-1">Niche Healthcare Limited</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-6">Enter your work email to sign in.</p>

          <div className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              placeholder="you@nichehealthcare.co.zm"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleContinue()}
              icon={<Mail size={16} />}
              error={error}
              autoFocus
            />

            <Button
              variant="primary"
              className="w-full"
              onClick={handleContinue}
              loading={loading}
              icon={<ArrowRight size={16} />}
            >
              Continue
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          NHL Connect Desktop &mdash; Internal Staff Platform
        </p>
      </div>
    </div>
  );
}
