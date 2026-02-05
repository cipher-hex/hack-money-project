"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEnsAddress, useChainId } from "wagmi";
import { sepolia } from "wagmi/chains";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentDuplicateIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

interface EnsResolverProps {
  onAddressResolved?: (address: string, ensName: string) => void;
  copyToClipboard?: (text: string, label: string) => void;
}

const EnsResolver: React.FC<EnsResolverProps> = ({
  onAddressResolved,
  copyToClipboard,
}) => {
  const [inputName, setInputName] = useState("");
  const [ensName, setEnsName] = useState("");
  const chainId = useChainId();

  const {
    data: address,
    isLoading,
    isError,
    error: ensError,
  } = useEnsAddress({
    name: ensName,
    // chainId: sepolia.id,
    universalResolverAddress: "0x3c85752a5d47DD09D677C645Ff2A938B38fbFEbA",
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputName(event.target.value);
  };

  // Trigger ENS resolution on button click
  const handleResolve = () => {
    if (inputName.trim() !== "") {
      setEnsName(inputName.trim());
    }
  };

  const handleUseAddress = () => {
    if (address && onAddressResolved) {
      onAddressResolved(address, ensName);
    }
  };

  const handleCopyAddress = () => {
    if (address && copyToClipboard) {
      copyToClipboard(address, "ENS Address");
    }
  };

  // Log errors to console for debugging
  useEffect(() => {
    if (isError && ensError) {
      console.error("ENS resolution error:", ensError);
    }
  }, [isError, ensError]);

  // Only show on sepolia network
  if (chainId !== sepolia.id) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-purple-200 shadow-sm p-6 hover:border-purple-300 transition-colors duration-200">
      <h2 className="text-xl font-semibold mb-4 text-purple-600 flex items-center space-x-2">
        <GlobeAltIcon className="w-5 h-5" />
        <span>ENS Resolver</span>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
          sepolia Only
        </span>
      </h2>

      <p className="text-sm text-gray-600 mb-4">
        Resolve Ethereum Name Service (ENS) names to wallet addresses on sepolia
        testnet.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block mb-2 text-purple-600 font-medium text-sm">
            ENS Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={inputName}
              onChange={handleInputChange}
              className="w-full pl-4 pr-12 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter ENS name (e.g., vitalik.eth)"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isLoading ? (
                <ArrowPathIcon className="w-5 h-5 text-purple-600 animate-spin" />
              ) : (
                <button
                  type="button"
                  onClick={handleResolve}
                  className="p-1 rounded hover:bg-purple-100 transition-colors duration-200"
                  title="Resolve ENS"
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
                  Resolving ENS name...
                </span>
              </div>
            </motion.div>
          )}

          {isError && ensName && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-red-50 border border-red-200 rounded-xl"
            >
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                <span className="text-red-700 font-medium">
                  Could not resolve ENS name "{ensName}"
                </span>
              </div>
            </motion.div>
          )}

          {address && !isLoading && (
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
                    ENS Resolved Successfully!
                  </span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-green-200">
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-green-600 font-medium">
                        ENS Name:
                      </span>
                      <p className="text-green-800 font-semibold">{ensName}</p>
                    </div>
                    <div>
                      <span className="text-sm text-green-600 font-medium">
                        Address:
                      </span>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="font-mono text-sm text-green-800 bg-green-100 px-2 py-1 rounded">
                          {address.substring(0, 8)}...
                          {address.substring(address.length - 8)}
                        </p>
                        {copyToClipboard && (
                          <button
                            onClick={handleCopyAddress}
                            className="p-1 hover:bg-green-200 rounded transition-colors duration-200"
                            title="Copy Address"
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
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
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

export default EnsResolver;
