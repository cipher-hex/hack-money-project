import { Route, Routes } from "react-router-dom";
import HomePage from "./HomePage";
import SafeTransfer from "./payment/safe-transfer";
import BulkTransactionPage from "../components/bulk-transaction";
import SwapPage from "./SwapPage";
import UniversalPaymentPage from "./UniversalPaymentPage";
import MaxYieldPage from "./MaxYieldPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/safe-transfer" element={<SafeTransfer />} />
      <Route path="/bulk-transaction" element={<BulkTransactionPage />} />
      <Route path="/bridge-swap" element={<SwapPage />} />
      <Route path="/universal-pay" element={<UniversalPaymentPage />} />
      <Route path="/max-yield" element={<MaxYieldPage />} />
    </Routes>
  );
}

export default App;
