import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheckIcon,
  CurrencyDollarIcon,
  LockClosedIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import MainHeader from "../components/shared/MainHeader";

const HomePage: React.FC = () => {
  const features = [
    {
      icon: <ShieldCheckIcon className="w-8 h-8" />,
      title: "Secure P2P Payments",
      description:
        "Send payments safely with built-in escrow protection. Funds are held securely until recipients claim them.",
      link: "/safe-transfer",
      color: "blue",
    },
    {
      icon: <UserGroupIcon className="w-8 h-8" />,
      title: "Bulk Transactions",
      description:
        "Send payments to multiple recipients at once. Manage your recipient list and send bulk transfers efficiently.",
      link: "/bulk-transaction",
      color: "indigo",
    },
    {
      icon: <LockClosedIcon className="w-8 h-8" />,
      title: "Multi-Token Support",
      description:
        "Support for ETH and ERC-20 tokens like PYUSD. All transactions with proper decimal handling.",
      link: "/safe-transfer",
      color: "green",
    },
  ];

  const benefits = [
    "🛡️ **Escrow Protection** - Funds held safely until claimed",
    "🔄 **Multi-Token** - ETH and ERC-20 token support",
    "📱 **Mobile Friendly** - Works seamlessly on all devices",
    "🌐 **Multi-Chain** - Sepolia, Flow and more networks",
    "🎯 **ENS Support** - Send to ENS names like vitalik.eth",
    "⚡ **Fast & Reliable** - Quick transactions with low fees",
  ];

  const stats = [
    { label: "Total Transactions", value: "10,000+", color: "blue" },
    { label: "Active Users", value: "2,500+", color: "green" },
    { label: "Total Volume", value: "$500K+", color: "purple" },
    { label: "Networks", value: "2+", color: "orange" },
  ];

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
            The most secure way to send crypto payments. Built with Web3
            technology for maximum security and transparency.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link
              to="/safe-transfer"
              className="group bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
            >
              Start Sending Payments
              <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <div
                  className={`text-3xl font-bold text-${stat.color}-600 mb-2`}
                >
                  {stat.value}
                </div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Everything you need for secure crypto payments
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              SafeWallet Pay combines the best of DeFi security with
              user-friendly interfaces to make crypto payments safe and
              accessible for everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Link
                key={index}
                to={feature.link}
                className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-200"
              >
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 bg-${feature.color}-100 rounded-2xl mb-6 group-hover:scale-110 transition-transform`}
                >
                  <div className={`text-${feature.color}-600`}>
                    {feature.icon}
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-700 transition-colors">
                  {feature.title}
                </h3>

                <p className="text-gray-600 leading-relaxed mb-6">
                  {feature.description}
                </p>

                <div className="flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform">
                  Learn More
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </div>
              </Link>
            ))}
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
                We've built the most secure and user-friendly platform for
                crypto payments and DeFi interactions. Here's what makes us
                special:
              </p>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    <p className="text-gray-700 leading-relaxed">
                      {benefit.replace(/\*\*(.*?)\*\*/g, "$1")}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                🚀 Ready to get started?
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
                      Connect your Web3 wallet securely
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-xl">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Choose Service
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Safe P2P or Bulk Transactions
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-xl">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Start Transacting
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Enjoy secure and fast transactions
                    </p>
                  </div>
                </div>
              </div>

              <Link
                to="/safe-transfer"
                className="w-full mt-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 px-6 rounded-xl font-semibold text-center block transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Get Started Now
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
            Building the future of secure crypto payments and DeFi interactions.
            Safe, fast, and user-friendly Web3 solutions for everyone.
          </p>

          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <Link
              to="/safe-transfer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Safe P2P
            </Link>
            <Link
              to="/bulk-transaction"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Bulk Transactions
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
