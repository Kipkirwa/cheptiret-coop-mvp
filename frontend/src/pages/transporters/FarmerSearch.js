import React, { useState } from 'react';
import {
  Container, Paper, Typography, Box, TextField, Button,
  Alert, Divider, Grid, Card, CardContent, Chip, CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Opacity as MilkIcon,
  CalendarMonth as MonthIcon,
  Today as TodayIcon,
  AddCircleOutline as RecordIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
 
const FarmerSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
 
  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      setLoading(true);
      setError('');
      setFarmer(null);
      const res = await api.get(`/collections/farmer/${query.trim()}/summary`);
      setFarmer(res.data);
    } catch (err) {
      setError(err.response?.status === 404
        ? `No farmer found with ID "${query}". Please check and try again.`
        : 'Search failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };
 
  const handleRecordForFarmer = () => {
    navigate('/transporter/record', { state: { prefillFarmerId: farmer.farmer_id } });
  };
 
  return (
    <Container maxWidth="md" sx={{ pb: 4 }}>
 
      {/* Header */}
      <Paper sx={{
        p: 3, mb: 3, mt: 2, borderRadius: 3, color: 'white',
        background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SearchIcon sx={{ fontSize: 36 }} />
          <Box>
            <Typography variant="h4" fontWeight={700}>Find Farmer</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              Look up a farmer by ID to view their details and collection totals
            </Typography>
          </Box>
        </Box>
      </Paper>
 
      {/* Search box */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 2 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>Search by Farmer ID</Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            label="Farmer ID"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setFarmer(null); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. CPT001"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: '#1976d2' }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            size="large"
            onClick={handleSearch}
            disabled={!query.trim() || loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
            sx={{
              px: 3, fontWeight: 700, borderRadius: 2,
              backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#1565c0' },
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </Box>
      </Paper>
 
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
 
      {/* Farmer result card */}
      {farmer && (
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckIcon sx={{ color: '#2e7d32' }} />
              <Typography variant="h6" fontWeight={700} color="#1b5e20">
                Farmer Found
              </Typography>
            </Box>
            <Chip label="Active" color="success" size="small" />
          </Box>
          <Divider sx={{ mb: 3 }} />
 
          <Grid container spacing={3}>
 
            {/* Farmer info */}
            <Grid item xs={12} md={6}>
              <Card sx={{ backgroundColor: '#f0f4ff', borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom fontWeight={600}>
                    FARMER DETAILS
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, mt: 1 }}>
                    <PersonIcon sx={{ color: '#1976d2', fontSize: 20 }} />
                    <Box>
                      <Typography variant="h6" fontWeight={700}>{farmer.farmer_name}</Typography>
                      <Typography variant="caption" color="text.secondary">ID: {farmer.farmer_id}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
 
            {/* Collection stats */}
            <Grid item xs={12} md={6}>
              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Card sx={{ backgroundColor: '#e3f2fd', borderRadius: 2 }}>
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <TodayIcon sx={{ color: '#1976d2', fontSize: 16 }} />
                        <Typography variant="caption" color="text.secondary">Today</Typography>
                      </Box>
                      <Typography variant="h5" fontWeight={800} color="#1976d2">
                        {farmer.today_total} L
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ backgroundColor: '#fff3e0', borderRadius: 2 }}>
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <MonthIcon sx={{ color: '#f57c00', fontSize: 16 }} />
                        <Typography variant="caption" color="text.secondary">This month</Typography>
                      </Box>
                      <Typography variant="h5" fontWeight={800} color="#f57c00">
                        {farmer.month_total} L
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card sx={{ backgroundColor: '#e8f5e9', borderRadius: 2 }}>
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <MilkIcon sx={{ color: '#2e7d32', fontSize: 16 }} />
                        <Typography variant="caption" color="text.secondary">Estimated payment</Typography>
                      </Box>
                      <Typography variant="h5" fontWeight={800} color="#2e7d32">
                        Ksh {farmer.estimated_payment?.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
 
          {/* Action */}
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<RecordIcon />}
              onClick={handleRecordForFarmer}
              sx={{
                fontWeight: 700, borderRadius: 2, px: 3,
                backgroundColor: '#f57c00', '&:hover': { backgroundColor: '#e65100' },
              }}
            >
              Record Collection for {farmer.farmer_name}
            </Button>
          </Box>
        </Paper>
      )}
    </Container>
  );
};
 
export default FarmerSearch;