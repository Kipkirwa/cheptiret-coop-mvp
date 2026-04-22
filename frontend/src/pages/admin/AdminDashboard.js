import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Grid, Paper, Typography, Box, Card, CardContent,
  CircularProgress, Alert, Divider, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Button, Avatar,
} from '@mui/material';
import {
  People as PeopleIcon,
  LocalShipping as TruckIcon,
  Opacity as MilkIcon,
  AttachMoney as MoneyIcon,
  Sms as SmsIcon,
  TrendingUp as TrendingIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
 
const StatCard = ({ icon, label, value, sub, color, bg }) => (
  <Card sx={{ height: '100%', backgroundColor: bg, borderRadius: 3, boxShadow: 2 }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Box sx={{ backgroundColor: color + '22', borderRadius: 2, p: 1 }}>
          {React.cloneElement(icon, { sx: { fontSize: 28, color } })}
        </Box>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>{label}</Typography>
      </Box>
      <Typography variant="h4" fontWeight={800} color={color}>{value}</Typography>
      {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
    </CardContent>
  </Card>
);
 
const QuickAction = ({ icon, label, desc, color, path, navigate }) => (
  <Card
    onClick={() => navigate(path)}
    sx={{
      cursor: 'pointer', borderRadius: 3, boxShadow: 1,
      border: `1px solid ${color}33`,
      transition: 'all 0.15s ease',
      '&:hover': { boxShadow: 4, transform: 'translateY(-2px)', borderColor: color },
    }}
  >
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
      <Avatar sx={{ backgroundColor: color + '22', color }}>{icon}</Avatar>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="body1" fontWeight={700}>{label}</Typography>
        <Typography variant="caption" color="text.secondary">{desc}</Typography>
      </Box>
      <ArrowIcon sx={{ color, fontSize: 20 }} />
    </CardContent>
  </Card>
);
 
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
 
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load dashboard stats.');
    } finally {
      setLoading(false);
    }
  }, []);
 
  useEffect(() => { fetchStats(); }, [fetchStats]);
 
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress sx={{ color: '#283593' }} size={48} />
        <Typography color="text.secondary">Loading admin dashboard...</Typography>
      </Box>
    );
  }
 
  const today = new Date();
 
  return (
    <Container maxWidth="lg" sx={{ pb: 4 }}>
 
      {/* Header */}
      <Paper sx={{
        p: 3, mb: 3, mt: 2, borderRadius: 3, color: 'white',
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 60%, #3949ab 100%)',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Admin Dashboard</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
              {today.toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>
          </Box>
          <Chip
            label={`Ksh ${stats?.current_price_per_liter}/L`}
            sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700, fontSize: '0.9rem' }}
          />
        </Box>
      </Paper>
 
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
 
      {/* Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} md={2}>
          <StatCard icon={<PeopleIcon />} label="Active Farmers" value={stats?.total_farmers ?? 0} color="#2e7d32" bg="#e8f5e9" />
        </Grid>
        <Grid item xs={6} md={2}>
          <StatCard icon={<TruckIcon />} label="Transporters" value={stats?.total_transporters ?? 0} color="#f57c00" bg="#fff3e0" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={<MilkIcon />} label="Today's Liters" value={`${stats?.today_liters ?? 0} L`} sub={`${stats?.today_collections ?? 0} collections`} color="#1976d2" bg="#e3f2fd" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={<TrendingIcon />} label="Month Liters" value={`${stats?.month_liters ?? 0} L`} color="#7b1fa2" bg="#f3e5f5" />
        </Grid>
        <Grid item xs={12} md={2}>
          <StatCard
            icon={<SmsIcon />}
            label="SMS Rate Today"
            value={`${stats?.sms_delivery_rate ?? 0}%`}
            sub={`${stats?.today_sms_sent ?? 0} sent`}
            color={stats?.sms_delivery_rate >= 90 ? '#2e7d32' : '#f57c00'}
            bg={stats?.sms_delivery_rate >= 90 ? '#e8f5e9' : '#fff3e0'}
          />
        </Grid>
      </Grid>
 
      <Grid container spacing={3}>
 
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Quick Actions</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <QuickAction navigate={navigate} path="/admin/broadcast"
                icon={<SmsIcon />} label="Broadcast SMS"
                desc="Send message to all farmers"
                color="#1976d2"
              />
              <QuickAction navigate={navigate} path="/admin/payments"
                icon={<MoneyIcon />} label="Monthly Payments"
                desc="Review & finalize payments"
                color="#2e7d32"
              />
              <QuickAction navigate={navigate} path="/admin/farmers"
                icon={<PeopleIcon />} label="Manage Farmers"
                desc="View and edit farmer records"
                color="#7b1fa2"
              />
              <QuickAction navigate={navigate} path="/admin/prices"
                icon={<MoneyIcon />} label="Set Milk Price"
                desc="Update price per litre"
                color="#f57c00"
              />
              <QuickAction navigate={navigate} path="/admin/reports"
                icon={<TrendingIcon />} label="Reports"
                desc="View collection analytics"
                color="#283593"
              />
            </Box>
          </Paper>
        </Grid>
 
        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Recent Collections</Typography>
            <Divider sx={{ mb: 2 }} />
            {stats?.recent_activity?.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No collections recorded today.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell fontWeight={700}>Farmer</TableCell>
                      <TableCell>Transporter</TableCell>
                      <TableCell align="right">Liters</TableCell>
                      <TableCell align="center">SMS</TableCell>
                      <TableCell align="right">Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats?.recent_activity?.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{row.farmer_name}</Typography>
                          <Typography variant="caption" color="text.secondary">{row.farmer_id}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{row.transporter_name}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700} color="#1976d2">{row.liters}L</Typography>
                        </TableCell>
                        <TableCell align="center">
                          {row.sms_sent
                            ? <CheckIcon sx={{ fontSize: 18, color: '#2e7d32' }} />
                            : <ErrorIcon sx={{ fontSize: 18, color: '#bdbdbd' }} />
                          }
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="caption" color="text.secondary">
                            {new Date(row.recorded_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            <Box sx={{ textAlign: 'right', mt: 2 }}>
              <Button
                size="small"
                endIcon={<ArrowIcon />}
                onClick={() => navigate('/admin/reports')}
                sx={{ color: '#283593' }}
              >
                View all reports
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
 
export default AdminDashboard;