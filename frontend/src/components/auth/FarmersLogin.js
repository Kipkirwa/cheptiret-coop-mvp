import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  InputAdornment,
  Link,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Lock as LockIcon,
  LocalFlorist as CoopIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Alert from '../common/Alert';
 
const FarmersLogin = () => {
  const navigate = useNavigate();
  const { farmerLogin } = useAuth();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: '', message: '' });
 
  const handleSubmit = async (e) => {
    e.preventDefault();
 
    if (!phone || phone.length < 10) {
      setAlert({ open: true, type: 'error', message: 'Please enter a valid phone number' });
      return;
    }
    if (!pin || pin.length !== 4) {
      setAlert({ open: true, type: 'error', message: 'PIN must be 4 digits' });
      return;
    }
 
    setLoading(true);
    const result = await farmerLogin(phone, pin);
    setLoading(false);
 
    if (result.success) {
      setAlert({ open: true, type: 'success', message: 'Login successful! Redirecting...' });
      setTimeout(() => navigate('/farmer/dashboard'), 1500);
    } else {
      setAlert({ open: true, type: 'error', message: result.message || 'Login failed. Please try again.' });
    }
  };
 
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #1b5e20 0%, #2e7d32 50%, #388e3c 100%)',
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
 
        <Paper
          elevation={8}
          sx={{ p: 4, borderRadius: 4, backgroundColor: 'white' }}
        >
          {/* Branding */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                backgroundColor: '#2e7d32',
                mx: 'auto',
                mb: 1.5,
              }}
            >
              <CoopIcon sx={{ fontSize: 36, color: '#a5d6a7' }} />
            </Avatar>
            <Typography variant="h5" fontWeight={700} color="#1b5e20">
              Cheptiret Cooperative
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Milk Collection Management
            </Typography>
          </Box>
 
          <Divider sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              FARMER LOGIN
            </Typography>
          </Divider>
 
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              margin="normal"
              required
              placeholder="e.g. 0712345678"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon sx={{ color: '#2e7d32' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="4-Digit PIN"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              margin="normal"
              required
              inputProps={{ maxLength: 4 }}
              placeholder="••••"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#2e7d32' }} />
                  </InputAdornment>
                ),
              }}
            />
 
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 1,
                py: 1.5,
                backgroundColor: '#2e7d32',
                fontWeight: 700,
                fontSize: '1rem',
                borderRadius: 2,
                '&:hover': { backgroundColor: '#1b5e20' },
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
 
            <Box sx={{ textAlign: 'center', mt: 2 }}>
               <Typography variant="body2" color="text.secondary">
              Are you a transporter?{' '}
              <Link
              component={RouterLink}
              to="/login/transporter"
              sx={{ color: '#2e7d32', fontWeight: 600 }}
              >
              Login here
              </Link>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              <Link
              component={RouterLink}
              to="/login/admin"
              sx={{ color: '#283593', fontWeight: 600 }}
              >
              Admin access
             </Link>
            </Typography>
          </Box>
          </form>
 
          {/* Footer */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Having trouble? Contact your cooperative administrator.
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
 
export default FarmersLogin;