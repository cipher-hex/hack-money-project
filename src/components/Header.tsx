import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChainId, useSwitchChain, useAccount } from 'wagmi';
import { useWeb3AuthDisconnect, useWeb3AuthUser } from "@web3auth/modal/react";
import { UserInfoModal } from './UserInfoModal';
import { WalletUIButton } from "./walletUI";
import { SwapButton } from "./swap";

export function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserInfoModalOpen, setIsUserInfoModalOpen] = useState(false);
  const navigate = useNavigate();
  const chainId = useChainId();
  const { chains, switchChain, error } = useSwitchChain();
  const { address, isConnected } = useAccount();
  const { disconnect, loading: disconnectLoading } = useWeb3AuthDisconnect();
  const { userInfo } = useWeb3AuthUser();

  const currentChain = chains.find((chain) => chain.id === chainId);

  const handleUserInfoClick = () => {
    setIsUserInfoModalOpen(true);
  };

  if (!isConnected) return null;

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b-2 border-slate-200 shadow-md z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔗</span>
            <span className="text-xl font-bold text-blue-600">Web3Auth</span>
          </div>
        </div>

        <div className="flex-1"></div>

        <div className="flex items-center">
          <div className="flex items-center gap-3">
            {/* Chain Dropdown */}
            {/* <WalletUIButton /> */}
            <SwapButton />
            <div className="relative">
              <button
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-800 cursor-pointer transition-all hover:border-blue-500 hover:bg-slate-50 font-medium min-h-10"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className="w-2 h-2 bg-green-500 rounded-full shadow-sm"></span>
                {currentChain?.name || "Unknown Chain"}
                <svg
                  className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M4 6l4 4 4-4H4z" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 min-w-52 bg-white border-2 border-slate-200 rounded-2xl shadow-lg overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800 text-sm">
                    Switch Network
                  </div>
                  {chains.map((chain) => (
                    <button
                      key={chain.id}
                      className={`flex items-center gap-3 w-full px-4 py-3 text-left text-slate-800 cursor-pointer transition-all hover:bg-slate-50 hover:text-blue-600 font-sans text-sm ${
                        chainId === chain.id ? "bg-slate-50 text-blue-600 font-semibold" : ""
                      }`}
                      disabled={chainId === chain.id}
                      onClick={() => {
                        switchChain({ chainId: chain.id });
                        setIsDropdownOpen(false);
                      }}
                    >
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      {chain.name}
                      {chainId === chain.id && (
                        <svg
                          className="ml-auto text-blue-600"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                        </svg>
                      )}
                    </button>
                  ))}
                  {error && (
                    <div className="px-4 py-3 text-red-600 bg-red-50 border-t border-slate-200 text-sm">
                      {error.message}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Actions */}
            <button 
              onClick={() => navigate('/pot-home')} 
              className="flex items-center justify-center p-2.5 border-2 border-slate-200 rounded-xl bg-white text-slate-800 cursor-pointer transition-all hover:border-blue-500 hover:text-blue-600 hover:-translate-y-0.5 min-w-10 min-h-10"
              title="Go to Pot Home"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5ZM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5 5 5Z"/>
              </svg>
            </button>

            <button 
              onClick={() => navigate('/safe-transfer')} 
              className="flex items-center justify-center p-2.5 border-2 border-slate-200 rounded-xl bg-white text-slate-800 cursor-pointer transition-all hover:border-blue-500 hover:text-blue-600 hover:-translate-y-0.5 min-w-10 min-h-10"
              title="Go to Safe Transfer"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1H0V4z"/>
                <path d="M0 6v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6H0zm13 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                <path d="M8 7.5a.5.5 0 0 1 .5.5v1.5H10a.5.5 0 0 1 0 1H8.5V12a.5.5 0 0 1-1 0v-1.5H6a.5.5 0 0 1 0-1h1.5V8a.5.5 0 0 1 .5-.5z"/>
              </svg>
            </button>

            {/* User Actions */}
            <button 
              onClick={handleUserInfoClick} 
              className="flex items-center justify-center p-2.5 border-2 border-slate-200 rounded-xl bg-white text-slate-800 cursor-pointer transition-all hover:border-blue-500 hover:text-blue-600 hover:-translate-y-0.5 min-w-10 min-h-10"
              title="Get User Info"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
              </svg>
            </button>

            <button
              onClick={() => disconnect()}
              className="flex items-center justify-center p-2.5 border-2 border-red-200 rounded-xl bg-white text-red-600 cursor-pointer transition-all hover:bg-red-50 hover:border-red-600 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 min-w-10 min-h-10"
              disabled={disconnectLoading}
              title="Disconnect"
            >
              {disconnectLoading ? (
                <svg
                  className="animate-spin"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"
                  />
                  <path
                    fillRule="evenodd"
                    d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {isDropdownOpen && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

      {/* User Info Modal */}
      <UserInfoModal
        userInfo={userInfo}
        isOpen={isUserInfoModalOpen}
        onClose={() => setIsUserInfoModalOpen(false)}
        chainInfo={
          currentChain
            ? {
                id: currentChain.id,
                name: currentChain.name,
              }
            : undefined
        }
      />
    </header>
  );
}
