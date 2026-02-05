"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCircleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface RegisterUsernameProps {
  address: string;
  registeredUserId: string;
  registerUserId: Function;
  parseErrorMessage: Function;
  fetchUserId: Function;
}

const RegisterUsername: React.FC<RegisterUsernameProps> = ({
  address,
  registeredUserId,
  registerUserId,
  parseErrorMessage,
  fetchUserId,
}) => {
  const [userId, setUserId] = useState("");
  const [userIdLoading, setUserIdLoading] = useState(false);
  const [userIdError, setUserIdError] = useState("");
  const [userIdSuccess, setUserIdSuccess] = useState("");

  const handleRegisterUserId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      setUserIdError("Please connect your wallet first");
      return;
    }

    if (userId.length < 3) {
      setUserIdError("User ID must be at least 3 characters long");
      return;
    }

    setUserIdLoading(true);
    setUserIdError("");
    setUserIdSuccess("");

    try {
      await registerUserId(userId);
      setUserIdSuccess("User ID registered successfully! 🎉");
      setUserId("");
      fetchUserId();
    } catch (err: unknown) {
      console.error("User ID registration error:", err);
      setUserIdError(parseErrorMessage(err));
    } finally {
      setUserIdLoading(false);
    }
  };

  if (registeredUserId || !address) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:border-blue-300 transition-colors duration-200">
      <h2 className="text-xl font-semibold mb-6 text-blue-600 flex items-center space-x-2">
        <UserCircleIcon className="w-5 h-5" />
        <span>Register User ID</span>
      </h2>

      <p className="text-sm text-gray-500 mb-6">
        Choose a unique user ID to make it easier for others to send you funds.
        Register once and get a memorable ID for receiving transactions.
      </p>

      <form
        onSubmit={handleRegisterUserId}
        className="space-y-6"
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-blue-600 font-medium">User ID</label>
          </div>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter desired user ID (min 3 characters)"
            required
            minLength={3}
          />
        </div>

        <AnimatePresence mode="wait">
          {userIdError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700"
            >
              {userIdError}
            </motion.div>
          )}

          {userIdSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700"
            >
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-5 h-5" />
                <span>{userIdSuccess}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          disabled={userIdLoading}
        >
          {userIdLoading ? (
            <>
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              <span>Registering...</span>
            </>
          ) : (
            <>
              <UserCircleIcon className="w-5 h-5" />
              <span>Register User ID</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default RegisterUsername;
