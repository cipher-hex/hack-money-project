import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  UsersIcon,
  WalletIcon,
  BanknotesIcon,
  UserCircleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { useAccount, useConnect, useDisconnect } from "wagmi";

const navItems = [
  { href: "/", label: "Home", icon: <HomeIcon className="w-5 h-5" /> },
  {
    href: "/safe-transfer",
    label: "Safe Transfer",
    icon: <ArrowRightIcon className="w-5 h-5" />,
  },
];

const Navbar: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleWalletClick = () => {
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="relative group">
            <motion.div
              className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-lg blur-lg group-hover:opacity-100 opacity-0 transition-opacity duration-300"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
            <motion.span
              className="relative text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 text-transparent bg-clip-text"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              SafePay
            </motion.span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.href} to={item.href}>
                <motion.div
                  className={`relative px-3 py-2 rounded-xl group transition-colors duration-200 ${
                    pathname === item.href
                      ? "text-blue-600"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {pathname === item.href && (
                    <motion.div
                      className="absolute inset-0 bg-blue-50 border border-blue-200 rounded-xl"
                      layoutId="navbar-active"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  <span className="relative flex items-center space-x-1">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                </motion.div>
              </Link>
            ))}

            {/* Wallet Button */}
            <motion.button
              onClick={handleWalletClick}
              className="relative flex items-center space-x-2 px-4 py-2 rounded-xl font-medium overflow-hidden group bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <WalletIcon className="w-5 h-5 text-white" />
              <span className="text-white font-medium">
                {address
                  ? `${address.slice(0, 6)}...${address.slice(-4)}`
                  : "Connect Wallet"}
              </span>
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden relative p-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isMenuOpen ? "close" : "open"}
                initial={{ opacity: 0, rotate: -180 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 180 }}
                transition={{ duration: 0.2 }}
              >
                {isMenuOpen ? (
                  <XMarkIcon className="w-6 h-6 text-slate-600" />
                ) : (
                  <Bars3Icon className="w-6 h-6 text-slate-600" />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="md:hidden absolute inset-x-0 top-full mt-2 mx-4 overflow-hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-4 space-y-2">
                {navItems.map((item) => (
                  <Link key={item.href} to={item.href}>
                    <motion.div
                      className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-colors ${
                        pathname === item.href
                          ? "bg-blue-50 text-blue-600 border border-blue-200"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </motion.div>
                  </Link>
                ))}

                <motion.button
                  onClick={() => {
                    handleWalletClick();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-3 rounded-xl font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <WalletIcon className="w-5 h-5" />
                  <span>
                    {address
                      ? `${address.slice(0, 6)}...${address.slice(-4)}`
                      : "Connect Wallet"}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
