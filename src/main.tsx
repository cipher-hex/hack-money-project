import "./index.css";

import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
// IMP START - Setup Web3Auth Provider
import { Web3AuthProvider } from "@web3auth/modal/react";
import web3AuthContextConfig from "./web3authContext";
// IMP END - Setup Web3Auth Provider

// IMP START - Setup Wagmi Provider
import { WagmiProvider } from "@web3auth/modal/react/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// IMP END - Setup Wagmi Provider

import App from "./pages/App";
import { YellowProvider } from "./context/YellowContext";

// IMP START - Setup Wagmi Provider
const queryClient = new QueryClient();
// IMP END - Setup Wagmi Provider

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <BrowserRouter>
    {/* // IMP START - Setup Web3Auth Provider */}
    <Web3AuthProvider config={web3AuthContextConfig}>
      {/* // IMP END - Setup Web3Auth Provider */}
      {/* // IMP START - Setup Wagmi Provider */}
      <QueryClientProvider client={queryClient}>
        <WagmiProvider>
          <YellowProvider>
            <App />
          </YellowProvider>
        </WagmiProvider>
      </QueryClientProvider>
      {/* // IMP END - Setup Wagmi Provider */}
      {/* // IMP START - Setup Web3Auth Provider */}
    </Web3AuthProvider>
    {/* // IMP END - Setup Web3Auth Provider */}
  </BrowserRouter>,
);
