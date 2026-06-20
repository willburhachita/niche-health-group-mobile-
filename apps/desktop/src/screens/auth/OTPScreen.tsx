import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useAction } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Button } from '../../components/ui';
import { ArrowLeft, Mail } from 'lucide-react';

export default function OTPScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as any)?.email || '';
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isNotStaff, setIsNotStaff] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const sendOTP = useAction(api.notifications.sendOTPCode);
  const verifyOTP = useMutation(api.auth.verifyOTPCode);

  useEffect(() => {
    if (!email) { navigate('/login'); return; }
    handleSend();
  }, []);

  const handleSend = async () => {
    setSending(true);
    setError('');
    setIsNotStaff(false);
    try {
      const result = await sendOTP({ email });
      if (!result.success) {
        if (result.error === 'Account not found') {
          setIsNotStaff(true);
        } else {
          setError(result.error || 'Failed to send code.');
        }
      }
    } catch (e: any) {
      if (e.message?.includes('Account not found')) {
        setIsNotStaff(true);
      } else {
        setError(e.message || 'Failed to send code.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
    if (next.every(d => d) && val) handleVerify(next.join(''));
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handleVerify = async (code?: string) => {
    const otp = code || digits.join('');
    if (otp.length < 6) { setError('Enter all 6 digits.'); return; }
    setLoading(true);
    setError('');
    try {
      const result = await verifyOTP({ email, code: otp });
      if (result.success) {
        navigate('/password', { state: { email } });
      } else {
        setError(result.error || 'Invalid or expired code.');
        setDigits(['', '', '', '', '', '']);
        refs.current[0]?.focus();
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
          <button onClick={() => navigate('/login')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
            <ArrowLeft size={14} /> Back
          </button>

          <div className="flex items-center gap-2 mb-2">
            <Mail size={18} className="text-navy" />
            <h2 className="text-lg font-semibold text-gray-900">Check your email</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            We sent a 6-digit code to <span className="font-medium text-gray-900">{email}</span>
          </p>

          {isNotStaff ? (
            <div className="flex flex-col gap-4">
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-4 font-medium leading-relaxed">
                You are not registered as a staff member. Please contact your administrator to be added using "Add Staff".
              </div>
              <Button variant="primary" className="w-full mt-2" onClick={() => navigate('/login')}>
                Back to Login
              </Button>
            </div>
          ) : (
            <>
              <div className="flex gap-2 justify-center mb-5">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { refs.current[i] = el; }}
                    value={d}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    maxLength={1}
                    className="w-11 h-12 text-center text-xl font-bold border border-gray-200 rounded-xl focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none transition"
                    inputMode="numeric"
                  />
                ))}
              </div>

              {sending && (
                <div className="flex flex-col items-center gap-2 py-3 mb-2">
                  <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-gray-400">Sending code to your email…</p>
                </div>
              )}

              {error && !sending && (
                <p className="text-sm text-red-500 text-center mb-4 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button variant="primary" className="w-full" onClick={() => handleVerify()} loading={loading} disabled={sending}>
                Verify Code
              </Button>

              <button
                onClick={handleSend}
                disabled={sending || loading}
                className="w-full text-center text-sm text-navy hover:underline mt-4 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {sending
                  ? <><span className="inline-block w-3 h-3 border border-navy border-t-transparent rounded-full animate-spin" /> Sending…</>
                  : 'Resend code'
                }
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
