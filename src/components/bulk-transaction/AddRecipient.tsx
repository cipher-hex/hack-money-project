import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { RecipientFormData, Recipient } from '../../types/bulk-transaction';
import { validateRecipientForm } from '../../utils/bulk-transaction/validation';

interface AddRecipientProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RecipientFormData) => Promise<void>;
  editingRecipient?: Recipient | null;
  isLoading?: boolean;
}

const AddRecipient: React.FC<AddRecipientProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingRecipient,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<RecipientFormData>({
    walletAddress: '',
    relation: '',
    fullName: '',
    userId: '',
  });

  const [error, setError] = useState<string>('');

  // Populate form when editing
  useEffect(() => {
    if (editingRecipient) {
      setFormData({
        walletAddress: editingRecipient.walletAddress,
        relation: editingRecipient.relation,
        fullName: editingRecipient.fullName,
        userId: editingRecipient.userId || '',
      });
    } else {
      // Reset form when adding new
      setFormData({
        walletAddress: '',
        relation: '',
        fullName: '',
        userId: '',
      });
    }
    setError('');
  }, [editingRecipient, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate form
    const validationError = validateRecipientForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save recipient');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {editingRecipient ? 'Edit Recipient' : 'Add New Recipient'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Wallet Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wallet Address *
              </label>
              <input
                type="text"
                value={formData.walletAddress}
                onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0x..."
                required
                disabled={isLoading}
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
                required
                disabled={isLoading}
              />
            </div>

            {/* Relation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relation *
              </label>
              <select
                value={formData.relation}
                onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isLoading}
              >
                <option value="">Select relation</option>
                <option value="Family">Family</option>
                <option value="Friend">Friend</option>
                <option value="Business Partner">Business Partner</option>
                <option value="Employee">Employee</option>
                <option value="Client">Client</option>
                <option value="Vendor">Vendor</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* User ID (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID (Optional)
              </label>
              <input
                type="text"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="@username or ID"
                disabled={isLoading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Buttons */}
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{editingRecipient ? 'Update' : 'Add'} Recipient</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddRecipient;
