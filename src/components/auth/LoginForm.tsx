import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
  isLoading?: boolean;
}

export const LoginForm = ({ 
  onLogin, 
  onSwitchToRegister, 
  onForgotPassword,
  isLoading = false 
}: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'E-posta adresi gerekli';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Geçersiz e-posta adresi';
    }

    if (!password) {
      newErrors.password = 'Şifre gerekli';
    } else if (password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalı';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      await onLogin(email, password);
    } catch (error) {
      setErrors({ 
        general: error instanceof Error ? error.message : 'Giriş başarısız. Lütfen tekrar deneyin.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isLoading || isSubmitting;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-theme-card border border-theme-primary rounded-2xl p-8 shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-brand-primary to-brand-secondary p-3 rounded-xl inline-block mb-4">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-theme-primary mb-2">Hoş Geldin!</h2>
          <p className="text-theme-secondary">CineMatch hesabına giriş yap</p>
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <span className="text-red-400 text-sm">{errors.general}</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              E-posta Adresi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-theme-tertiary" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isFormDisabled}
                className={`w-full pl-10 pr-4 py-3 bg-theme-tertiary border rounded-lg text-theme-primary placeholder-theme-tertiary focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.email 
                    ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' 
                    : 'border-theme-primary focus:ring-blue-500/50 focus:border-blue-500/50'
                } ${isFormDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="ornek@email.com"
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <p className="mt-2 text-sm text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Şifre
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-theme-tertiary" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isFormDisabled}
                className={`w-full pl-10 pr-12 py-3 bg-theme-tertiary border rounded-lg text-theme-primary placeholder-theme-tertiary focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.password 
                    ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' 
                    : 'border-theme-primary focus:ring-blue-500/50 focus:border-blue-500/50'
                } ${isFormDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="Şifrenizi girin"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isFormDisabled}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-theme-primary transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-theme-tertiary" />
                ) : (
                  <Eye className="h-5 w-5 text-theme-tertiary" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-red-400">{errors.password}</p>
            )}
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <button
              type="button"
              onClick={onForgotPassword}
              disabled={isFormDisabled}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Şifremi unuttum
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isFormDisabled}
            className={`w-full bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary/90 hover:to-brand-secondary/90 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
              isFormDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:scale-[1.02]'
            }`}
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                <span>Giriş Yap</span>
              </>
            )}
          </button>
        </form>

        {/* Switch to Register */}
        <div className="mt-8 pt-6 border-t border-theme-primary text-center">
          <p className="text-theme-secondary text-sm">
            Henüz hesabın yok mu?{' '}
            <button
              onClick={onSwitchToRegister}
              disabled={isFormDisabled}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Hesap oluştur
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};