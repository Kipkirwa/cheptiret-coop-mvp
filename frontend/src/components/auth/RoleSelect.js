import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Agriculture as FarmerIcon,
  LocalShipping as TruckIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const RoleSelect = () => {
  const navigate = useNavigate();

  const roles = [
    {
      title: 'Farmer',
      description: 'View your milk collections and monthly statements',
      icon: <FarmerIcon sx={{ fontSize: 48 }} />,
      path: '/login/farmer',
      color: '#2e7d32',
      bgColor: '#e8f5e9',
    },
    {
      title: 'Transporter',
      description: 'Record daily milk collections and view summaries',
      icon: <TruckIcon sx={{ fontSize: 48 }} />,
      path: '/login/transporter',
      color: '#f57c00',
      bgColor: '#fff3e0',
    },
    {
      title: 'Admin',
      description: 'Manage farmers, view reports, and system settings',
      icon: <AdminIcon sx={{ fontSize: 48 }} />,
      path: '/login/admin',
      color: '#1a237e',
      bgColor: '#e8eaf6',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #2e7d32 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="lg">
        <Paper
          elevation={8}
          sx={{
            p: 4,
            borderRadius: 4,
            backgroundColor: 'rgba(255,255,255,0.95)',
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" fontWeight={700} color="#1a237e" gutterBottom>
              Cheptiret Farmers Cooperative
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Select your role to continue
            </Typography>
            <Divider sx={{ mt: 2, maxWidth: 300, mx: 'auto' }} />
          </Box>

          {/* Role Cards */}
          <Grid container spacing={3}>
            {roles.map((role) => (
              <Grid item xs={12} md={4} key={role.title}>
                <Card
                  sx={{
                    borderRadius: 3,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 8,
                    },
                  }}
                >
                  <CardActionArea onClick={() => navigate(role.path)}>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <Avatar
                        sx={{
                          width: 80,
                          height: 80,
                          backgroundColor: role.bgColor,
                          color: role.color,
                          mx: 'auto',
                          mb: 2,
                        }}
                      >
                        {role.icon}
                      </Avatar>
                      <Typography variant="h5" fontWeight={700} color={role.color} gutterBottom>
                        {role.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {role.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="caption" color="text.secondary">
              © {new Date().getFullYear()} Cheptiret Farmers Cooperative. All rights reserved.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default RoleSelect;
