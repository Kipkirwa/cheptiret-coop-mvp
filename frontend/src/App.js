import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
 
// Context
import { AuthProvider } from './contexts/AuthContext';
 
// Auth Components
import RoleSelect from './components/auth/RoleSelect';
import FarmersLogin from './components/auth/FarmersLogin';
import TransportersLogin from './components/auth/TransportersLogin';
import AdminLogin from './components/auth/AdminLogin';
 
// Layout Components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
 
// Page Components - Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import PriceSettings from './pages/admin/setprice';
import FarmerManagement from './pages/admin/FarmerManagement';
import Reports from './pages/admin/Reports';
import BroadcastSMS from './pages/admin/BroadcastSMS';
import MonthlyPayments from './pages/admin/MonthlyPayments';
import AdminCollections from "./pages/admin/AdminCollections";
 
// Page Components - Farmer
import FarmerDashboard from './pages/farmer/dashboard';
import FarmerPortal from './pages/farmer/FarmerPortal';
import DailyRecord from './pages/farmer/DailyRecord';
import MonthlyStatement from './pages/farmer/MonthlyStatement';
 
// Page Components - Transporter
import TransporterDashboard from './pages/transporters/TransporterDashboard';
import CollectionForm from './pages/transporters/CollectionForm';
import CollectionHistory from './pages/transporters/CollectionHistory';
import FarmerSearch from './pages/transporters/FarmerSearch';
import DailySummary from './pages/transporters/DailySummary';
 
// Shared
import PrivateRoute from './components/auth/PrivateRoute';
import NotFound from './components/common/NotFound';
 
const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32',
      light: '#4CAF50',
      dark: '#1B5E20',
    },
    secondary: {
      main: '#FFA000',
      light: '#FFB74D',
      dark: '#F57C00',
    },
    background: {
      default: '#F5F5F5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
  },
});
 
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <Box sx={{ display: 'flex' }}>
              <Sidebar />
              <Box
                component="main"
                sx={{
                  flexGrow: 1,
                  p: 3,
                  backgroundColor: '#f5f5f5',
                  minHeight: '100vh',
                  mt: '64px',
                }}
              >
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Navigate to="/login" />} />
                  <Route path="/login" element={<RoleSelect />} />
                  <Route path="/login/farmer" element={<FarmersLogin />} />
                  <Route path="/login/transporter" element={<TransportersLogin />} />
                  <Route path="/login/admin" element={<AdminLogin />} />
 
                  {/* Admin Routes */}
                  <Route path="/admin/dashboard" element={
                    <PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>
                  } />
                  <Route path="/admin/farmers" element={
                    <PrivateRoute role="admin"><FarmerManagement /></PrivateRoute>
                  } />
                  <Route path="/admin/prices" element={
                    <PrivateRoute role="admin"><PriceSettings /></PrivateRoute>
                  } />
                  <Route path="/admin/reports" element={
                    <PrivateRoute role="admin"><Reports /></PrivateRoute>
                  } />
                  <Route path="/admin/broadcast" element={
                    <PrivateRoute role="admin"><BroadcastSMS /></PrivateRoute>
                  } />
                  <Route path="/admin/payments" element={
                    <PrivateRoute role="admin"><MonthlyPayments /></PrivateRoute>
                  } />
                  <Route path="/admin/collections" element={
                    <PrivateRoute role="admin"><AdminCollections /></PrivateRoute>
                  } />
 
                  {/* Farmer Routes */}
                  <Route path="/farmer/portal" element={
                    <PrivateRoute role="farmer"><FarmerPortal /></PrivateRoute>
                  } />
                  <Route path="/farmer/dashboard" element={
                    <PrivateRoute role="farmer"><FarmerDashboard /></PrivateRoute>
                  } />
                  <Route path="/farmer/daily" element={
                    <PrivateRoute role="farmer"><DailyRecord /></PrivateRoute>
                  } />
                  <Route path="/farmer/monthly" element={
                    <PrivateRoute role="farmer"><MonthlyStatement /></PrivateRoute>
                  } />
 
                  {/* Transporter Routes */}
                  <Route path="/transporter/dashboard" element={
                    <PrivateRoute role="transporter"><TransporterDashboard /></PrivateRoute>
                  } />
                  <Route path="/transporter/record" element={
                    <PrivateRoute role="transporter"><CollectionForm /></PrivateRoute>
                  } />
                  <Route path="/transporter/history" element={
                    <PrivateRoute role="transporter"><CollectionHistory /></PrivateRoute>
                  } />
                  <Route path="/transporter/search" element={
                    <PrivateRoute role="transporter"><FarmerSearch /></PrivateRoute>
                  } />
                  <Route path="/transporter/summary" element={
                    <PrivateRoute role="transporter"><DailySummary /></PrivateRoute>
                  } />
 
                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Box>
            </Box>
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
 
export default App;