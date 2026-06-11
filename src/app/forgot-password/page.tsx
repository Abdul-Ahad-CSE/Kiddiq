'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Mail, AlertCircle, ArrowRight, CheckCircle, ArrowLeft } from 'lucide-react';
import { requestPasswordReset } from '@/app/actions/auth-recovery';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data: ForgotPasswordFormValues) => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const result = await requestPasswordReset(data);
        if (result.success && 'message' in result) {
          setMessage(result.message);
        } else if ('error' in result) {
          setError(result.error);
        } else {
          setError("An unexpected error occurred. Please try again.");
        }
      } catch (err) {
        console.error('Forgot password error:', err);
        setError("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-blue-light via-slate-50 to-brand-blue-light/30 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100 relative overflow-hidden">
        {/* Aesthetic warm yellow background accent circle */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow-light/40 rounded-full blur-2xl -mr-10 -mt-10" />

        <div>
          <div className="flex justify-center">
            <span className="text-4xl font-extrabold text-brand-blue tracking-tight select-none">
              Kidd<span className="text-brand-yellow">iq</span>
            </span>
          </div>
          <h2 className="mt-6 text-center text-2xl font-bold text-slate-800">
            Forgot Password?
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {message ? (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-start space-x-2 text-sm animate-fade-in">
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-green-600" />
              <span>{message}</span>
            </div>
            <div className="text-center">
              <Link href="/login" className="inline-flex items-center text-sm font-semibold text-brand-blue hover:underline">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Log In
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start space-x-2 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    {...register('email')}
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`block w-full h-12 pl-10 pr-3 border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all duration-200 ${
                      errors.email ? 'border-red-300 focus:ring-red-500' : 'border-slate-200'
                    }`}
                    placeholder="name@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="group relative w-full h-12 flex justify-center items-center border border-transparent text-sm font-bold rounded-xl text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition-all duration-200 shadow-md shadow-brand-blue/20 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]"
              >
                {isPending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="flex items-center">
                    Send Reset Link <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </button>
            </div>

            <div className="text-center text-sm text-slate-600 mt-4">
              Remember your password?{' '}
              <Link href="/login" className="font-semibold text-brand-blue hover:underline">
                Log In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
