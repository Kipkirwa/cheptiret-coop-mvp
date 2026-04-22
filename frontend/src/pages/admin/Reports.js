import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Paper, Typography, Box, Grid, Divider, Alert,
  CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, FormControl, Select, MenuItem,
  Chip,
} from '@mui/material';
import {
  Assessment as ReportsIcon,
  Opacity as MilkIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingIcon,
  LocalShipping as TruckIcon,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import api from '../../services/api';
 
const months = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
 
const Reports = () => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [monthlyData, setMonthlyData] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
 
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
 
      const [paymentsRes, statsRes] = await Promise.all([
        api.get(`/admin/monthly-payments/${year}/${month}`),
        api.get('/admin/stats'),
      ]);
 
      setMonthlyData(paymentsRes.data);
      setAdminStats(statsRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, [year, month]);
 
  useEffect(() => { fetchData(); }, [fetchData]);
 
  // Build daily chart data from admin stats recent activity
  const buildChartData = () => {
    if (!adminStats?.recent_activity) return [];
    const byDate = {};
    adminStats.recent_activity.forEach((c) => {
      const d = c.collection_date;
      if (!byDate[d]) byDate[d] = { date: d, liters: 0, collections: 0 };
      byDate[d].liters += c.liters;
      byDate[d].collections += 1;
    });
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  };
 
  const chartData = buildChartData();
 
  const exportCSV = () => {
    if (!monthlyData) return;
    const rows = [
      [`Cheptiret Cooperative — Monthly Report`],
      [`${monthlyData.month_name} ${monthlyData.year}`],
      [`Price per Litre: Ksh ${monthlyData.price_per_liter}`],
      [],
      ['Farmer ID', 'Farmer Name', 'Phone', 'Total Litres', 'Total Payment (Ksh)'],
      ...monthlyData.farmers.map(f => [
        f.farmer_id, f.farmer_name, f.phone, f.total_liters, f.total_payment,
      ]),
      [],
      ['', 'TOTALS', '', monthlyData.grand_total_liters, monthlyData.grand_total_payment],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${monthlyData.month_name}_${monthlyData.year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
 
  const currentYear = today.getFullYear();
  const years = [currentYear - 1, currentYear];
 
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress sx={{ color: '#283593' }} size={48} />
        <Typography color="text.secondary">Loading reports...</Typography>
      </Box>
    );
  }
 
  return (
    <Container maxWidth="lg" sx={{ pb: 4 }}>
 
      {/* Header */}
      <Paper sx={{
        p: 3, mb: 3, mt: 2, borderRadius: 3, color: 'white',
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 60%, #3949ab 100%)',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ReportsIcon sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="h4" fontWeight={700}>Reports & Analytics</Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                Collection trends and payment summaries
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small">
              <Select value={month} onChange={(e) => setMonth(e.target.value)}
                sx={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white',
                  '& .MuiSvgIcon-root': { color: 'white' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' } }}>
                {months.map((m, i) => <MenuItem key={i + 1} value={i + 1}>{m}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small">
              <Select value={year} onChange={(e) => setYear(e.target.value)}
                sx={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white',
                  '& .MuiSvgIcon-root': { color: 'white' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' } }}>
                {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>
 
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
 
      {/* Key metrics */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { icon: <PeopleIcon />, label: 'Active Farmers', value: adminStats?.total_farmers ?? 0, color: '#283593', bg: '#e8eaf6' },
          { icon: <MilkIcon />, label: 'Month Litres', value: `${monthlyData?.grand_total_liters ?? 0} L`, color: '#1976d2', bg: '#e3f2fd' },
          { icon: <MoneyIcon />, label: 'Month Payout', value: `Ksh ${(monthlyData?.grand_total_payment ?? 0).toLocaleString()}`, color: '#2e7d32', bg: '#e8f5e9' },
          { icon: <TruckIcon />, label: 'Transporters', value: adminStats?.total_transporters ?? 0, color: '#f57c00', bg: '#fff3e0' },
        ].map((s) => (
          <Grid item xs={6} md={3} key={s.label}>
            <Paper sx={{ p: 2.5, borderRadius: 3, backgroundColor: s.bg, boxShadow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ backgroundColor: s.color + '22', borderRadius: 1.5, p: 0.75 }}>
                  {React.cloneElement(s.icon, { sx: { fontSize: 22, color: s.color } })}
                </Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>{s.label}</Typography>
              </Box>
              <Typography variant="h5" fontWeight={800} color={s.color}>{s.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
 
      {/* Charts */}
      {chartData.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
 
          {/* Bar chart — litres per day */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingIcon sx={{ color: '#283593' }} />
                <Typography variant="h6" fontWeight={700}>Recent Daily Collections</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v} L`, 'Litres']} />
                  <Bar dataKey="liters" fill="#2e7d32" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
 
          {/* Line chart — collections count */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PeopleIcon sx={{ color: '#283593' }} />
                <Typography variant="h6" fontWeight={700}>Farmer Visits</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [v, 'Collections']} />
                  <Legend />
                  <Line type="monotone" dataKey="collections" stroke="#f57c00" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}
 
      {/* Farmer payment breakdown table */}
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MoneyIcon sx={{ color: '#283593' }} />
            <Typography variant="h6" fontWeight={700}>
              Payment Breakdown — {monthlyData?.month_name} {year}
            </Typography>
          </Box>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportCSV}
            disabled={!monthlyData?.farmers?.length}
            sx={{ borderRadius: 2, color: '#283593', borderColor: '#283593' }}>
            Export CSV
          </Button>
        </Box>
        <Divider sx={{ mb: 2 }} />
 
        {!monthlyData?.farmers?.length ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            No collections recorded for {months[month - 1]} {year}.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Rank</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Farmer</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Litres</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Price/L</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Payment (Ksh)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Share</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {monthlyData.farmers.map((f, idx) => {
                  const share = monthlyData.grand_total_liters
                    ? ((f.total_liters / monthlyData.grand_total_liters) * 100).toFixed(1)
                    : 0;
                  return (
                    <TableRow key={f.farmer_id} hover
                      sx={{ backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>#{idx + 1}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{f.farmer_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{f.farmer_id}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={700} color="#1976d2">{f.total_liters} L</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">Ksh {f.price_per_liter}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`Ksh ${f.total_payment.toLocaleString()}`}
                          size="small"
                          sx={{ backgroundColor: '#e8f5e9', color: '#1b5e20', fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" color="text.secondary">{share}%</Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
 
                {/* Totals row */}
                <TableRow sx={{ backgroundColor: '#e8eaf6' }}>
                  <TableCell colSpan={2} sx={{ fontWeight: 800 }}>TOTAL</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: '#1976d2' }}>
                    {monthlyData.grand_total_liters} L
                  </TableCell>
                  <TableCell />
                  <TableCell align="right" sx={{ fontWeight: 800, color: '#1b5e20' }}>
                    Ksh {monthlyData.grand_total_payment.toLocaleString()}
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary">100%</Typography>
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
 
export default Reports;