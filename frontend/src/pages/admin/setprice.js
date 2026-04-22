import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Box, Card, CardContent,
  Grid, Divider, Button, TextField, InputAdornment, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControl, InputLabel, Select, MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  History as HistoryIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
  Today as TodayIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
 
const calculatePriceImpact = (newPrice, currentPrice, totalMonthlyLiters) => {
  const priceDiff = newPrice - currentPrice;
  const monthlyImpact = priceDiff * totalMonthlyLiters;
  return {
    perLiter: priceDiff.toFixed(2),
    monthly: monthlyImpact.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    yearly: (monthlyImpact * 12).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  };
};
 
const SEASON_LITERS = {
  current: 15000,
  peak: 20000,
  low: 10000,
};
 
const SetPrice = () => {
  const { user } = useAuth();
  const [currentPrice, setCurrentPrice] = useState(45.00);
  const [newPrice, setNewPrice] = useState('');
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [openDialog, setOpenDialog] = useState(false);
  const [impact, setImpact] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState('current');
  const [totalLiters, setTotalLiters] = useState(SEASON_LITERS.current);
 
  // Load current price and history from API
  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        setLoading(true);
 
        // Fetch current price
        const priceRes = await api.get('/admin/price/current');
        const price = priceRes.data?.price_per_liter ?? 45.0;
        setCurrentPrice(price);
 
        // Fetch price history (all prices ordered by date)
        // Your backend returns all MilkPrice records — adjust endpoint if needed
        const historyRes = await api.get('/admin/price/history').catch(() => ({ data: [] }));
        setPriceHistory(historyRes.data || []);
 
      } catch (err) {
        setAlert({ show: true, type: 'error', message: 'Failed to load current price. Using default.' });
        setCurrentPrice(45.0);
      } finally {
        setLoading(false);
      }
    };
 
    fetchPriceData();
  }, []);
 
  // Recalculate impact when inputs change
  useEffect(() => {
    const parsed = parseFloat(newPrice);
    if (newPrice && !isNaN(parsed) && parsed > 0) {
      setImpact(calculatePriceImpact(parsed, currentPrice, totalLiters));
    } else {
      setImpact(null);
    }
  }, [newPrice, currentPrice, totalLiters]);
 
  const handleSeasonChange = (e) => {
    setSelectedSeason(e.target.value);
    setTotalLiters(SEASON_LITERS[e.target.value]);
  };
 
  const handleUpdatePrice = () => {
    const parsed = parseFloat(newPrice);
    if (!newPrice || isNaN(parsed) || parsed <= 0) {
      setAlert({ show: true, type: 'error', message: 'Please enter a valid price.' });
      return;
    }
    setOpenDialog(true);
  };
 
  const confirmUpdate = async () => {
    setOpenDialog(false);
    setSaving(true);
    try {
      await api.post('/admin/price', { price_per_liter: parseFloat(newPrice) });
 
      // Refresh current price from API to confirm
      const res = await api.get('/admin/price/current');
      const updated = res.data?.price_per_liter ?? parseFloat(newPrice);
      setCurrentPrice(updated);
 
      // Prepend to history display
      setPriceHistory(prev => [{
        id: Date.now(),
        price_per_liter: parseFloat(newPrice),
        effective_date: new Date().toISOString().split('T')[0],
        created_by: user?.name || 'Admin',
        is_active: true,
      }, ...prev.map(p => ({ ...p, is_active: false }))]);
 
      setNewPrice('');
      setAlert({ show: true, type: 'success', message: `Milk price updated to Ksh ${parseFloat(newPrice).toFixed(2)} per litre.` });
    } catch (err) {
      setAlert({ show: true, type: 'error', message: err.response?.data?.detail || 'Failed to update price. Please try again.' });
    } finally {
      setSaving(false);
    }
  };
 
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress sx={{ color: '#2e7d32' }} />
        <Typography color="text.secondary">Loading price settings...</Typography>
      </Box>
    );
  }
 
  const parsedNew = parseFloat(newPrice);
  const priceChanged = newPrice && !isNaN(parsedNew) && parsedNew !== currentPrice;
 
  return (
    <Container maxWidth="lg" sx={{ pb: 4 }}>
 
      {alert.show && (
        <Alert severity={alert.type} sx={{ mb: 2, borderRadius: 2 }} onClose={() => setAlert({ ...alert, show: false })}>
          {alert.message}
        </Alert>
      )}
 
      {/* Header */}
      <Paper sx={{
        p: 3, mb: 3, borderRadius: 3, color: 'white', mt: 2,
        background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
      }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <MoneyIcon sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" fontWeight={700}>Milk Price Settings</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Set and manage milk prices for the cooperative
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={5}>
            <Card sx={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', borderRadius: 2 }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Current Price</Typography>
                <Typography variant="h3" fontWeight={800}>Ksh {currentPrice.toFixed(2)}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>per litre</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
 
      {/* Update Price */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 2 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon sx={{ color: '#2e7d32' }} /> Update Milk Price
        </Typography>
        <Divider sx={{ mb: 3 }} />
 
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label="New Price (Ksh per litre)"
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">Ksh</InputAdornment>,
                inputProps: { step: '0.5', min: '0.01' },
              }}
              placeholder="45.00"
              helperText="Enter the new milk price per litre"
            />
          </Grid>
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                onClick={handleUpdatePrice}
                disabled={!priceChanged || saving}
                sx={{
                  height: 56, px: 3, fontWeight: 700, borderRadius: 2,
                  backgroundColor: '#2e7d32', '&:hover': { backgroundColor: '#1b5e20' },
                }}
              >
                {saving ? 'Saving...' : 'Update Price'}
              </Button>
              {priceChanged && (
                <Chip
                  icon={<TrendingUpIcon />}
                  label={`Change: ${parsedNew > currentPrice ? '+' : ''}${(parsedNew - currentPrice).toFixed(2)} Ksh`}
                  color={parsedNew > currentPrice ? 'success' : 'error'}
                  sx={{ fontWeight: 700 }}
                />
              )}
            </Box>
          </Grid>
        </Grid>
 
        {/* Financial impact preview */}
        {impact && (
          <Box sx={{ mt: 3, p: 2.5, backgroundColor: '#f0f4f0', borderRadius: 2, border: '1px solid #c8e6c9' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" fontWeight={700}>Estimated Financial Impact</Typography>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>Monthly Production Volume</InputLabel>
                <Select value={selectedSeason} label="Monthly Production Volume" onChange={handleSeasonChange}>
                  <MenuItem value="current">Average Season (15,000 L)</MenuItem>
                  <MenuItem value="peak">Peak Season (20,000 L)</MenuItem>
                  <MenuItem value="low">Low Season (10,000 L)</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Grid container spacing={2}>
              {[
                { label: 'Per Litre Change', value: `${impact.perLiter > 0 ? '+' : ''}${impact.perLiter} Ksh` },
                { label: 'Monthly Impact', value: `${impact.monthly > 0 ? '+' : ''}Ksh ${impact.monthly}` },
                { label: 'Yearly Impact', value: `${impact.yearly > 0 ? '+' : ''}Ksh ${impact.yearly}` },
              ].map((s) => (
                <Grid item xs={12} md={4} key={s.label}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>{s.label}</Typography>
                      <Typography variant="h6" fontWeight={700}
                        color={parseFloat(impact.perLiter) >= 0 ? 'success.main' : 'error.main'}>
                        {s.value}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>
 
      {/* Price History */}
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon sx={{ color: '#2e7d32' }} /> Price History
        </Typography>
        <Divider sx={{ mb: 2 }} />
 
        {priceHistory.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            No price history available yet. Set a price above to get started.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Effective Date</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Price (Ksh/L)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Set By</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {priceHistory.map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TodayIcon fontSize="small" color="action" />
                        {record.effective_date || record.effectiveDate}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={700} color="#2e7d32">
                        Ksh {parseFloat(record.price_per_liter || record.price).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>{record.created_by || record.setBy || 'Admin'}</TableCell>
                    <TableCell align="center">
                      {record.is_active
                        ? <Chip label="Current" size="small" color="success" />
                        : <Chip label="Historical" size="small" variant="outlined" />
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
 
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Price changes take effect immediately and apply to all new collections. Previous prices are retained for records.
        </Typography>
      </Paper>
 
      {/* Confirmation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Price Update</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to update the milk price from{' '}
            <strong>Ksh {currentPrice.toFixed(2)}</strong> to{' '}
            <strong>Ksh {parsedNew ? parsedNew.toFixed(2) : '—'}</strong>?
          </Typography>
          {impact && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="body2" gutterBottom fontWeight={600}>Estimated impact:</Typography>
              <Typography variant="body2">• Monthly change: <strong>Ksh {impact.monthly}</strong></Typography>
              <Typography variant="body2">• Yearly change: <strong>Ksh {impact.yearly}</strong></Typography>
            </Box>
          )}
          <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
            This change takes effect immediately for all new collections.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setOpenDialog(false)} startIcon={<CancelIcon />} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={confirmUpdate}
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{ backgroundColor: '#2e7d32', '&:hover': { backgroundColor: '#1b5e20' } }}
          >
            Confirm Update
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
 
export default SetPrice;