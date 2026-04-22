import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Paper, Typography, Box, Grid, Divider, Chip,
  Alert, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, CircularProgress, Button,
} from '@mui/material';
import {
  Assessment as SummaryIcon,
  Opacity as MilkIcon,
  People as PeopleIcon,
  Sms as SmsIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
 
const DailySummary = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
 
  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const username = user?.username || user?.name;
      if (!username) throw new Error('Transporter not identified. Please log in again.');
      const res = await api.get(`/collections/transporter/${username}/today`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load daily summary.');
    } finally {
      setLoading(false);
    }
  }, [user]);
 
  useEffect(() => { fetchSummary(); }, [fetchSummary]);
 
  const exportCSV = () => {
    if (!data?.collections?.length) return;
    const rows = [
      ['Summary Date', data.date],
      ['Transporter', data.transporter],
      ['Total Collections', data.total_collections],
      ['Total Litres', data.total_liters],
      [],
      ['Farmer ID', 'Farmer Name', 'Litres', 'SMS Sent', 'Time'],
      ...data.collections.map(c => [
        c.farmer_id, c.farmer_name, c.liters, c.sms_sent ? 'Yes' : 'No', c.time,
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily_summary_${data.date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
 
  const today = new Date().toLocaleDateString('en-KE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
 
  const smsSent = data?.collections?.filter(c => c.sms_sent).length || 0;
  const smsFailed = (data?.total_collections || 0) - smsSent;
 
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress sx={{ color: '#f57c00' }} size={48} />
        <Typography color="text.secondary">Loading daily summary...</Typography>
      </Box>
    );
  }
 
  return (
    <Container maxWidth="lg" sx={{ pb: 4 }}>
 
      {/* Header */}
      <Paper sx={{
        p: 3, mb: 3, mt: 2, borderRadius: 3, color: 'white',
        background: 'linear-gradient(135deg, #e65100 0%, #f57c00 100%)',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SummaryIcon sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="h4" fontWeight={700}>Daily Summary</Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>{today}</Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportCSV}
            disabled={!data?.collections?.length}
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' } }}
          >
            Export CSV
          </Button>
        </Box>
      </Paper>
 
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
 
      {/* Summary stat cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { icon: <PeopleIcon />, label: 'Farmers Visited', value: data?.total_collections || 0, color: '#f57c00', bg: '#fff3e0' },
          { icon: <MilkIcon />, label: 'Total Litres', value: `${data?.total_liters || 0} L`, color: '#1976d2', bg: '#e3f2fd' },
          { icon: <SmsIcon />, label: 'SMS Sent', value: smsSent, color: '#2e7d32', bg: '#e8f5e9' },
          { icon: <CancelIcon />, label: 'SMS Failed', value: smsFailed, color: smsFailed > 0 ? '#d32f2f' : '#9e9e9e', bg: smsFailed > 0 ? '#ffebee' : '#f5f5f5' },
        ].map((s) => (
          <Grid item xs={6} md={3} key={s.label}>
            <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: 2, backgroundColor: s.bg }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ backgroundColor: s.color + '22', borderRadius: 1.5, p: 0.75 }}>
                  {React.cloneElement(s.icon, { sx: { fontSize: 22, color: s.color } })}
                </Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>{s.label}</Typography>
              </Box>
              <Typography variant="h4" fontWeight={800} color={s.color}>{s.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
 
      {/* Collections breakdown */}
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>Collection Breakdown</Typography>
          {data?.total_liters > 0 && (
            <Chip
              label={`${data.total_liters} L total`}
              sx={{ backgroundColor: '#fff3e0', color: '#e65100', fontWeight: 700 }}
            />
          )}
        </Box>
        <Divider sx={{ mb: 2 }} />
 
        {!data?.collections?.length ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <MilkIcon sx={{ fontSize: 48, color: '#bdbdbd', mb: 1 }} />
            <Typography color="text.secondary" gutterBottom>No collections recorded today.</Typography>
            <Typography variant="caption" color="text.secondary">
              Use the Record Collection page to start adding records.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Farmer</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Litres</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>SMS Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.collections.map((c, idx) => (
                  <TableRow key={c.id} hover sx={{ backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{idx + 1}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{c.farmer_name || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{c.farmer_id}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={700} color="#1976d2">{c.liters} L</Typography>
                    </TableCell>
                    <TableCell align="center">
                      {c.sms_sent
                        ? <Chip icon={<CheckIcon />} label="Sent" size="small" color="success" />
                        : <Chip icon={<CancelIcon />} label="Not sent" size="small" color="default" />
                      }
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" color="text.secondary">{c.time}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
 
                {/* Totals row */}
                <TableRow sx={{ backgroundColor: '#fff3e0' }}>
                  <TableCell colSpan={2} sx={{ fontWeight: 800 }}>TOTAL</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: '#e65100' }}>
                    {data.total_liters} L
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={`${smsSent}/${data.total_collections} sent`} size="small"
                      color={smsFailed === 0 ? 'success' : 'warning'} />
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};
 
export default DailySummary;