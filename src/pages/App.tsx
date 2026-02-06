import { Route, Routes } from "react-router-dom";
import HomePage from "./HomePage";
import SafeTransfer from "./payment/safe-transfer";
import BulkTransactionPage from "../components/bulk-transaction";
import SwapPage from "./SwapPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/safe-transfer" element={<SafeTransfer />} />
      <Route path="/bulk-transaction" element={<BulkTransactionPage />} />
      <Route path="/bridge-swap" element={<SwapPage />} />
    </Routes>
  );
}

export default App;
