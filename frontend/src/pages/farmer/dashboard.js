import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Today as TodayIcon,
  CalendarToday as MonthIcon,
  AttachMoney as MoneyIcon,
  Opacity as MilkIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
 
const StatCard = ({ icon, title, value, subtitle, color, bg }) => (
  <Card sx={{ height: '100%', backgroundColor: bg, borderRadius: 3, boxShadow: 2 }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ backgroundColor: color + '22', borderRadius: 2, p: 1, mr: 1.5 }}>
          {React.cloneElement(icon, { sx: { fontSize: 32, color } })}
        </Box>
        <Typography variant="h6" color="text.secondary" fontWeight={500}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h3" sx={{ fontWeight: 'bold', color, mb: 0.5 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    </CardContent>
  </Card>
);
 
const FarmerDashboard = () => {
  const { user } = useAuth();
 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({
    today_total: 0,
    month_total: 0,
    estimated_payment: 0
  });
 
  const fetchFarmerSummary = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
 
      const farmerId = user?.farmer_id || user?.id;
      if (!farmerId) throw new Error('Farmer ID not found. Please log in again.');
 
      const response = await api.get(`/collections/farmer/${farmerId}/summary`);
      const data = response.data;
 
      setSummary({
        today_total: data.today_total ?? 0,
        month_total: data.month_total ?? 0,
        estimated_payment: data.estimated_payment ?? 0
      });
    } catch (err) {
      console.error('❌ Error fetching summary:', err);
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Failed to load your summary. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);
 
  useEffect(() => {
    fetchFarmerSummary();
  }, [fetchFarmerSummary]);
 
  const formatCurrency = (amount) =>
    `Ksh ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
 
  const today = new Date();
  const dayOfMonth = today.getDate();
  const dailyAverage = dayOfMonth > 0 ? (summary.month_total / dayOfMonth).toFixed(1) : '0.0';
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const remainingDays = daysInMonth - dayOfMonth;
  const projectedTotal = (summary.month_total + (dailyAverage * remainingDays)).toFixed(1);
 
  const greetingTime = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };
 
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8, gap: 2 }}>
          <CircularProgress size={48} sx={{ color: '#2e7d32' }} />
          <Typography color="text.secondary">Loading your dashboard...</Typography>
        </Box>
      </Container>
    );
  }
 
  return (
    <Container maxWidth="lg" sx={{ pb: 4 }}>
 
      {/* Header */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          mt: 2,
          background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 60%, #388e3c 100%)',
          borderRadius: 3,
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {greetingTime()}, {user?.name || 'Farmer'}! 🌿
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.85 }}>
              {today.toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>
            <Box sx={{ mt: 1.5 }}>
              <Chip
                icon={summary.today_total > 0
                  ? <CheckCircleIcon sx={{ color: 'white !important' }} />
                  : <ScheduleIcon sx={{ color: 'white !important' }} />}
                label={summary.today_total > 0 ? 'Collection recorded today' : 'No collection yet today'}
                size="small"
                sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 500 }}
              />
            </Box>
          </Box>
          <Tooltip title="Refresh data">
            <IconButton
              onClick={() => fetchFarmerSummary(true)}
              disabled={refreshing}
              sx={{ color: 'white', backgroundColor: 'rgba(255,255,255,0.15)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.25)' } }}
            >
              <RefreshIcon sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
 
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
 
      {/* Stat Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <StatCard
            icon={<TodayIcon />}
            title="Today's Collection"
            value={`${summary.today_total.toFixed(1)} L`}
            subtitle="Recorded today"
            color="#1976d2"
            bg="#e3f2fd"
          />
        </Grid>
 
        <Grid item xs={12} md={4}>
          <StatCard
            icon={<MonthIcon />}
            title="Month's Total"
            value={`${summary.month_total.toFixed(1)} L`}
            subtitle="Cumulative this month"
            color="#ed6c02"
            bg="#fff3e0"
          />
        </Grid>
 
        <Grid item xs={12} md={4}>
          <StatCard
            icon={<MoneyIcon />}
            title="Expected Payment"
            value={formatCurrency(summary.estimated_payment)}
            subtitle="Estimated for this month"
            color="#2e7d32"
            bg="#e8f5e9"
          />
        </Grid>
 
        {/* Quick Stats */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUpIcon sx={{ mr: 1, color: '#2e7d32' }} />
              <Typography variant="h6" fontWeight={600}>
                Quick Statistics
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
 
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 1.5, borderRadius: 2, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Daily Average
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="#1976d2">
                    {dailyAverage} L
                  </Typography>
                  <Typography variant="caption" color="text.secondary">per day this month</Typography>
                </Box>
              </Grid>
 
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 1.5, borderRadius: 2, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Days Elapsed
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="#ed6c02">
                    {dayOfMonth}/{daysInMonth}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{remainingDays} days remaining</Typography>
                </Box>
              </Grid>
 
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 1.5, borderRadius: 2, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Month Projection
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="#2e7d32">
                    {projectedTotal} L
                  </Typography>
                  <Typography variant="caption" color="text.secondary">at current rate</Typography>
                </Box>
              </Grid>
 
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 1.5, borderRadius: 2, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Payment Status
                  </Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ color: '#f59e0b' }}>
                    Pending
                  </Typography>
                  <Typography variant="caption" color="text.secondary">paid at month end</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
 
        {/* SMS Notice */}
        <Grid item xs={12}>
          <Alert
            icon={<MilkIcon />}
            severity="info"
            sx={{ borderRadius: 2 }}
          >
            You will receive an SMS after every milk collection confirming your daily total and monthly running total.
          </Alert>
        </Grid>
      </Grid>
 
      {/* Spin animation for refresh icon */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Container>
  );
};
 
export default FarmerDashboard;