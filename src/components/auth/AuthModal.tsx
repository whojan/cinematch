import { useState } from 'react';
import { X, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-success';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (userData: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  onForgotPassword: (email: string) => Promise<void>;
  isLoading?: boolean;
  initialMode?: AuthMode;
}

export const AuthModal = ({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  onForgotPassword,
  isLoading = false,
  initialMode = 'login'
}: AuthModalProps) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState('');

  if (!isOpen) return null;

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordError('E-posta adresi gerekli');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(forgotPasswordEmail)) {
      setForgotPasswordError('Geçersiz e-posta adresi');
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordError('');

    try {
      await onForgotPassword(forgotPasswordEmail);
      setMode('reset-success');
    } catch (error) {
      setForgotPasswordError(
        error instanceof Error ? error.message : 'Şifre sıfırlama başarısız. Lütfen tekrar deneyin.'
      );
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleClose = () => {
    setMode('login');
    setForgotPasswordEmail('');
    setForgotPasswordError('');
    onClose();
  };

  const renderForgotPasswordForm = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-theme-card border border-theme-primary rounded-2xl p-8 shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-xl inline-block mb-4">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-theme-primary mb-2">Şifremi Unuttum</h2>
          <p className="text-theme-secondary">
            E-posta adresinizi girin, şifre sıfırlama bağlantısını size gönderelim
          </p>
        </div>

        {/* Error Message */}
        {forgotPasswordError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <span className="text-red-400 text-sm">{forgotPasswordError}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
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
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                disabled={forgotPasswordLoading}
                className="w-full pl-10 pr-4 py-3 bg-theme-tertiary border border-theme-primary rounded-lg text-theme-primary placeholder-theme-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                placeholder="ornek@email.com"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={forgotPasswordLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {forgotPasswordLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Mail className="h-5 w-5" />
                <span>Sıfırlama Bağlantısı Gönder</span>
              </>
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setMode('login')}
            disabled={forgotPasswordLoading}
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            ← Giriş sayfasına geri dön
          </button>
        </div>
      </div>
    </div>
  );

  const renderSuccessMessage = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-theme-card border border-theme-primary rounded-2xl p-8 shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-xl inline-block mb-4">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-theme-primary mb-2">E-posta Gönderildi!</h2>
          <p className="text-theme-secondary">
            <span className="font-medium text-theme-primary">{forgotPasswordEmail}</span> adresine 
            şifre sıfırlama bağlantısı gönderildi.
          </p>
        </div>

        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
          <p className="text-green-400 text-sm text-center">
            E-postanızı kontrol edin ve bağlantıya tıklayarak şifrenizi sıfırlayın.
            Spam klasörünü de kontrol etmeyi unutmayın.
          </p>
        </div>

        {/* Back to Login */}
        <div className="text-center">
          <button
            onClick={() => setMode('login')}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
          >
            Giriş Sayfasına Dön
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Welcome Message for New Users */}
      {mode === 'register' && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-gradient-to-r from-blue-500/90 to-purple-500/90 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-2xl max-w-md text-center">
            <h1 className="text-2xl font-bold text-white mb-2">🎬 CineMatch'e Hoş Geldin!</h1>
            <p className="text-white/90 text-sm">
              Kişiselleştirilmiş film ve dizi önerileri için hemen hesap oluştur ve zevkini keşfetmeye başla!
            </p>
            <div className="mt-4 flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-xs font-medium">Yeni kullanıcılar için özel onboarding süreci</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md mx-auto">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute -top-4 -right-4 z-10 bg-theme-card border border-theme-primary rounded-full p-2 text-theme-tertiary hover:text-theme-primary transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Content Based on Mode */}
        {mode === 'login' && (
          <LoginForm
            onLogin={onLogin}
            onSwitchToRegister={() => setMode('register')}
            onForgotPassword={() => setMode('forgot-password')}
            isLoading={isLoading}
          />
        )}

        {mode === 'register' && (
          <RegisterForm
            onRegister={onRegister}
            onSwitchToLogin={() => setMode('login')}
            isLoading={isLoading}
          />
        )}

        {mode === 'forgot-password' && renderForgotPasswordForm()}

        {mode === 'reset-success' && renderSuccessMessage()}
      </div>
    </div>
  );
};
