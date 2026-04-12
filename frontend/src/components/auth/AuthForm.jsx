import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, HelpCircle, CheckCircle, XCircle } from 'lucide-react';

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    nickname: '',
    password: '',
    confirmPassword: '',
  });
  const [validationErrors, setValidationErrors] = useState({
    nickname: false,
    password: false,
    confirmPassword: false,
  });
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeRules, setActiveRules] = useState(null);
  const { login, register } = useAuth();

  const validateNickname = (value) => {
    if (!value) return false;
    if (value.length < 3) return true;
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) return true;
    return false;
  };

  const validatePassword = (value) => {
    if (!value) return false;
    if (value.length < 6) return true;
    if (/[а-яА-ЯЁё]/.test(value)) return true;
    return false;
  };

  const validateConfirmPassword = (value, password) => {
    if (!isLogin) {
      if (!value) return false;
      if (value !== password) return true;
    }
    return false;
  };

  const validateAllFields = () => {
    const errors = {
      nickname: validateNickname(formData.nickname),
      password: validatePassword(formData.password),
      confirmPassword: isLogin ? false : validateConfirmPassword(formData.confirmPassword, formData.password),
    };
    
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    const updatedFormData = { ...formData, [name]: value };
    
    if (serverError) setServerError('');
    
    const errors = {
      nickname: validateNickname(updatedFormData.nickname),
      password: validatePassword(updatedFormData.password),
      confirmPassword: isLogin ? false : validateConfirmPassword(
        updatedFormData.confirmPassword, 
        updatedFormData.password
      ),
    };
    
    setFormData(updatedFormData);
    setValidationErrors(errors);
  };

  const canSubmit = () => {
    const allRequiredFilled = isLogin
      ? formData.nickname && formData.password
      : formData.nickname && formData.password && formData.confirmPassword;
    
    if (!allRequiredFilled) return false;

    const errors = validateAllFields();
    const hasValidationErrors = Object.values(errors).some(error => error);
    
    return !hasValidationErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!canSubmit()) {
      const errors = validateAllFields();
      setValidationErrors(errors);
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.nickname, formData.password);
      } else {
        await register(formData.nickname, formData.password, formData.confirmPassword);
      }
    } catch (err) {
      const errorMessage = err.message;

      if (errorMessage.includes('Никнейм уже используется') || 
          errorMessage.includes('Пользователь с таким email или никнеймом уже существует')) {
        setServerError('Никнейм уже используется');
      } else if (errorMessage.includes('Неверные учетные данные') || 
                 errorMessage.includes('Неверный никнейм или пароль')) {
        setServerError('Неверные данные для входа');
      } else {
        setServerError('Ошибка соединения. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getFieldIcon = (fieldName) => {
    const hasError = validationErrors[fieldName];
    const value = formData[fieldName];
    const isValid = value && !hasError;
    
    if (hasError) {
      return {
        icon: XCircle,
        color: 'text-red-500',
        title: 'Есть ошибки'
      };
    } else if (isValid) {
      return {
        icon: CheckCircle,
        color: 'text-green-500',
        title: 'Всё верно'
      };
    } else {
      return {
        icon: HelpCircle,
        color: 'text-text-disabled hover:text-text-secondary',
        title: 'Правила заполнения'
      };
    }
  };

  const toggleRules = (fieldName) => {
    if (activeRules === fieldName) {
      setActiveRules(null);
    } else {
      setActiveRules(fieldName);
    }
  };

  const getPlaceholder = (fieldName) => {
    if (isLogin) {
      switch (fieldName) {
        case 'nickname': return 'Введите никнейм';
        case 'password': return 'Введите пароль';
        default: return '';
      }
    } else {
      switch (fieldName) {
        case 'nickname': return 'Придумайте уникальный никнейм';
        case 'password': return 'Придумайте пароль';
        case 'confirmPassword': return 'Повторите пароль';
        default: return '';
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      nickname: '',
      password: '',
      confirmPassword: '',
    });
    setValidationErrors({
      nickname: false,
      password: false,
      confirmPassword: false,
    });
    setServerError('');
    setActiveRules(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const RulesPanel = ({ fieldName }) => {
    if (activeRules !== fieldName) return null;
    
    const fieldRules = {
      nickname: {
        title: 'Правила для никнейма',
        rules: [
          'Минимум 3 символа',
          'Только латинские буквы (a-z, A-Z)',
          'Можно использовать цифры (0-9)',
          'Допустимы символы: - и _',
          'Уникальный для каждого пользователя'
        ]
      },
      password: {
        title: 'Правила для пароля',
        rules: [
          'Минимум 6 символов',
          'Только латинские буквы (a-z, A-Z)',
          'Можно использовать цифры (0-9)',
          'Допустимы специальные символы',
          'Без кириллических символов'
        ]
      },
      confirmPassword: {
        title: 'Подтверждение пароля',
        rules: [
          'Должен совпадать с паролем',
          'Обязательно для регистрации'
        ]
      }
    };
    
    const rules = fieldRules[fieldName];
    const hasError = validationErrors[fieldName];
    
    return (
      <div className="mt-2 p-4 bg-surface border border-border rounded-lg animate-fade-in">
        <h4 className="font-medium mb-2">{rules.title}</h4>
        <ul className="space-y-1 text-sm text-text-secondary">
          {rules.rules.map((rule, index) => (
            <li key={index} className="flex items-start">
              <span className="mr-2">•</span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
        {hasError && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-red-400 text-sm font-medium">
              Поле содержит ошибки
            </p>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const errors = validateAllFields();
    setValidationErrors(errors);
  }, [isLogin]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 animate-fade-in">
      <div className="max-w-md mx-auto w-full">
        <div className="card animate-slide-up">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-medium mb-2">
              {isLogin ? 'Вход' : 'Регистрация'}
            </h1>
            <p className="text-text-secondary text-sm">
              {isLogin ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {serverError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg animate-fade-in">
                <p className="text-red-400 text-sm text-center">{serverError}</p>
              </div>
            )}

            {/* Поле никнейма */}
            <div>
              <div className="label mb-1">Никнейм</div>
              <div className="relative">
                <input
                  name="nickname"
                  type="text"
                  value={formData.nickname}
                  onChange={handleChange}
                  className="input pr-10"
                  disabled={loading}
                  placeholder={getPlaceholder('nickname')}
                />
                <button
                  type="button"
                  onClick={() => toggleRules('nickname')}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                    getFieldIcon('nickname').color
                  }`}
                  title={getFieldIcon('nickname').title}
                >
                  {React.createElement(getFieldIcon('nickname').icon, { size: 18 })}
                </button>
              </div>
              <RulesPanel fieldName="nickname" />
            </div>

            {/* Поле пароля */}
            <div>
              <div className="label mb-1">Пароль</div>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  className="input pr-24"
                  disabled={loading}
                  placeholder={getPlaceholder('password')}
                />
                <button
                  type="button"
                  onClick={() => toggleRules('password')}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                    getFieldIcon('password').color
                  }`}
                  title={getFieldIcon('password').title}
                >
                  {React.createElement(getFieldIcon('password').icon, { size: 18 })}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-10 top-1/2 transform -translate-y-1/2 text-text-disabled hover:text-text-secondary"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <RulesPanel fieldName="password" />
            </div>

            {/* Подтверждение пароля (только для регистрации) */}
            {!isLogin && (
              <div>
                <div className="label mb-1">Подтвердите пароль</div>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input pr-24"
                    disabled={loading}
                    placeholder={getPlaceholder('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => toggleRules('confirmPassword')}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                      getFieldIcon('confirmPassword').color
                    }`}
                    title={getFieldIcon('confirmPassword').title}
                  >
                    {React.createElement(getFieldIcon('confirmPassword').icon, { size: 18 })}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-10 top-1/2 transform -translate-y-1/2 text-text-disabled hover:text-text-secondary"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <RulesPanel fieldName="confirmPassword" />
              </div>
            )}

            {/* Кнопка отправки */}
            <button
              type="submit"
              disabled={loading || !canSubmit()}
              className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${
                canSubmit() && !loading
                  ? 'bg-accent text-background hover:bg-accent-muted cursor-pointer'
                  : 'bg-surface-light text-text-disabled cursor-not-allowed'
              }`}
            >
              {loading ? 'Обработка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
            </button>
          </form>

          {/* Переключение между входом и регистрацией */}
          <div className="mt-6 pt-6 border-t border-border">
            <button
              onClick={toggleMode}
              className="w-full text-center text-text-secondary hover:text-text-primary transition-colors text-sm"
              disabled={loading}
            >
              {isLogin ? 'Нет аккаунта? Создать' : 'Уже есть аккаунт? Войти'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;