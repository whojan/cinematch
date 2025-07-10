import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

interface RegisterFormProps {
  onRegister: (userData: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  onSwitchToLogin: () => void;
  isLoading?: boolean;
}

export const RegisterForm = ({ 
  onRegister, 
  onSwitchToLogin,
  isLoading = false 
}: RegisterFormProps) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // First Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Ad gerekli';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'Ad en az 2 karakter olmalı';
    }

    // Last Name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Soyad gerekli';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Soyad en az 2 karakter olmalı';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'E-posta adresi gerekli';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Geçersiz e-posta adresi';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Şifre gerekli';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Şifre en az 8 karakter olmalı';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermeli';
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifre tekrarı gerekli';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
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
      await onRegister({
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim()
      });
    } catch (error) {
      setErrors({ 
        general: error instanceof Error ? error.message : 'Kayıt başarısız. Lütfen tekrar deneyin.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    return strength;
  };

  const passwordStrength = getPasswordStrength();
  const isFormDisabled = isLoading || isSubmitting;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-theme-card border border-theme-primary rounded-2xl p-8 shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-brand-primary to-brand-secondary p-3 rounded-xl inline-block mb-4">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-theme-primary mb-2">Hesap Oluştur</h2>
          <p className="text-theme-secondary">CineMatch ailesine katıl</p>
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

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-2">
                Ad
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-theme-tertiary" />
                </div>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={isFormDisabled}
                  className={`w-full pl-10 pr-4 py-3 bg-theme-tertiary border rounded-lg text-theme-primary placeholder-theme-tertiary focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.firstName 
                      ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' 
                      : 'border-theme-primary focus:ring-blue-500/50 focus:border-blue-500/50'
                  } ${isFormDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="Adınız"
                  autoComplete="given-name"
                />
              </div>
              {errors.firstName && (
                <p className="mt-2 text-sm text-red-400">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-2">
                Soyad
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-theme-tertiary" />
                </div>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={isFormDisabled}
                  className={`w-full pl-10 pr-4 py-3 bg-theme-tertiary border rounded-lg text-theme-primary placeholder-theme-tertiary focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.lastName 
                      ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' 
                      : 'border-theme-primary focus:ring-blue-500/50 focus:border-blue-500/50'
                  } ${isFormDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="Soyadınız"
                  autoComplete="family-name"
                />
              </div>
              {errors.lastName && (
                <p className="mt-2 text-sm text-red-400">{errors.lastName}</p>
              )}
            </div>
          </div>

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
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
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
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={isFormDisabled}
                className={`w-full pl-10 pr-12 py-3 bg-theme-tertiary border rounded-lg text-theme-primary placeholder-theme-tertiary focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.password 
                    ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' 
                    : 'border-theme-primary focus:ring-blue-500/50 focus:border-blue-500/50'
                } ${isFormDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="Güçlü bir şifre oluşturun"
                autoComplete="new-password"
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
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex space-x-1 mb-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-2 flex-1 rounded-full transition-all duration-200 ${
                        level <= passwordStrength
                          ? passwordStrength <= 2 
                            ? 'bg-red-500' 
                            : passwordStrength <= 3 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                          : 'bg-theme-tertiary'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${
                  passwordStrength <= 2 ? 'text-red-400' : 
                  passwordStrength <= 3 ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {passwordStrength <= 2 ? 'Zayıf şifre' : 
                   passwordStrength <= 3 ? 'Orta seviye şifre' : 'Güçlü şifre'}
                </p>
              </div>
            )}
            
            {errors.password && (
              <p className="mt-2 text-sm text-red-400">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Şifre Tekrarı
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-theme-tertiary" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                disabled={isFormDisabled}
                className={`w-full pl-10 pr-12 py-3 bg-theme-tertiary border rounded-lg text-theme-primary placeholder-theme-tertiary focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.confirmPassword 
                    ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' 
                    : formData.confirmPassword && formData.password === formData.confirmPassword
                    ? 'border-green-500/50 focus:ring-green-500/50 focus:border-green-500/50'
                    : 'border-theme-primary focus:ring-blue-500/50 focus:border-blue-500/50'
                } ${isFormDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="Şifrenizi tekrar girin"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isFormDisabled}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-theme-primary transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-theme-tertiary" />
                ) : (
                  <Eye className="h-5 w-5 text-theme-tertiary" />
                )}
              </button>
              
              {/* Password Match Indicator */}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <div className="absolute inset-y-0 right-12 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
              )}
            </div>
            {errors.confirmPassword && (
              <p className="mt-2 text-sm text-red-400">{errors.confirmPassword}</p>
            )}
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
                <UserPlus className="h-5 w-5" />
                <span>Hesap Oluştur</span>
              </>
            )}
          </button>
        </form>

        {/* Switch to Login */}
        <div className="mt-8 pt-6 border-t border-theme-primary text-center">
          <p className="text-theme-secondary text-sm">
            Zaten hesabın var mı?{' '}
            <button
              onClick={onSwitchToLogin}
              disabled={isFormDisabled}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Giriş yap
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};