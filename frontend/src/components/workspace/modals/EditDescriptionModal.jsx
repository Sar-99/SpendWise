import React, { useState } from 'react';
import { X } from 'lucide-react';

const EditDescriptionModal = ({ isOpen, onClose, onSave, currentDescription, title = "Редактировать описание" }) => {
    const [description, setDescription] = useState(currentDescription);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(description.trim() || 'Без описания');
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[70] animate-fade-in">
            <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-medium">{title}</h2>
                    <button onClick={onClose} className="p-1 hover:bg-surface-light rounded">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="label">Новое описание</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="input w-full"
                                placeholder="Введите описание"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-border">
                            <button
                                type="submit"
                                className="flex-1 py-3 bg-accent text-white rounded-lg hover:bg-accent-muted font-medium transition-colors"
                            >
                                Сохранить
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 bg-surface text-text-primary rounded-lg hover:bg-surface-light transition-colors"
                            >
                                Отмена
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditDescriptionModal;