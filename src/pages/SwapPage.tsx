import React from "react";
import { LiFiWidget, WidgetConfig } from "@lifi/widget";
import MainHeader from "../components/shared/MainHeader";

const widgetConfig: WidgetConfig = {
  integrator: "safe-wallet-pay",
  variant: "wide",
  appearance: "light",
  theme: {
    palette: {
      primary: { main: "#2563eb" },
      secondary: { main: "#4f46e5" },
    },
    container: {
      border: "1px solid rgb(234, 234, 234)",
      borderRadius: "16px",
      boxShadow: "0px 8px 32px rgba(0, 0, 0, 0.08)",
    },
  },
};

const SwapPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <MainHeader />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-4">
            Bridge & Swap
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Swap tokens across chains seamlessly with the best rates. Powered by LI.FI for optimal routing.
          </p>
        </div>

        {/* Widget Container */}
        <div className="flex justify-center items-center">
          <div className="w-full">
            <LiFiWidget integrator="safe-wallet-pay" config={widgetConfig} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapPage;
