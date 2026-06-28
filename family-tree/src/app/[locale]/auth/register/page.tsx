import { Suspense } from 'react';
import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>
        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
