import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Paper, Typography, Box, Grid, Divider, Alert, CircularProgress, Chip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  Today as TodayIcon,
  Opacity as MilkIcon,
  LocalShipping as TruckIcon,
  Sms as SmsIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
 
const DailyRecord = () => {
  const { user } = useAuth();
  const [collections, setCollections] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
 
  const fetchDailyRecord = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
 
      const farmerId = user?.farmer_id;
      if (!farmerId) throw new Error('Farmer ID not found. Please log in again.');
 
      // Fetch today's collections using date filter
      const today = new Date().toISOString().split('T')[0];
      const [historyRes, summaryRes] = await Promise.all([
        api.get(`/collections/farmer/${farmerId}/history`, {
          params: { start_date: today, end_date: today },
        }),
        api.get(`/collections/farmer/${farmerId}/summary`),
      ]);
 
      setCollections(historyRes.data || []);
      setSummary(summaryRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load daily record.');
    } finally {
      setLoading(false);
    }
  }, [user]);
 
  useEffect(() => { fetchDailyRecord(); }, [fetchDailyRecord]);
 
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-KE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
 
  const todayTotal = collections.reduce((sum, c) => sum + c.liters, 0);
  const smsSentCount = collections.filter(c => c.sms_sent).length;
 
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress sx={{ color: '#2e7d32' }} size={48} />
        <Typography color="text.secondary">Loading today's records...</Typography>
      </Box>
    );
  }
 
  return (
    <Container maxWidth="lg" sx={{ pb: 4 }}>
 
      {/* Header */}
      <Paper sx={{
        p: 3, mb: 3, mt: 2, borderRadius: 3, color: 'white',
        background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 60%, #388e3c 100%)',
      }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TodayIcon sx={{ fontSize: 36 }} />
              <Box>
                <Typography variant="h4" fontWeight={700}>Daily Collection</Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>{formattedDate}</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, p: 2, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Today's Total</Typography>
              <Typography variant="h3" fontWeight={800}>{todayTotal.toFixed(1)} L</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
 
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
 
      {/* Stat cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'Collections Today', value: collections.length, color: '#1976d2', bg: '#e3f2fd', icon: <MilkIcon /> },
          { label: 'Total Litres', value: `${todayTotal.toFixed(1)} L`, color: '#2e7d32', bg: '#e8f5e9', icon: <MilkIcon /> },
          { label: 'Month Total', value: `${summary?.month_total ?? 0} L`, color: '#f57c00', bg: '#fff3e0', icon: <TodayIcon /> },
          { label: 'SMS Notifications', value: smsSentCount, color: '#7b1fa2', bg: '#f3e5f5', icon: <SmsIcon /> },
        ].map((s) => (
          <Grid item xs={6} md={3} key={s.label}>
            <Paper sx={{ p: 2, borderRadius: 3, backgroundColor: s.bg, boxShadow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ backgroundColor: s.color + '22', borderRadius: 1.5, p: 0.75 }}>
                  {React.cloneElement(s.icon, { sx: { fontSize: 20, color: s.color } })}
                </Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>{s.label}</Typography>
              </Box>
              <Typography variant="h5" fontWeight={800} color={s.color}>{s.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
 
      {/* Collections table */}
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <MilkIcon sx={{ color: '#2e7d32' }} />
          <Typography variant="h6" fontWeight={700}>
            Collection Records — {collections.length} {collections.length === 1 ? 'entry' : 'entries'}
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
 
        {collections.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            No collections recorded today. Check back after your transporter has made a collection.
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Litres</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Transporter</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>SMS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {collections.map((c, idx) => (
                    <TableRow key={c.id} hover sx={{ backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(c.recorded_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={700} color="#1976d2">{c.liters} L</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TruckIcon sx={{ fontSize: 16, color: '#f57c00' }} />
                          <Typography variant="body2">{c.transporter_name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        {c.sms_sent
                          ? <Chip icon={<CheckIcon />} label="Sent" size="small" color="success" variant="outlined" />
                          : <Typography variant="caption" color="text.secondary">—</Typography>
                        }
                      </TableCell>
                    </TableRow>
                  ))}
 
                  {/* Total row */}
                  <TableRow sx={{ backgroundColor: '#e8f5e9' }}>
                    <TableCell sx={{ fontWeight: 800 }}>TOTAL</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#1b5e20' }}>
                      {todayTotal.toFixed(1)} L
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
 
            {/* Footer note */}
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f0f4f0', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary">
                You received an SMS notification after each collection confirming your daily and monthly totals.
                Contact your cooperative administrator if you notice any discrepancies.
              </Typography>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};
 
export default DailyRecord;