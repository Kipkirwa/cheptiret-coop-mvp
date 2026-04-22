import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Paper, Typography, Box, Grid, Divider, Alert,
  CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, InputAdornment, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Switch,
  FormControlLabel,
} from '@mui/material';
import {
  People as PeopleIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  Smartphone as SmartphoneIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Lock as PinIcon,
} from '@mui/icons-material';
import api from '../../services/api';
 
const emptyForm = {
  farmer_id: '',
  name: '',
  phone: '',
  has_smartphone: false,
  pin: '',
  is_active: true,
};
 
const FarmerManagement = () => {
  const [farmers, setFarmers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
 
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
 
  // PIN reset dialog
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [newPin, setNewPin] = useState('');
  const [pinSaving, setPinSaving] = useState(false);
 
  const fetchFarmers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/farmers');
      setFarmers(res.data || []);
      setFiltered(res.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load farmers.');
    } finally {
      setLoading(false);
    }
  }, []);
 
  useEffect(() => { fetchFarmers(); }, [fetchFarmers]);
 
  // Search filter
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFiltered(farmers);
      return;
    }
    const term = searchTerm.toLowerCase();
    setFiltered(farmers.filter(f =>
      f.name?.toLowerCase().includes(term) ||
      f.farmer_id?.toLowerCase().includes(term) ||
      f.phone?.includes(term)
    ));
  }, [searchTerm, farmers]);
 
  const openAddDialog = () => {
    setFormData(emptyForm);
    setFormError('');
    setDialogMode('add');
    setDialogOpen(true);
  };
 
  const openEditDialog = (farmer) => {
    setFormData({
      farmer_id: farmer.farmer_id,
      name: farmer.name,
      phone: farmer.phone,
      has_smartphone: farmer.has_smartphone,
      pin: '',
      is_active: farmer.is_active,
    });
    setFormError('');
    setDialogMode('edit');
    setSelectedFarmer(farmer);
    setDialogOpen(true);
  };
 
  const handleSave = async () => {
    if (!formData.farmer_id || !formData.name || !formData.phone) {
      setFormError('Farmer ID, name and phone are required.');
      return;
    }
    if (dialogMode === 'add' && (!formData.pin || formData.pin.length !== 4)) {
      setFormError('PIN must be exactly 4 digits.');
      return;
    }
 
    try {
      setSaving(true);
      setFormError('');
 
      if (dialogMode === 'add') {
        await api.post('/farmers', {
          farmer_id: formData.farmer_id,
          name: formData.name,
          phone: formData.phone,
          has_smartphone: formData.has_smartphone,
          pin: formData.pin,
          is_active: true,
        });
        setSuccess(`Farmer ${formData.name} added successfully.`);
      } else {
        await api.put(`/farmers/${selectedFarmer.farmer_id}`, {
          name: formData.name,
          phone: formData.phone,
          has_smartphone: formData.has_smartphone,
          is_active: formData.is_active,
        });
        setSuccess(`Farmer ${formData.name} updated successfully.`);
      }
 
      setDialogOpen(false);
      fetchFarmers();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to save farmer.');
    } finally {
      setSaving(false);
    }
  };
 
  const handlePinReset = async () => {
    if (!newPin || newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      return;
    }
    try {
      setPinSaving(true);
      await api.post(`/farmers/${selectedFarmer.farmer_id}/reset-pin`, { new_pin: newPin });
      setSuccess(`PIN reset successfully for ${selectedFarmer.name}.`);
      setPinDialogOpen(false);
      setNewPin('');
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to reset PIN.');
    } finally {
      setPinSaving(false);
    }
  };
 
  const activeFarmers = farmers.filter(f => f.is_active).length;
  const smartphoneFarmers = farmers.filter(f => f.has_smartphone).length;
 
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress sx={{ color: '#2e7d32' }} size={48} />
        <Typography color="text.secondary">Loading farmers...</Typography>
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
            <PeopleIcon sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="h4" fontWeight={700}>Farmer Management</Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                Manage cooperative farmer accounts and access
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAddDialog}
            sx={{ backgroundColor: 'rgba(255,255,255,0.2)', fontWeight: 700, borderRadius: 2, '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' } }}
          >
            Add Farmer
          </Button>
        </Box>
      </Paper>
 
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
 
      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Farmers', value: farmers.length, color: '#283593' },
          { label: 'Active', value: activeFarmers, color: '#2e7d32' },
          { label: 'Inactive', value: farmers.length - activeFarmers, color: '#d32f2f' },
          { label: 'Smartphone Users', value: smartphoneFarmers, color: '#f57c00' },
        ].map((s) => (
          <Grid item xs={6} md={3} key={s.label}>
            <Paper sx={{ p: 2, borderRadius: 3, textAlign: 'center', boxShadow: 1 }}>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              <Typography variant="h5" fontWeight={800} color={s.color}>{s.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
 
      {/* Search + Table */}
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6" fontWeight={700}>
            Farmers ({filtered.length})
          </Typography>
          <TextField
            size="small"
            placeholder="Search by name, ID or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
            }}
            sx={{ minWidth: 280 }}
          />
        </Box>
        <Divider sx={{ mb: 2 }} />
 
        {filtered.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            {searchTerm ? `No farmers found matching "${searchTerm}".` : 'No farmers registered yet.'}
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Farmer ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Device</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((farmer, idx) => (
                  <TableRow key={farmer.farmer_id} hover
                    sx={{ backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="#283593">
                        {farmer.farmer_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 18, color: '#757575' }} />
                        <Typography variant="body2" fontWeight={600}>{farmer.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PhoneIcon sx={{ fontSize: 16, color: '#757575' }} />
                        <Typography variant="body2">{farmer.phone}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={<SmartphoneIcon />}
                        label={farmer.has_smartphone ? 'Smartphone' : 'Feature phone'}
                        size="small"
                        color={farmer.has_smartphone ? 'primary' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {farmer.is_active
                        ? <Chip icon={<ActiveIcon />} label="Active" size="small" color="success" />
                        : <Chip icon={<InactiveIcon />} label="Inactive" size="small" color="error" />
                      }
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Button size="small" startIcon={<EditIcon />}
                          onClick={() => openEditDialog(farmer)}
                          sx={{ color: '#283593', borderRadius: 2 }}>
                          Edit
                        </Button>
                        <Button size="small" startIcon={<PinIcon />}
                          onClick={() => { setSelectedFarmer(farmer); setNewPin(''); setPinDialogOpen(true); }}
                          sx={{ color: '#f57c00', borderRadius: 2 }}>
                          PIN
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
 
      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {dialogMode === 'add' ? 'Add New Farmer' : `Edit — ${selectedFarmer?.name}`}
        </DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{formError}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Farmer ID" value={formData.farmer_id}
                onChange={(e) => setFormData({ ...formData, farmer_id: e.target.value })}
                disabled={dialogMode === 'edit'} placeholder="e.g. CPT004" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Full Name" value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Jane Wanjiru" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone Number" value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+254722000000" />
            </Grid>
            {dialogMode === 'add' && (
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="4-Digit PIN" value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  inputProps={{ maxLength: 4 }} placeholder="e.g. 1234" />
              </Grid>
            )}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch checked={formData.has_smartphone}
                    onChange={(e) => setFormData({ ...formData, has_smartphone: e.target.checked })}
                    color="primary" />
                }
                label="Has smartphone (uses app instead of SMS)"
              />
            </Grid>
            {dialogMode === 'edit' && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      color="success" />
                  }
                  label="Active account"
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ backgroundColor: '#283593', '&:hover': { backgroundColor: '#1a237e' } }}>
            {saving ? 'Saving...' : dialogMode === 'add' ? 'Add Farmer' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
 
      {/* PIN Reset Dialog */}
      <Dialog open={pinDialogOpen} onClose={() => setPinDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reset PIN — {selectedFarmer?.name}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            This will replace the farmer's current PIN. Make sure to inform them of the new PIN.
          </Alert>
          <TextField
            fullWidth
            label="New 4-Digit PIN"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value)}
            inputProps={{ maxLength: 4 }}
            placeholder="e.g. 5678"
            error={newPin.length > 0 && (newPin.length !== 4 || !/^\d+$/.test(newPin))}
            helperText={newPin.length > 0 && newPin.length !== 4 ? 'PIN must be exactly 4 digits' : ''}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setPinDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={handlePinReset} variant="contained" disabled={pinSaving || newPin.length !== 4}
            startIcon={pinSaving ? <CircularProgress size={16} color="inherit" /> : <PinIcon />}
            sx={{ backgroundColor: '#f57c00', '&:hover': { backgroundColor: '#e65100' } }}>
            {pinSaving ? 'Resetting...' : 'Reset PIN'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
 
export default FarmerManagement;