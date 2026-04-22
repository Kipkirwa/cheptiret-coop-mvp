import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Chip,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  LocalFlorist as CoopIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
 
const roleColors = {
  farmer:     { bg: '#a5d6a7', text: '#1b5e20', label: 'Farmer' },
  transporter:{ bg: '#ffe082', text: '#e65100', label: 'Transporter' },
  admin:      { bg: '#ef9a9a', text: '#b71c1c', label: 'Admin' },
};
 
const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
 
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
 
  const role = user?.role || '';
  const roleStyle = roleColors[role] || {};
 
  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#2E7D32',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
 
        {/* Logo + Name */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
          <Avatar sx={{ backgroundColor: '#1b5e20', width: 36, height: 36 }}>
            <CoopIcon sx={{ fontSize: 20, color: '#a5d6a7' }} />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              Cheptiret Cooperative
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.75, lineHeight: 1 }}>
              Milk Collection Management
            </Typography>
          </Box>
        </Box>
 
        {/* Role badge + user name + logout */}
        {isAuthenticated() && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
 
            {/* Role badge */}
            {role && (
              <Chip
                label={roleStyle.label}
                size="small"
                sx={{
                  backgroundColor: roleStyle.bg,
                  color: roleStyle.text,
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  display: { xs: 'none', sm: 'flex' },
                }}
              />
            )}
 
            {/* User name */}
            {user?.name && (
              <Typography
                variant="body2"
                sx={{ opacity: 0.9, display: { xs: 'none', sm: 'block' } }}
              >
                {user.name}
              </Typography>
            )}
 
            {/* Logout */}
            <Tooltip title="Logout">
              <Button
                color="inherit"
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
                  minWidth: 0,
                  px: 1.5,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ display: { xs: 'none', sm: 'block' } }}
                >
                  Logout
                </Typography>
              </Button>
            </Tooltip>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};
 
export default Navbar;