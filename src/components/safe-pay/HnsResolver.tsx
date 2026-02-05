"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChainId } from "wagmi";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentDuplicateIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import {
  resolveHnsToAccountIdAndAddress,
  isValidHbarDomain,
  type HnsResolveResult,
} from "../../utils/hns-resolver";

interface HnsResolverProps {
  onAddressResolved?: (address: string, hnsName: string) => void;
  copyToClipboard?: (text: string, label: string) => void;
}

const HnsResolver: React.FC<HnsResolverProps> = ({
  onAddressResolved,
  copyToClipboard,
}) => {
  const [inputName, setInputName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resolveResult, setResolveResult] = useState<HnsResolveResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [resolvedDomain, setResolvedDomain] = useState<string>("");
  const chainId = useChainId();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputName(event.target.value);
    // Clear previous results when input changes
    if (error) setError(null);
    if (resolveResult) setResolveResult(null);
  };

  // Trigger HNS resolution on button click
  const handleResolve = async () => {
    const domain = inputName.trim();

    if (!domain) {
      setError("Please enter an HNS domain name");
      return;
    }

    if (!isValidHbarDomain(domain)) {
      setError(
        "Invalid domain format. Please enter a valid .hbar domain (e.g., hns.hbar)"
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setResolveResult(null);
    setResolvedDomain(domain);

    try {
      const result = await resolveHnsToAccountIdAndAddress(domain, chainId);

      if (result) {
        setResolveResult(result);
        console.log(
          `HNS resolved: ${domain} -> Account: ${result.accountId}, EVM: ${result.evmAddress}`
        );
      } else {
        setError(
          `Could not resolve HNS name "${domain}". Make sure it's registered and has an associated EVM address.`
        );
      }
    } catch (err) {
      console.error("HNS resolution error:", err);
      setError("Failed to resolve HNS name. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseAddress = () => {
    if (resolveResult && onAddressResolved) {
      onAddressResolved(resolveResult.evmAddress, resolvedDomain);
    }
  };

  const handleCopyAccountId = () => {
    if (resolveResult?.accountId && copyToClipboard) {
      copyToClipboard(resolveResult.accountId, "Hedera Account ID");
    }
  };

  const handleCopyEvmAddress = () => {
    if (resolveResult?.evmAddress && copyToClipboard) {
      copyToClipboard(resolveResult.evmAddress, "EVM Address");
    }
  };

  // Handle Enter key press
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !isLoading) {
      handleResolve();
    }
  };

  // Only show on Hedera testnet (chainId 296)
  if (chainId !== 296) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 shadow-sm p-6 hover:border-emerald-300 transition-colors duration-200">
      <h2 className="text-xl font-semibold mb-4 text-emerald-600 flex items-center space-x-2">
        <GlobeAltIcon className="w-5 h-5" />
        <span>HNS Resolver</span>
        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
          Hedera Only
        </span>
      </h2>

      <p className="text-sm text-gray-600 mb-4">
        Resolve Hedera Name Service (HNS) names to wallet addresses on Hedera
        testnet.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block mb-2 text-emerald-600 font-medium text-sm">
            HNS Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={inputName}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="w-full pl-4 pr-12 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter HNS name (e.g., hns.hbar)"
              disabled={isLoading}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isLoading ? (
                <ArrowPathIcon className="w-5 h-5 text-emerald-600 animate-spin" />
              ) : (
                <button
                  type="button"
                  onClick={handleResolve}
                  className="p-1 rounded hover:bg-emerald-100 transition-colors duration-200"
                  title="Resolve HNS"
                  disabled={isLoading}
                >
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-blue-50 border border-blue-200 rounded-xl"
            >
              <div className="flex items-center space-x-2">
                <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-blue-700 font-medium">
                  Resolving HNS name...
                </span>
              </div>
            </motion.div>
          )}

          {error && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-red-50 border border-red-200 rounded-xl"
            >
              <div className="flex items-start space-x-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-red-700 font-medium text-sm">
                  {error}
                </span>
              </div>
            </motion.div>
          )}

          {resolveResult && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-green-50 border border-green-200 rounded-xl"
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-medium">
                    HNS Resolved Successfully!
                  </span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-green-200">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-green-600 font-medium">
                        HNS Name:
                      </span>
                      <p className="text-green-800 font-semibold">
                        {resolvedDomain}
                      </p>
                    </div>

                    <div>
                      <span className="text-sm text-green-600 font-medium">
                        Hedera Account ID:
                      </span>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="font-mono text-sm text-green-800 bg-green-100 px-2 py-1 rounded">
                          {resolveResult.accountId}
                        </p>
                        {copyToClipboard && (
                          <button
                            onClick={handleCopyAccountId}
                            className="p-1 hover:bg-green-200 rounded transition-colors duration-200"
                            title="Copy Account ID"
                          >
                            <DocumentDuplicateIcon className="w-4 h-4 text-green-600" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-sm text-green-600 font-medium">
                        EVM Address:
                      </span>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="font-mono text-sm text-green-800 bg-green-100 px-2 py-1 rounded">
                          {resolveResult.evmAddress.substring(0, 8)}...
                          {resolveResult.evmAddress.substring(
                            resolveResult.evmAddress.length - 8
                          )}
                        </p>
                        {copyToClipboard && (
                          <button
                            onClick={handleCopyEvmAddress}
                            className="p-1 hover:bg-green-200 rounded transition-colors duration-200"
                            title="Copy EVM Address"
                          >
                            <DocumentDuplicateIcon className="w-4 h-4 text-green-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {onAddressResolved && (
                  <button
                    onClick={handleUseAddress}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Use This Address</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HnsResolver;
