import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CurrencyDollarIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useAccount, useBalance, useChainId } from "wagmi";
import { useSwitchChain } from "wagmi";
import {
  useWeb3AuthConnect,
  useWeb3AuthDisconnect,
  useWeb3AuthUser,
} from "@web3auth/modal/react";

const MainHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNetworkMenuOpen, setIsNetworkMenuOpen] = useState(false);
  const location = useLocation();
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const chainId = useChainId();
  const { switchChain, chains } = useSwitchChain();

  // Web3Auth hooks
  const { connect, isConnected: web3AuthConnected } = useWeb3AuthConnect();
  const { disconnect } = useWeb3AuthDisconnect();
  const { userInfo } = useWeb3AuthUser();

  const navItems = [
    {
      href: "/",
      label: "Home",
    },
    {
      href: "/safe-transfer",
      label: "Safe P2P",
    },
    {
      href: "/bulk-transaction",
      label: "Bulk Transfer",
    },
    {
      href: "/bridge-swap",
      label: "Bridge & Swap",
    },
    {
      href: "/max-yield",
      label: "Max Yield",
    },
  ];

  // Use dynamic networks from wagmi chains
  const networks = chains.map((chain) => ({
    id: chain.id,
    name: chain.name,
    symbol: chain.nativeCurrency?.symbol || "ETH",
  }));

  const currentNetwork = networks.find((n) => n.id === chainId) || networks[0];

  const handleConnect = () => {
    connect(); // Web3Auth connect function
  };

  const handleNetworkSwitch = (networkId: number) => {
    switchChain({ chainId: networkId });
    setIsNetworkMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-lg border-b-2 border-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <CurrencyDollarIcon className="w-6 h-6 text-white" />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.href
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "text-gray-700 hover:text-blue-700 hover:bg-blue-50"
                }`}
              >
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Wallet Section */}
          <div className="flex items-center space-x-4">
            {(isConnected || web3AuthConnected) && address ? (
              <div className="flex items-center space-x-4">
                {/* Network Selector */}
                <div className="relative">
                  <button
                    onClick={() => setIsNetworkMenuOpen(!isNetworkMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <span>{currentNetwork.name}</span>
                    <ChevronDownIcon className="w-4 h-4" />
                  </button>

                  {isNetworkMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      {networks.map((network) => (
                        <button
                          key={network.id}
                          onClick={() => handleNetworkSwitch(network.id)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors ${
                            chainId === network.id
                              ? "bg-blue-100 text-blue-700"
                              : "text-gray-700"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{network.name}</span>
                            {chainId === network.id && (
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Balance Display */}
                {balance && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <p className="text-sm font-medium text-gray-900">
                      {parseFloat(balance.formatted).toFixed(4)}{" "}
                      {balance.symbol}
                    </p>
                  </div>
                )}

                {/* Wallet Address */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg px-4 py-2">
                  <p className="text-sm font-medium">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </p>
                </div>

                {/* Disconnect Button */}
                <button
                  onClick={() => disconnect()}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-medium text-sm transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Connect Wallet
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:text-blue-700 hover:bg-blue-50"
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 pt-4 pb-4">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.href
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "text-gray-700 hover:text-blue-700 hover:bg-blue-50"
                  }`}
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Click outside to close network menu */}
      {isNetworkMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsNetworkMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default MainHeader;
