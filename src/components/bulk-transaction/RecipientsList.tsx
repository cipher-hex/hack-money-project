import React from "react";
import { motion } from "framer-motion";
import {
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { Recipient } from "../../types/bulk-transaction";
import { formatAddress } from "../../utils/bulk-transaction/validation";
import { toast } from "react-toastify";

interface RecipientsListProps {
  recipients: Recipient[];
  selectedRecipients: number[];
  isLoading: boolean;
  onToggleSelect: (recipientId: number) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onEdit: (recipient: Recipient) => void;
  onDelete: (recipientId: number) => void;
}

const RecipientsList: React.FC<RecipientsListProps> = ({
  recipients,
  selectedRecipients,
  isLoading,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onEdit,
  onDelete,
}) => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (recipients.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No recipients added yet</p>
        <p className="text-gray-400 text-sm mt-2">
          Click "Add Recipient" to get started
        </p>
      </div>
    );
  }

  const allSelected =
    recipients.length > 0 &&
    recipients.every(
      (r) => r.id !== undefined && selectedRecipients.includes(r.id),
    );

  return (
    <div>
      {/* Selection Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={allSelected ? onClearSelection : onSelectAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {allSelected ? "Deselect All" : "Select All"}
          </button>
          {selectedRecipients.length > 0 && (
            <span className="text-sm text-gray-500">
              {selectedRecipients.length} selected
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() =>
                    allSelected ? onClearSelection() : onSelectAll()
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
              <th className="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Full Name
              </th>
              <th className="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Wallet Address
              </th>
              <th className="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Relation
              </th>
              <th className="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                User ID
              </th>
              <th className="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((recipient, index) => {
              const isSelected =
                recipient.id !== undefined &&
                selectedRecipients.includes(recipient.id);

              return (
                <motion.tr
                  key={recipient.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`border-b border-gray-50 hover:bg-blue-50/50 transition-colors duration-200 ${
                    isSelected ? "bg-blue-50/80" : ""
                  }`}
                >
                  <td className="py-4 px-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        recipient.id !== undefined &&
                        onToggleSelect(recipient.id)
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-semibold text-gray-900">
                      {recipient.fullName}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded-md">
                        {formatAddress(recipient.walletAddress)}
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(recipient.walletAddress, "Address")
                        }
                        className="p-1 hover:bg-gray-200 rounded-md transition-colors duration-200"
                        title="Copy address"
                      >
                        <DocumentDuplicateIcon className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {recipient.relation}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-500">
                      {recipient.userId || "-"}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onEdit(recipient)}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors duration-200 group"
                        title="Edit recipient"
                      >
                        <PencilIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                      </button>
                      <button
                        onClick={() =>
                          recipient.id !== undefined && onDelete(recipient.id)
                        }
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors duration-200 group"
                        title="Delete recipient"
                      >
                        <TrashIcon className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecipientsList;
