import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth }           from './store';
import LoginPage             from './pages/LoginPage';
import ForgotPasswordPage    from './pages/ForgotPasswordPage';
import ResetPasswordPage     from './pages/ResetPasswordPage';
import DashboardLayout       from './components/DashboardLayout';
import InvoicesPage          from './pages/InvoicesPage';
import InvoiceDetail         from './pages/InvoiceDetail';
import Toast                 from './components/Toast';

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <Toast />
      <Routes>
        <Route path="/login"            element={<LoginPage />} />
        <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
        <Route path="/reset-password"   element={<ResetPasswordPage />} />

        <Route path="/" element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }>
          <Route index               element={<Navigate to="/documentos" replace />} />
          <Route path="documentos"   element={<InvoicesPage source="" />} />
          <Route path="facturas"     element={<InvoicesPage source="lioren" />} />
          <Route path="boletas"      element={<InvoicesPage source="boleta" />} />
          <Route path="documentos/:id" element={<InvoiceDetail />} />
          <Route path="facturas/:id"   element={<InvoiceDetail />} />
          <Route path="boletas/:id"    element={<InvoiceDetail />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
