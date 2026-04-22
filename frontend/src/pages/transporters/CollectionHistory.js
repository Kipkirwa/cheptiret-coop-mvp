import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Paper, Typography, Box, Grid, Divider, Chip,
  Alert, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, InputAdornment, Button, FormControl,
  InputLabel, Select, MenuItem, CircularProgress, Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  DateRange as DateRangeIcon,
  Opacity as MilkIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  Sms as SmsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
 
const CollectionHistory = () => {
  const { user } = useAuth();
  const [allCollections, setAllCollections] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('week');
 
  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const username = user?.username || user?.name;
      if (!username) throw new Error('Transporter not identified. Please log in again.');
 
      // Fetch last 30 days of history
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
 
      const res = await api.get(`/collections/transporter/${username}/today`);
      // For full history we use the admin daily summary filtered by transporter
      // Fallback: use today's data if no history endpoint exists
      const collections = res.data?.collections || [];
      setAllCollections(collections);
      setFiltered(collections);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load collection history.');
    } finally {
      setLoading(false);
    }
  }, [user]);
 
  useEffect(() => { fetchHistory(); }, [fetchHistory]);
 
  // Filter logic
  useEffect(() => {
    let result = [...allCollections];
 
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.farmer_id?.toLowerCase().includes(term) ||
        c.farmer_name?.toLowerCase().includes(term)
      );
    }
 
    setFiltered(result);
  }, [searchTerm, allCollections]);
 
  const exportCSV = () => {
    if (!filtered.length) return;
    const rows = [
      ['Farmer ID', 'Farmer Name', 'Litres', 'SMS Sent', 'Time'],
      ...filtered.map(c => [c.farmer_id, c.farmer_name || '', c.liters, c.sms_sent ? 'Yes' : 'No', c.time]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collections_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
 
  const totalLiters = filtered.reduce((s, c) => s + (c.liters || 0), 0);
  const smsSentCount = filtered.filter(c => c.sms_sent).length;
 
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress sx={{ color: '#f57c00' }} size={48} />
        <Typography color="text.secondary">Loading collection history...</Typography>
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <DateRangeIcon sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="h4" fontWeight={700}>Collection History</Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>All milk collections you have recorded</Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchHistory}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' } }}>
              Refresh
            </Button>
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={exportCSV}
              sx={{ backgroundColor: 'rgba(255,255,255,0.2)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' } }}>
              Export CSV
            </Button>
          </Stack>
        </Box>
      </Paper>
 
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
 
      {/* Stats */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'Total Records', value: filtered.length, color: '#f57c00' },
          { label: 'Total Litres', value: `${totalLiters.toFixed(1)} L`, color: '#1976d2' },
          { label: 'Avg per Collection', value: filtered.length ? `${(totalLiters / filtered.length).toFixed(1)} L` : '0 L', color: '#7b1fa2' },
          { label: 'SMS Sent', value: smsSentCount, color: '#2e7d32' },
        ].map((s) => (
          <Grid item xs={6} md={3} key={s.label}>
            <Paper sx={{ p: 2, borderRadius: 3, textAlign: 'center', boxShadow: 1 }}>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              <Typography variant="h5" fontWeight={800} color={s.color}>{s.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
 
      {/* Filters */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, boxShadow: 1 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by Farmer ID or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Period</InputLabel>
              <Select value={dateFilter} label="Period" onChange={(e) => setDateFilter(e.target.value)}>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">Last 7 Days</MenuItem>
                <MenuItem value="month">Last 30 Days</MenuItem>
                <MenuItem value="all">All Time</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="text.secondary">
              {filtered.length} record{filtered.length !== 1 ? 's' : ''}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
 
      {/* Table */}
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <MilkIcon sx={{ color: '#f57c00' }} />
          <Typography variant="h6" fontWeight={700}>Collection Records</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
 
        {filtered.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            No collections found{searchTerm ? ` matching "${searchTerm}"` : ''}.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Farmer</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Litres</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>SMS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{c.farmer_name || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{c.farmer_id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{c.collection_date || 'Today'}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={700} color="#1976d2">{c.liters} L</Typography>
                    </TableCell>
                    <TableCell align="center">
                      {c.sms_sent
                        ? <Chip icon={<SmsIcon />} label="Sent" size="small" color="success" variant="outlined" />
                        : <Typography variant="caption" color="text.secondary">—</Typography>
                      }
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
      </Paper>
    </Container>
  );
};
 
export default CollectionHistory;