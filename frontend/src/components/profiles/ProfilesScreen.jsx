import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Edit2, Trash2, LogIn, X, AlertTriangle, Folder, ChevronDown } from 'lucide-react';
import api from '../../services/api';

const ProfilesScreen = () => {
  const [profiles, setProfiles] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    currency: 'USD',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const data = await api.getProfiles();
      setProfiles(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    setError('');

    try {
      await api.createProfile(formData);
      setFormData({ name: '', currency: 'USD' });
      setShowCreateForm(false);
      fetchProfiles();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editingProfile || !formData.name.trim()) return;

    setLoading(true);
    setError('');

    try {
      await api.updateProfile(editingProfile.id, formData);
      setEditingProfile(null);
      setFormData({ name: '', currency: 'USD' });
      fetchProfiles();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditProfile = (profile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      currency: profile.currency,
    });
  };

  const cancelEdit = () => {
    setEditingProfile(null);
    setFormData({ name: '', currency: 'USD' });
  };

  const startDeleteProfile = (profile) => {
    setDeleteConfirm(profile);
    setPasswordConfirm('');
    setPasswordError('');
  };

  const verifyAndDelete = async () => {
    if (!deleteConfirm) return;

    if (!passwordConfirm) {
      setPasswordError('Введите пароль для подтверждения');
      return;
    }

    setLoading(true);
    setPasswordError('');

    try {
      const result = await api.verifyProfilePassword(deleteConfirm.id, passwordConfirm);

      if (result.valid) {
        await api.deleteProfile(deleteConfirm.id);
        setDeleteConfirm(null);
        setPasswordConfirm('');
        fetchProfiles();
      } else {
        setPasswordError('Неверный пароль');
      }
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterProfile = (profile) => {
    localStorage.setItem('currentProfile', JSON.stringify(profile));
    navigate('/workspace');
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const canCreateMoreProfiles = profiles.length < 3;

  // Компонент кастомного выбора валюты
  const CurrencySelect = ({ value, onChange, disabled }) => {
    const currencies = [
      { value: 'USD', label: 'USD ($)' },
      { value: 'EUR', label: 'EUR (€)' },
      { value: 'RUB', label: 'RUB (₽)' },
      { value: 'KZT', label: 'KZT (₸)' },
    ];

    return (
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="input w-full appearance-none pr-10"
          style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
        >
          {currencies.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary pointer-events-none"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl mx-auto w-full">
        {/* Модальное окно подтверждения удаления */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-surface border border-border rounded-xl p-6 max-w-md w-full animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertTriangle className="text-red-400" size={24} />
                  </div>
                  <h3 className="text-lg font-medium">Подтверждение удаления</h3>
                </div>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="text-text-disabled hover:text-text-primary transition-colors"
                  disabled={loading}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-text-secondary">
                  Вы уверены, что хотите удалить профиль <span className="font-medium text-text-primary">"{deleteConfirm.name}"</span>?
                </p>

                <div>
                  <label className="label">Пароль аккаунта для подтверждения</label>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => {
                      setPasswordConfirm(e.target.value);
                      setPasswordError('');
                    }}
                    className="input w-full"
                    placeholder="Введите пароль вашего аккаунта"
                    disabled={loading}
                    autoFocus
                  />
                  {passwordError && (
                    <p className="error-text mt-2">{passwordError}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={verifyAndDelete}
                    disabled={loading || !passwordConfirm}
                    className={`flex-1 py-3 rounded-lg font-medium transition-all duration-200 ${passwordConfirm && !loading
                      ? 'bg-red-600 text-white hover:bg-red-700 cursor-pointer'
                      : 'bg-surface-light text-text-disabled cursor-not-allowed'
                      }`}
                  >
                    {loading ? 'Проверка...' : 'Удалить профиль'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="btn-secondary flex-1"
                    disabled={loading}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="card animate-slide-up">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-xl font-medium">Профили</h1>
              <p className="text-text-secondary text-sm mt-1">
                {user?.nickname} • {profiles.length}/3 профилей
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary text-sm"
            >
              Выйти
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg animate-fade-in">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {showCreateForm ? (
            <div className="animate-fade-in">
              <h2 className="text-lg font-medium mb-4">Создать профиль</h2>
              <form onSubmit={handleCreateProfile} className="space-y-4">
                <div>
                  <label className="label">Название профиля</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    disabled={loading}
                    placeholder="Например: Личные финансы"
                  />
                </div>
                <div>
                  <label className="label">Валюта</label>
                  <CurrencySelect
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading || !formData.name}
                    className="btn-primary flex-1"
                  >
                    {loading ? 'Создание...' : 'Создать профиль'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormData({ name: '', currency: 'USD' });
                    }}
                    className="btn-secondary"
                    disabled={loading}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          ) : editingProfile ? (
            <div className="animate-fade-in">
              <h2 className="text-lg font-medium mb-4">Редактировать профиль</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="label">Название профиля</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    disabled={loading}
                    placeholder="Новое название профиля"
                  />
                </div>
                <div>
                  <label className="label">Валюта</label>
                  <CurrencySelect
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading || !formData.name}
                    className="btn-primary flex-1"
                  >
                    {loading ? 'Сохранение...' : 'Сохранить изменения'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="btn-secondary"
                    disabled={loading}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div className="mb-6">
                {profiles.length > 0 ? (
                  <div className="space-y-4">
                    {profiles.map((profile) => (
                      <div
                        key={profile.id}
                        className="group p-4 bg-surface-light rounded-lg border border-border transition-all hover:border-accent/30"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                                <span className="text-accent font-medium">
                                  {profile.currency === 'USD' ? '$' :
                                    profile.currency === 'EUR' ? '€' :
                                      profile.currency === 'RUB' ? '₽' : '₸'}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium">{profile.name}</div>
                                <div className="text-text-secondary text-sm mt-1">
                                  Валюта: {profile.currency}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEditProfile(profile)}
                              className="p-2 text-text-disabled hover:text-accent transition-colors rounded-lg hover:bg-accent/10"
                              title="Редактировать профиль"
                            >
                              <Edit2 size={18} />
                            </button>

                            <button
                              onClick={() => startDeleteProfile(profile)}
                              className="p-2 text-text-disabled hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                              title="Удалить профиль"
                            >
                              <Trash2 size={18} />
                            </button>

                            <button
                              onClick={() => handleEnterProfile(profile)}
                              className="flex items-center gap-2 px-4 py-2 bg-accent text-background rounded-lg hover:bg-accent-muted transition-colors"
                            >
                              <LogIn size={16} />
                              <span className="text-sm font-medium">Войти</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="flex justify-center mb-4">
                      <div className="p-4 bg-surface rounded-full">
                        <Folder size={40} className="text-text-disabled" />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium mb-2">Нет профилей</h3>
                    <p className="text-text-secondary text-sm">
                      Создайте профиль для начала работы
                    </p>
                  </div>
                )}
              </div>

              {canCreateMoreProfiles ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full p-4 border border-dashed border-border-light hover:border-accent rounded-lg text-text-secondary hover:text-text-primary transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl">+</span>
                    <span>Создать новый профиль ({profiles.length}/3)</span>
                  </div>
                </button>
              ) : (
                <div className="p-4 bg-surface-light border border-border rounded-lg text-center">
                  <p className="text-text-secondary">
                    Достигнут лимит профилей (3 максимум)
                  </p>
                  <p className="text-text-disabled text-sm mt-1">
                    Удалите один из существующих профилей, чтобы создать новый
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilesScreen;