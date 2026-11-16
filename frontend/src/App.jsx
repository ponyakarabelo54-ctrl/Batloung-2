import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Suppliers from './pages/Suppliers.jsx';
import Fruits from './pages/Fruits.jsx';
import Vendors from './pages/Vendors.jsx';
import Purchases from './pages/Purchases.jsx';
import Sales from './pages/Sales.jsx';
import Stock from './pages/Stock.jsx';
import Reports from './pages/Reports.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/fruits" element={<Fruits />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
