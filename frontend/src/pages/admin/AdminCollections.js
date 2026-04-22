import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { 
  LocalShipping, 
  Search as SearchIcon, 
  DateRange,
  TrendingUp,
  People,
  Calculate,
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import api from '../../services/api';

const AdminCollections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [summary, setSummary] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Record collection dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [farmers, setFarmers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    farmer_id: '',
    liters: '',
    transporter_username: 'admin'
  });

  useEffect(() => {
    fetchDailySummary();
    fetchFarmers();
  }, [selectedDate]);

  const fetchFarmers = async () => {
    try {
      const res = await api.get('/farmers/');
      setFarmers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch farmers:', err);
    }
  };

  const fetchDailySummary = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/collections/admin/daily-summary?collection_date=${selectedDate}`);
      setSummary(res.data);
      
      if (res.data && res.data.farmer_details) {
        const collectionsList = Object.entries(res.data.farmer_details).map(([farmerId, data]) => ({
          farmer_id: farmerId,
          farmer_name: data.farmer_name,
          liters: data.liters,
          collections: data.collections
        }));
        setCollections(collectionsList);
      } else {
        setCollections([]);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  const handleRecordCollection = async () => {
    if (!formData.farmer_id || !formData.liters) {
      setError('Please select a farmer and enter liters');
      return;
    }

    try {
      setRecording(true);
      setError('');
      
      await api.post('/collections/record', {
        farmer_id: formData.farmer_id,
        liters: parseFloat(formData.liters),
        transporter_username: 'admin'
      });
      
      setSuccess('Collection recorded successfully!');
      setDialogOpen(false);
      setFormData({ farmer_id: '', liters: '', transporter_username: 'admin' });
      fetchDailySummary(); // Refresh the data
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record collection');
    } finally {
      setRecording(false);
    }
  };

  const filteredFarmers = farmers.filter(farmer =>
    farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.farmer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#2e7d32' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ pb: 4 }}>
      <Paper sx={{ p: 3, mb: 3, mt: 2, borderRadius: 3, color: 'white',
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 60%, #3949ab 100%)',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LocalShipping sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="h4" fontWeight={700}>Milk Collections</Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                View and record milk collections
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ backgroundColor: 'rgba(255,255,255,0.2)', fontWeight: 700, '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' } }}
          >
            Record Collection
          </Button>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Date Selector */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <DateRange />
          <TextField
            type="date"
            label="Select Date"
            value={selectedDate}
            onChange={handleDateChange}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 200 }}
          />
        </Box>
      </Paper>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" variant="caption">Total Farmers</Typography>
                    <Typography variant="h5" fontWeight={700}>{summary.total_farmers || 0}</Typography>
                  </Box>
                  <People sx={{ fontSize: 40, color: '#283593' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" variant="caption">Total Collections</Typography>
                    <Typography variant="h5" fontWeight={700}>{summary.total_collections || 0}</Typography>
                  </Box>
                  <Calculate sx={{ fontSize: 40, color: '#f57c00' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" variant="caption">Total Liters</Typography>
                    <Typography variant="h5" fontWeight={700}>{summary.total_liters || 0}</Typography>
                  </Box>
                  <TrendingUp sx={{ fontSize: 40, color: '#2e7d32' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" variant="caption">Avg per Farmer</Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {summary.total_farmers > 0 ? (summary.total_liters / summary.total_farmers).toFixed(1) : 0}
                    </Typography>
                  </Box>
                  <LocalShipping sx={{ fontSize: 40, color: '#1565c0' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Collections Table */}
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Collection Details - {selectedDate}
        </Typography>

        {collections.length === 0 ? (
          <Alert severity="info">No collections recorded for this date. Click "Record Collection" to add.</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Farmer ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Farmer Name</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Liters</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Collections</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {collections.map((item) => (
                  <TableRow key={item.farmer_id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{item.farmer_id}</Typography>
                    </TableCell>
                    <TableCell>{item.farmer_name}</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`${item.liters} L`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={`${item.collections} x`} 
                        size="small" 
                        color="secondary" 
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Record Collection Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Record Milk Collection
          <IconButton onClick={() => setDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Farmer</InputLabel>
              <Select
                value={formData.farmer_id}
                onChange={(e) => setFormData({ ...formData, farmer_id: e.target.value })}
                label="Select Farmer"
              >
                <MenuItem value="">Choose a farmer</MenuItem>
                {farmers.filter(f => f.is_active).map((farmer) => (
                  <MenuItem key={farmer.id} value={farmer.farmer_id}>
                    {farmer.name} ({farmer.farmer_id}) - {farmer.phone}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Liters of Milk"
              type="number"
              value={formData.liters}
              onChange={(e) => setFormData({ ...formData, liters: e.target.value })}
              InputProps={{ inputProps: { min: 0, step: 0.5 } }}
              sx={{ mb: 2 }}
            />

            <Alert severity="info" sx={{ mt: 2 }}>
              Collection will be recorded for today: {new Date().toLocaleDateString()}
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button 
            onClick={handleRecordCollection} 
            variant="contained" 
            disabled={recording || !formData.farmer_id || !formData.liters}
            sx={{ backgroundColor: '#283593', '&:hover': { backgroundColor: '#1a237e' } }}
          >
            {recording ? 'Recording...' : 'Record Collection'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminCollections;
