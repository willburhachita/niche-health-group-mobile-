import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui';
import { useAuth } from '../hooks/useAuth';

export default function AccessDeniedScreen() {
  const navigate = useNavigate();
  const { role } = useAuth();

  const formattedRole = role
    ? role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')
    : 'Member';

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-surface">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-xl p-8 text-center space-y-6 transform transition-all duration-300 hover:shadow-2xl">
        
        {/* Animated Icon HUD */}
        <div className="relative mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
          <div className="absolute inset-0 bg-red-100/50 rounded-full animate-ping opacity-75" />
          <ShieldAlert className="relative w-10 h-10 text-red-500" />
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-navy uppercase tracking-wide">Access Restrained</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            You do not have the required permissions to view this clinic feature.
          </p>
        </div>

        {/* Role information */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs text-gray-500 font-medium">
          Logged in role: <span className="font-bold text-navy">{formattedRole}</span>
        </div>

        {/* Back Button */}
        <div className="pt-2">
          <Button 
            onClick={() => navigate('/dashboard')} 
            icon={<ArrowLeft size={15} />}
            variant="primary"
            className="w-full flex justify-center items-center gap-2 py-2.5"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
