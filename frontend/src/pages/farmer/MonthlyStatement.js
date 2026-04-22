import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Paper, Typography, Box, Card, CardContent,
  Grid, Divider, Alert, CircularProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Button,
  FormControl, Select, MenuItem,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Opacity as MilkIcon,
  AttachMoney as MoneyIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const months = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const MonthlyStatement = () => {
  const { user } = useAuth();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState(45); // Default price

  const fetchStatement = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const farmerId = user?.farmer_id;
      if (!farmerId) throw new Error('Farmer ID not found. Please log in again.');

      // Get monthly collections
      const res = await api.get(`/collections/farmer/${farmerId}/monthly/${year}/${month}`);
      const monthlyData = res.data;
      
      // Get current milk price
      try {
        const priceRes = await api.get('/prices/current');
        if (priceRes.data && priceRes.data.price_per_liter) {
          setPricePerLiter(priceRes.data.price_per_liter);
        }
      } catch (priceErr) {
        console.warn('Could not fetch current price:', priceErr);
      }
      
      // Calculate total payment
      const totalPayment = monthlyData.total_liters * pricePerLiter;
      
      // Format the data for display
      setData({
        farmer_id: monthlyData.farmer_id,
        farmer_name: monthlyData.farmer_name,
        year: monthlyData.year,
        month: monthlyData.month,
        month_name: months[monthlyData.month - 1],
        total_liters: monthlyData.total_liters,
        collection_days: monthlyData.collection_days,
        daily_breakdown: monthlyData.daily_breakdown || [],
        price_per_liter: pricePerLiter,
        total_payment: totalPayment,
      });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load monthly statement.');
    } finally {
      setLoading(false);
    }
  }, [user, year, month, pricePerLiter]);

  useEffect(() => { fetchStatement(); }, [fetchStatement]);

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      [`Monthly Statement — ${data.farmer_name} (${data.farmer_id})`],
      [`${data.month_name} ${data.year}`],
      [],
      ['Date', 'Litres'],
      ...data.daily_breakdown.map(d => [d.date, d.liters]),
      [],
      ['', 'TOTAL LITRES', data.total_liters],
      ['', 'PRICE PER LITRE', `Ksh ${data.price_per_liter}`],
      ['', 'TOTAL PAYMENT', `Ksh ${data.total_payment.toFixed(2)}`],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statement_${data.farmer_id}_${data.month_name}_${data.year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentYear = today.getFullYear();
  const years = [currentYear - 1, currentYear];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress sx={{ color: '#2e7d32' }} size={48} />
        <Typography color="text.secondary">Loading monthly statement...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ pb: 4 }}>
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      </Container>
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
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CalendarIcon sx={{ fontSize: 36 }} />
              <Box>
                <Typography variant="h4" fontWeight={700}>Monthly Statement</Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  View your milk collection summary and payment
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <FormControl size="small" sx={{ minWidth: 120, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1 }}>
                <Select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  sx={{ color: 'white', '& .MuiSelect-icon': { color: 'white' } }}
                >
                  {months.map((m, idx) => (
                    <MenuItem key={idx} value={idx + 1}>{m}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 100, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1 }}>
                <Select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  sx={{ color: 'white', '& .MuiSelect-icon': { color: 'white' } }}
                >
                  {years.map((y) => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      {data && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total Litres</Typography>
                    <Typography variant="h4" fontWeight={700} color="#1b5e20">
                      {data.total_liters} L
                    </Typography>
                  </Box>
                  <MilkIcon sx={{ fontSize: 48, color: '#2e7d32' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Price per Litre</Typography>
                    <Typography variant="h4" fontWeight={700} color="#f57c00">
                      Ksh {data.price_per_liter}
                    </Typography>
                  </Box>
                  <TrendingIcon sx={{ fontSize: 48, color: '#f57c00' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total Payment</Typography>
                    <Typography variant="h4" fontWeight={700} color="#1a237e">
                      Ksh {data.total_payment.toLocaleString()}
                    </Typography>
                  </Box>
                  <MoneyIcon sx={{ fontSize: 48, color: '#1a237e' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Daily Breakdown Table */}
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            Daily Breakdown - {data?.month_name} {data?.year}
          </Typography>
          <Button
            startIcon={<DownloadIcon />}
            onClick={exportCSV}
            variant="outlined"
            size="small"
            sx={{ borderRadius: 2 }}
          >
            Export CSV
          </Button>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {!data?.daily_breakdown || data.daily_breakdown.length === 0 ? (
          <Alert severity="info">No collections recorded for this month.</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Litres</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.daily_breakdown.map((item, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>{item.date}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={500}>{item.liters} L</Typography>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ backgroundColor: '#e8f5e9' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {data.total_liters} L
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};

export default MonthlyStatement;
