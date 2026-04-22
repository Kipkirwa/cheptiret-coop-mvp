import React, { useState } from 'react';
import {
  Container, Paper, Typography, TextField, Button,
  Box, InputAdornment, Avatar, Divider, Alert as MuiAlert,
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  AdminPanelSettings as AdminIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Alert from '../common/Alert';
 
const MAX_ATTEMPTS = 3;
 
const AdminLogin = () => {
  const navigate = useNavigate();
  const { transporterLogin } = useAuth(); // Admin uses same token endpoint
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedOut, setLockedOut] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: '', message: '' });
 
  const handleSubmit = async (e) => {
    e.preventDefault();
 
    if (lockedOut) return;
 
    if (!username || !password) {
      setAlert({ open: true, type: 'error', message: 'Please enter your username and password.' });
      return;
    }
 
    setLoading(true);
    const result = await transporterLogin(username, password);
    console.log('🔑 Admin login result:', JSON.stringify(result));
    setLoading(false);
 
    if (result.success && result.user?.role === 'admin') {
      setAlert({ open: true, type: 'success', message: 'Access granted. Redirecting...' });
      setTimeout(() => navigate('/admin/dashboard'), 1500);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
 
      if (newAttempts >= MAX_ATTEMPTS) {
        setLockedOut(true);
        setAlert({
          open: true,
          type: 'error',
          message: 'Too many failed attempts. Access locked. Contact your system administrator.',
        });
      } else {
        setAlert({
          open: true,
          type: 'error',
          message: `Invalid credentials. ${MAX_ATTEMPTS - newAttempts} attempt(s) remaining.`,
        });
      }
    }
  };
 
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #1a237e 0%, #283593 50%, #3949ab 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="xs">
        <Alert
          open={alert.open}
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ ...alert, open: false })}
        />
 
        <Paper elevation={8} sx={{ p: 4, borderRadius: 4 }}>
 
          {/* Branding */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar sx={{ width: 64, height: 64, backgroundColor: '#283593', mx: 'auto', mb: 1.5 }}>
              <AdminIcon sx={{ fontSize: 36, color: '#9fa8da' }} />
            </Avatar>
            <Typography variant="h5" fontWeight={700} color="#1a237e">
              Cheptiret Cooperative
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Milk Collection Management
            </Typography>
          </Box>
 
          <Divider sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              ADMIN ACCESS
            </Typography>
          </Divider>
 
          {/* Restricted access warning */}
          <MuiAlert
            severity="warning"
            icon={<WarningIcon />}
            sx={{ mb: 3, borderRadius: 2, fontSize: '0.8rem' }}
          >
            Restricted area. Authorised personnel only.
          </MuiAlert>
 
          {/* Lockout message */}
          {lockedOut && (
            <MuiAlert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              Account locked after {MAX_ATTEMPTS} failed attempts. Contact your system administrator.
            </MuiAlert>
          )}
 
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Admin Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
              disabled={lockedOut}
              placeholder="Enter admin username"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: '#283593' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              disabled={lockedOut}
              placeholder="Enter password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#283593' }} />
                  </InputAdornment>
                ),
              }}
            />
 
            {/* Attempt counter */}
            {attempts > 0 && !lockedOut && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                {MAX_ATTEMPTS - attempts} attempt(s) remaining before lockout.
              </Typography>
            )}
 
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || lockedOut}
              sx={{
                mt: 3,
                mb: 1,
                py: 1.5,
                backgroundColor: '#283593',
                fontWeight: 700,
                fontSize: '1rem',
                borderRadius: 2,
                '&:hover': { backgroundColor: '#1a237e' },
              }}
            >
              {loading ? 'Verifying...' : 'Login'}
            </Button>
          </form>
 
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Not an admin?{' '}
              <Typography
                component="span"
                variant="caption"
                sx={{ color: '#2e7d32', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => navigate('/login/farmer')}
              >
                Farmer login
              </Typography>
              {' · '}
              <Typography
                component="span"
                variant="caption"
                sx={{ color: '#f57c00', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => navigate('/login/transporter')}
              >
                Transporter login
              </Typography>
            </Typography>
          </Box>
        </Paper>
 
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 2, color: 'rgba(255,255,255,0.6)' }}>
          © {new Date().getFullYear()} Cheptiret Farmers Cooperative
        </Typography>
      </Container>
    </Box>
  );
};
 
export default AdminLogin;