import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth }     from './store';
import LoginPage       from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import InvoicesPage    from './pages/InvoicesPage';
import InvoiceDetail   from './pages/InvoiceDetail';
import Toast           from './components/Toast';

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <Toast />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }>
          <Route index            element={<Navigate to="/facturas" replace />} />
          <Route path="facturas"  element={<InvoicesPage />} />
          <Route path="facturas/:id" element={<InvoiceDetail />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
