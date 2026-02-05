'use client'

import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

const ConnectWallet: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const handleClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      // Connect with the first available connector or Web3Auth
      const connector = connectors[0];
      if (connector) {
        connect({ connector });
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg"
    >
      {address ? `Disconnect (${address.slice(0, 6)}...${address.slice(-4)})` : 'Connect Wallet'}
    </button>
  );
};

export default ConnectWallet;