import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, TextField, Button, Box,
  Grid, Card, CardContent, Alert, Divider, Chip,
  CircularProgress, InputAdornment, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  Save as SaveIcon,
  Person as PersonIcon,
  Sms as SmsIcon,
  Search as SearchIcon,
  CheckCircle as CheckIcon,
  Opacity as MilkIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
 
const CollectionForm = () => {
  const { user } = useAuth();
  const [farmerId, setFarmerId] = useState('');
  const [liters, setLiters] = useState('');
  const [farmer, setFarmer] = useState(null);       // looked-up farmer details
  const [farmerLoading, setFarmerLoading] = useState(false);
  const [farmerError, setFarmerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [todayRecords, setTodayRecords] = useState([]);
 
  // Load today's records for this transporter
  useEffect(() => {
    const loadToday = async () => {
      try {
        const username = user?.username || user?.name;
        if (!username) return;
        const res = await api.get(`/collections/transporter/${username}/today`);
        setTodayRecords(res.data?.collections || []);
      } catch {
        // non-critical — page still works without it
      }
    };
    loadToday();
  }, [user]);
 
  // Look up farmer when ID is entered and user presses Enter or clicks search
  const handleFarmerLookup = async () => {
    if (!farmerId.trim()) return;
    try {
      setFarmerLoading(true);
      setFarmerError('');
      setFarmer(null);
      const res = await api.get(`/collections/farmer/${farmerId.trim()}/summary`);
      setFarmer(res.data);
    } catch (err) {
      setFarmerError(err.response?.status === 404
        ? `Farmer "${farmerId}" not found. Please check the ID.`
        : 'Failed to look up farmer. Try again.'
      );
    } finally {
      setFarmerLoading(false);
    }
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
 
    if (!farmerId.trim() || !liters) {
      setAlert({ show: true, type: 'error', message: 'Please fill in all fields.' });
      return;
    }
    if (parseFloat(liters) <= 0) {
      setAlert({ show: true, type: 'error', message: 'Litres must be greater than zero.' });
      return;
    }
    if (!farmer) {
      setAlert({ show: true, type: 'error', message: 'Please look up the farmer first to confirm their ID.' });
      return;
    }
 
    setSubmitting(true);
    try {
      const response = await api.post('/collections/record', {
        farmer_id: farmerId.trim(),
        liters: parseFloat(liters),
        transporter_username: user?.username || user?.name,
      });
 
      const data = response.data;
 
      // Prepend to today's records
      setTodayRecords(prev => [{
        id: data.id,
        farmer_id: data.farmer_id,
        farmer_name: farmer.farmer_name,
        liters: data.liters,
        time: new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }),
        sms_sent: data.sms_sent,
      }, ...prev]);
 
      setAlert({
        show: true,
        type: 'success',
        message: `Recorded ${liters}L for ${farmer.farmer_name}${data.sms_sent ? ' · SMS sent ✓' : ''}`
      });
 
      // Reset form but keep farmer in case transporter records another batch
      setLiters('');
    } catch (err) {
      setAlert({
        show: true,
        type: 'error',
        message: err.response?.data?.detail || 'Failed to record collection. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };
 
  return (
    <Container maxWidth="lg" sx={{ pb: 4 }}>
 
      {/* Header */}
      <Paper sx={{
        p: 3, mb: 3, mt: 2, borderRadius: 3, color: 'white',
        background: 'linear-gradient(135deg, #e65100 0%, #f57c00 100%)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MilkIcon sx={{ fontSize: 36 }} />
          <Box>
            <Typography variant="h4" fontWeight={700}>Record Milk Collection</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              Look up a farmer then enter the litres collected
            </Typography>
          </Box>
        </Box>
      </Paper>
 
      {alert.show && (
        <Alert severity={alert.type} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setAlert({ ...alert, show: false })}>
          {alert.message}
        </Alert>
      )}
 
      <Grid container spacing={3}>
 
        {/* Form */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Collection Details</Typography>
            <Divider sx={{ mb: 3 }} />
 
            {/* Step 1: Farmer lookup */}
            <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom>
              Step 1 — Find Farmer
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                label="Farmer ID"
                value={farmerId}
                onChange={(e) => { setFarmerId(e.target.value); setFarmer(null); setFarmerError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleFarmerLookup()}
                placeholder="e.g. CPT001"
                size="small"
                InputProps={{
                  startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: '#f57c00', fontSize: 20 }} /></InputAdornment>,
                }}
              />
              <Button
                variant="outlined"
                onClick={handleFarmerLookup}
                disabled={!farmerId.trim() || farmerLoading}
                sx={{ minWidth: 48, borderColor: '#f57c00', color: '#f57c00', borderRadius: 2 }}
              >
                {farmerLoading ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
              </Button>
            </Box>
 
            {farmerError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{farmerError}</Alert>
            )}
 
            {/* Farmer confirmation card */}
            {farmer && (
              <Box sx={{ mb: 2, p: 2, backgroundColor: '#e8f5e9', borderRadius: 2, border: '1px solid #a5d6a7' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <CheckIcon sx={{ color: '#2e7d32', fontSize: 18 }} />
                  <Typography variant="body2" fontWeight={700} color="#1b5e20">
                    {farmer.farmer_name}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Today so far: <strong>{farmer.today_total} L</strong> &nbsp;·&nbsp;
                  Month total: <strong>{farmer.month_total} L</strong>
                </Typography>
              </Box>
            )}
 
            {/* Step 2: Enter litres */}
            <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
              Step 2 — Enter Litres
            </Typography>
            <TextField
              fullWidth
              label="Litres Collected"
              type="number"
              value={liters}
              onChange={(e) => setLiters(e.target.value)}
              inputProps={{ step: '0.1', min: '0.1' }}
              placeholder="0.0"
              disabled={!farmer}
              size="small"
              InputProps={{
                endAdornment: <InputAdornment position="end">L</InputAdornment>,
              }}
              sx={{ mb: 3 }}
            />
 
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              onClick={handleSubmit}
              disabled={!farmer || !liters || submitting}
              sx={{
                py: 1.5, fontWeight: 700, borderRadius: 2,
                backgroundColor: '#f57c00', '&:hover': { backgroundColor: '#e65100' },
              }}
            >
              {submitting ? 'Recording...' : 'Record Collection'}
            </Button>
 
            <Alert severity="info" sx={{ mt: 2, borderRadius: 2, fontSize: '0.78rem' }}>
              An SMS will be sent to the farmer automatically after recording.
            </Alert>
          </Paper>
        </Grid>
 
        {/* Today's records */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" fontWeight={700}>Today's Records</Typography>
              {todayRecords.length > 0 && (
                <Chip
                  label={`${todayRecords.reduce((s, r) => s + r.liters, 0).toFixed(1)} L total`}
                  size="small"
                  sx={{ backgroundColor: '#fff3e0', color: '#e65100', fontWeight: 700 }}
                />
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />
 
            {todayRecords.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <MilkIcon sx={{ fontSize: 48, color: '#bdbdbd', mb: 1 }} />
                <Typography color="text.secondary">
                  No collections recorded yet today.
                </Typography>
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
                    {todayRecords.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{r.farmer_name || r.farmer_id}</Typography>
                          <Typography variant="caption" color="text.secondary">{r.farmer_id}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={700} color="#1976d2">{r.liters} L</Typography>
                        </TableCell>
                        <TableCell align="center">
                          {r.sms_sent
                            ? <Chip icon={<SmsIcon />} label="Sent" size="small" color="success" variant="outlined" />
                            : <Typography variant="caption" color="text.secondary">—</Typography>
                          }
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="caption" color="text.secondary">{r.time}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
 
export default CollectionForm;