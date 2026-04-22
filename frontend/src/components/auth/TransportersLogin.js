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
  Person as PersonIcon,
  Lock as LockIcon,
  LocalShipping as TruckIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Alert from '../common/Alert';
 
const TransportersLogin = () => {
  const navigate = useNavigate();
  const { transporterLogin } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: '', message: '' });
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("🔑 Transporter login attempt started");
    console.log("📝 Username:", username);
    console.log("📝 Password length:", password.length);
 
    if (!username || !password) {
      console.log("❌ Missing username or password");
      setAlert({ open: true, type: 'error', message: 'Please enter your username and password.' });
      return;
    }
 
    console.log("🔄 Calling transporterLogin function...");
    setLoading(true);
    const result = await transporterLogin(username, password);
    console.log("📊 Login result:", result);
    setLoading(false);
 
    if (result.success) {
      console.log("✅ Login successful! Redirecting to /transporter/dashboard");
      console.log("📦 User data saved:", result.user);
      setAlert({ open: true, type: 'success', message: 'Login successful! Redirecting...' });
      setTimeout(() => navigate('/transporter/dashboard'), 1500);
    } else {
      console.log("❌ Login failed:", result.message);
      setAlert({
        open: true,
        type: 'error',
        message: result.message || 'Login failed. Please check your credentials.',
      });
    }
  };
 
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #e65100 0%, #f57c00 50%, #ffa000 100%)',
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
 
        <Paper elevation={8} sx={{ p: 4, borderRadius: 4, backgroundColor: 'white' }}>
 
          {/* Branding */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                backgroundColor: '#f57c00',
                mx: 'auto',
                mb: 1.5,
              }}
            >
              <TruckIcon sx={{ fontSize: 36, color: 'white' }} />
            </Avatar>
            <Typography variant="h5" fontWeight={700} color="#e65100">
              Cheptiret Cooperative
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Milk Collection Management
            </Typography>
          </Box>
 
          <Divider sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              TRANSPORTER LOGIN
            </Typography>
          </Divider>
 
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
              placeholder="Enter your username"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: '#f57c00' }} />
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
              placeholder="Enter your password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#f57c00' }} />
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
                backgroundColor: '#f57c00',
                fontWeight: 700,
                fontSize: '1rem',
                borderRadius: 2,
                '&:hover': { backgroundColor: '#e65100' },
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
 
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Are you a farmer?{' '}
                <Link
                  component={RouterLink}
                  to="/login/farmer"
                  sx={{ color: '#2e7d32', fontWeight: 600 }}
                >
                  Login here
                </Link>
              </Typography>
            </Box>
          </form>
 
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Having trouble? Contact your cooperative administrator.
            </Typography>
          </Box>
        </Paper>
 
        <Typography
          variant="caption"
          sx={{ display: 'block', textAlign: 'center', mt: 2, color: 'rgba(255,255,255,0.7)' }}
        >
          © {new Date().getFullYear()} Cheptiret Farmers Cooperative
        </Typography>
      </Container>
    </Box>
  );
};
 
export default TransportersLogin;
