import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
 
const NotFound = () => {
  const navigate = useNavigate();
  const { isAuthenticated, getUserRole } = useAuth();
 
  const handleGoHome = () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    const role = getUserRole();
    if (role === 'farmer') navigate('/farmer/dashboard');
    else if (role === 'transporter') navigate('/transporter/dashboard');
    else if (role === 'admin') navigate('/admin/dashboard');
    else navigate('/login');
  };
 
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
      }}
    >
      <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
        <Typography
          variant="h1"
          sx={{ fontSize: '6rem', fontWeight: 900, color: '#2e7d32', lineHeight: 1 }}
        >
          404
        </Typography>
        <Typography variant="h5" fontWeight={600} sx={{ mt: 2, mb: 1 }}>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          The page you're looking for doesn't exist or you don't have permission to view it.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={handleGoHome}
          sx={{
            backgroundColor: '#2e7d32',
            px: 4,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 700,
            '&:hover': { backgroundColor: '#1b5e20' },
          }}
        >
          Go to Dashboard
        </Button>
      </Container>
    </Box>
  );
};
 
export default NotFound;