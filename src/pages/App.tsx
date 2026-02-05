import { Route, Routes } from "react-router-dom";
import HomePage from "./HomePage";
import SafeTransfer from "./payment/safe-transfer";
import BulkTransactionPage from "../components/bulk-transaction";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/safe-transfer" element={<SafeTransfer />} />
      <Route path="/bulk-transaction" element={<BulkTransactionPage />} />
    </Routes>
  );
}

export default App;
