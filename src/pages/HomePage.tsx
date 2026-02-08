import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheckIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";
import MainHeader from "../components/shared/MainHeader";

const HomePage: React.FC = () => {
  const features = [
    {
      icon: <ArrowPathIcon className="w-8 h-8" />,
      title: "Bridge & Swap",
      description:
        "Swap and bridge tokens across 50+ chains seamlessly using LI.FI SDK. Best rates guaranteed.",
      link: "/bridge-swap",
      color: "purple",
    },
    {
      icon: <ArrowTrendingUpIcon className="w-8 h-8" />,
      title: "Max Yield",
      description:
        "Earn maximum APY on stablecoins. optimized yields via Morpho and Aave V3 protocols.",
      link: "/max-yield",
      color: "green",
    },
    {
      icon: <BoltIcon className="w-8 h-8" />,
      title: "Universal Payment",
      description:
        "Instant off-chain settlements with zero gas fees using Yellow Network state channels.",
      link: "/universal-pay",
      color: "yellow",
    },
    {
      icon: <ShieldCheckIcon className="w-8 h-8" />,
      title: "Secure P2P",
      description:
        "Send payments safely with built-in escrow protection. Funds are held securely until claimed.",
      link: "/safe-transfer",
      color: "blue",
    },
    {
      icon: <UserGroupIcon className="w-8 h-8" />,
      title: "Bulk Transfer",
      description:
        "Send payments to multiple recipients at once. Efficiently manage payroll and distributions.",
      link: "/bulk-transaction",
      color: "indigo",
    },
    {
      icon: <CurrencyDollarIcon className="w-8 h-8" />,
      title: "Multi-Asset Support",
      description:
        "Full support for ETH, USDC, USDT and other ERC-20 tokens across all supported networks.",
      link: "/safe-transfer",
      color: "orange",
    },
  ];

  const benefits = [
    "🌐 **50+ Chains Supported** - Bridge and swap across major networks",
    "� **High Yields** - Optimized stablecoin returns via Morpho/Aave",
    "⚡ **Instant Settlement** - Zero-gas off-chain payments via Yellow",
    "🛡️ **Escrow Protection** - Secure P2P transfers",
    "📦 **Bulk Processing** - Efficient multi-recipient payments",
    "📱 **Mobile Friendly** - Seamless experience on all devices",
  ];

  const stats = [
    { label: "Supported Chains", value: "50+", color: "blue" },
    { label: "Protocols", value: "10+", color: "purple" },
    { label: "Total Volume", value: "$1M+", color: "green" },
    { label: "Active Users", value: "5,000+", color: "orange" },
  ];

  const getColorClasses = (color: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      purple: { bg: "bg-purple-100", text: "text-purple-600" },
      green: { bg: "bg-green-100", text: "text-green-600" },
      yellow: { bg: "bg-yellow-100", text: "text-yellow-600" },
      blue: { bg: "bg-blue-100", text: "text-blue-600" },
      indigo: { bg: "bg-indigo-100", text: "text-indigo-600" },
      orange: { bg: "bg-orange-100", text: "text-orange-600" },
    };
    return map[color] || map["blue"];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <MainHeader />

      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-6">
              <CurrencyDollarIcon className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              SafeWallet Pay
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            The ultimate Web3 payment hub. Bridge, Swap, Earn Yield, and Send
            Payments instantly across 50+ chains.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link
              to="/bridge-swap"
              className="group bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
            >
              Launch App
              <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/universal-pay"
              className="group bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center"
            >
              Try Universal Pay
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => {
              const { text } = getColorClasses(stat.color);
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100"
                >
                  <div className={`text-3xl font-bold ${text} mb-2`}>
                    {stat.value}
                  </div>
                  <div className="text-gray-600 text-sm font-medium">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              A complete DeFi & Payment Suite
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From cross-chain bridging to high-yield savings and instant
              payments, we provide all the tools you need in one secure
              interface.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const { bg, text } = getColorClasses(feature.color);
              return (
                <Link
                  key={index}
                  to={feature.link}
                  className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-200 flex flex-col"
                >
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 ${bg} rounded-2xl mb-6 group-hover:scale-110 transition-transform`}
                  >
                    <div className={text}>{feature.icon}</div>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-700 transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-gray-600 leading-relaxed mb-6 flex-grow">
                    {feature.description}
                  </p>

                  <div className="flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform mt-auto">
                    Get Started
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why choose SafeWallet Pay?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                We combine the power of top protocols like LI.FI, Morpho, Aave,
                and Yellow Network into a single, cohesive experience.
              </p>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    <p className="text-gray-700 leading-relaxed font-medium">
                      {benefit.replace(/\*\*(.*?)\*\*/g, "$1")}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                🚀 Start your journey
              </h3>

              <div className="space-y-6">
                <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-xl">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Connect Wallet
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Access all features with one secure connection
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-xl">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Explore Services
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Swap, bridge, earn yield, or send payments
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-xl">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Transact Instantly
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Execute transactions securely on 50+ chains
                    </p>
                  </div>
                </div>
              </div>

              <Link
                to="/bridge-swap"
                className="w-full mt-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 px-6 rounded-xl font-semibold text-center block transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Enter App
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <CurrencyDollarIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold">SafeWallet Pay</h3>
          </div>

          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Aggregating the best of Web3: LI.FI for bridges, Morpho/Aave for
            yields, and Yellow Network for instant payments.
          </p>

          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <Link
              to="/bridge-swap"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Bridge & Swap
            </Link>
            <Link
              to="/max-yield"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Max Yield
            </Link>
            <Link
              to="/universal-pay"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Universal Pay
            </Link>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <p className="text-gray-400">
              © 2024 SafeWallet Pay. Built with ❤️ for the Web3 community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
