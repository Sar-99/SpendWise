import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  icon: Icon = AlertTriangle,
  iconColor = "text-red-500",
  confirmText = "Подтвердить",
  cancelText = "Отмена"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${iconColor.replace('text-', 'bg-')}/20 rounded-lg`}>
              <Icon className={iconColor} size={24} />
            </div>
            <h3 className="text-lg font-medium">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-text-disabled hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          <p className="text-text-secondary">
            {description}
          </p>
        </div>

        <div className="flex gap-3 pt-2 flex-shrink-0 mt-4">
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-surface text-text-primary rounded-lg hover:bg-surface-light font-medium transition-colors"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;