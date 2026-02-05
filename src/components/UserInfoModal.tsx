import { useState } from "react";

interface UserInfoModalProps {
  userInfo: any;
  isOpen: boolean;
  onClose: () => void;
  chainInfo?: {
    id: number;
    name: string;
  };
}

export function UserInfoModal({
  userInfo,
  isOpen,
  onClose,
  chainInfo,
}: UserInfoModalProps) {
  if (!isOpen || !userInfo) return null;

  const renderTableRow = (key: string, value: any) => {
    if (value === null || value === undefined) {
      return (
        <tr key={key} className="hover:bg-slate-50 transition-colors">
          <td className="px-6 py-4 border-b border-slate-200 font-semibold text-slate-600 w-48 text-sm">{key}</td>
          <td className="px-6 py-4 border-b border-slate-200 text-slate-800 text-sm break-words">-</td>
        </tr>
      );
    }

    if (typeof value === "object") {
      return (
        <tr key={key} className="hover:bg-slate-50 transition-colors">
          <td className="px-6 py-4 border-b border-slate-200 font-semibold text-slate-600 w-48 text-sm">{key}</td>
          <td className="px-6 py-4 border-b border-slate-200 text-slate-800 text-sm break-words">
            <pre className="bg-slate-50 p-3 rounded-lg font-mono text-xs text-slate-600 border border-slate-200 overflow-x-auto whitespace-pre-wrap hover:border-blue-300 hover:bg-white transition-all">
              {JSON.stringify(value, null, 2)}
            </pre>
          </td>
        </tr>
      );
    }

    return (
      <tr key={key} className="hover:bg-slate-50 transition-colors">
        <td className="px-6 py-4 border-b border-slate-200 font-semibold text-slate-600 w-48 text-sm">{key}</td>
        <td className="px-6 py-4 border-b border-slate-200 text-slate-800 text-sm break-words">{String(value)}</td>
      </tr>
    );
  };

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-5 pt-24 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 max-w-4xl w-full max-h-[calc(100vh-12rem)] overflow-hidden animate-in slide-in-from-top-4 duration-300 hover:border-blue-300 transition-colors">
        <div className="flex items-center justify-between px-8 py-6 border-b-2 border-slate-200 bg-slate-50">
          <h3 className="text-xl font-bold text-slate-800">User Information</h3>
          <button 
            className="flex items-center justify-center p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all" 
            onClick={onClose}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z" />
            </svg>
          </button>
        </div>
        <div className="p-0 max-h-[calc(100vh-16rem)] overflow-auto">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-slate-50 px-6 py-4 text-left font-semibold text-slate-800 border-b border-slate-200 text-sm">Property</th>
                  <th className="bg-slate-50 px-6 py-4 text-left font-semibold text-slate-800 border-b border-slate-200 text-sm">Value</th>
                </tr>
              </thead>
              <tbody>
                {chainInfo && (
                  <>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 border-b border-slate-200 font-semibold text-slate-600 w-48 text-sm">Network</td>
                      <td className="px-6 py-4 border-b border-slate-200 text-slate-800 text-sm break-words">{chainInfo.name}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 border-b border-slate-200 font-semibold text-slate-600 w-48 text-sm">Chain ID</td>
                      <td className="px-6 py-4 border-b border-slate-200 text-slate-800 text-sm break-words">{chainInfo.id}</td>
                    </tr>
                  </>
                )}
                {Object.entries(userInfo).map(([key, value]) =>
                  renderTableRow(key, value)
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
