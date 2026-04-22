import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Grid, Paper, Typography, Box, Card, CardContent,
  CircularProgress, Alert, Divider, Chip, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Avatar,
} from '@mui/material';
import {
  LocalShipping as TruckIcon,
  Opacity as MilkIcon,
  People as PeopleIcon,
  Sms as SmsIcon,
  AddCircleOutline as RecordIcon,
  History as HistoryIcon,
  Search as SearchIcon,
  Assessment as SummaryIcon,
  CheckCircle as CheckIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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
 
const TransporterDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [todayData, setTodayData] = useState(null);
 
  const fetchTodayData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const username = user?.username || user?.name;
      if (!username) throw new Error('Transporter username not found. Please log in again.');
      const res = await api.get(`/collections/transporter/${username}/today`);
      setTodayData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [user]);
 
  useEffect(() => { fetchTodayData(); }, [fetchTodayData]);
 
  const today = new Date();
  const greetingTime = () => {
    const h = today.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };
 
  const smsSentCount = todayData?.collections?.filter(c => c.sms_sent).length || 0;
 
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress sx={{ color: '#f57c00' }} size={48} />
        <Typography color="text.secondary">Loading your dashboard...</Typography>
      </Box>
    );
  }
 
  return (
    <Container maxWidth="lg" sx={{ pb: 4 }}>
 
      {/* Header */}
      <Paper sx={{
        p: 3, mb: 3, mt: 2, borderRadius: 3, color: 'white',
        background: 'linear-gradient(135deg, #e65100 0%, #f57c00 60%, #ffa000 100%)',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <TruckIcon sx={{ fontSize: 32 }} />
              <Typography variant="h4" fontWeight={700}>
                {greetingTime()}, {user?.name || 'Transporter'}!
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              {today.toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>
          </Box>
          <Chip
            icon={<CheckIcon sx={{ color: 'white !important' }} />}
            label={todayData?.total_collections
              ? `${todayData.total_collections} collection${todayData.total_collections !== 1 ? 's' : ''} today`
              : 'No collections yet'}
            sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
          />
        </Box>
      </Paper>
 
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
 
      {/* Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <StatCard icon={<PeopleIcon />} label="Farmers Today" value={todayData?.total_collections || 0}
            sub="collections recorded" color="#f57c00" bg="#fff3e0" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={<MilkIcon />} label="Total Litres" value={`${todayData?.total_liters || 0} L`}
            sub="collected today" color="#1976d2" bg="#e3f2fd" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={<SmsIcon />} label="SMS Sent" value={smsSentCount}
            sub="farmers notified" color="#2e7d32" bg="#e8f5e9" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={<SummaryIcon />} label="Avg per Farmer"
            value={todayData?.total_collections
              ? `${(todayData.total_liters / todayData.total_collections).toFixed(1)} L`
              : '0 L'}
            sub="this session" color="#7b1fa2" bg="#f3e5f5" />
        </Grid>
      </Grid>
 
      <Grid container spacing={3}>
 
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Quick Actions</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <QuickAction navigate={navigate} path="/transporter/record"
                icon={<RecordIcon />} label="Record Collection"
                desc="Add new milk collection" color="#f57c00" />
              <QuickAction navigate={navigate} path="/transporter/search"
                icon={<SearchIcon />} label="Find Farmer"
                desc="Look up farmer details" color="#1976d2" />
              <QuickAction navigate={navigate} path="/transporter/summary"
                icon={<SummaryIcon />} label="Daily Summary"
                desc="View today's full report" color="#2e7d32" />
              <QuickAction navigate={navigate} path="/transporter/history"
                icon={<HistoryIcon />} label="Collection History"
                desc="Browse past records" color="#7b1fa2" />
            </Box>
          </Paper>
        </Grid>
 
        {/* Today's collections table */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Today's Collections</Typography>
            <Divider sx={{ mb: 2 }} />
 
            {!todayData?.collections?.length ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <MilkIcon sx={{ fontSize: 48, color: '#bdbdbd', mb: 1 }} />
                <Typography color="text.secondary" gutterBottom>No collections recorded yet today.</Typography>
                <Button variant="contained" startIcon={<RecordIcon />}
                  onClick={() => navigate('/transporter/record')}
                  sx={{ mt: 1, backgroundColor: '#f57c00', '&:hover': { backgroundColor: '#e65100' } }}>
                  Record First Collection
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Farmer</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Litres</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>SMS</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {todayData.collections.map((c) => (
                      <TableRow key={c.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{c.farmer_name}</Typography>
                          <Typography variant="caption" color="text.secondary">{c.farmer_id}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={700} color="#1976d2">{c.liters} L</Typography>
                        </TableCell>
                        <TableCell align="center">
                          {c.sms_sent
                            ? <CheckIcon sx={{ fontSize: 18, color: '#2e7d32' }} />
                            : <Typography variant="caption" color="text.secondary">—</Typography>}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="caption" color="text.secondary">{c.time}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
 
            {todayData?.collections?.length > 0 && (
              <Box sx={{ textAlign: 'right', mt: 2 }}>
                <Button size="small" endIcon={<ArrowIcon />}
                  onClick={() => navigate('/transporter/summary')}
                  sx={{ color: '#f57c00' }}>
                  View full summary
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
 
export default TransporterDashboard;