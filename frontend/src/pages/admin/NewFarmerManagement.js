import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, CircularProgress,
  Alert, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Switch, FormControlLabel
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import adminService from '../../services/adminService';

const NewFarmerManagement = () => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState(null);
  const [formData, setFormData] = useState({
    farmer_id: '',
    name: '',
    phone: '',
    has_smartphone: false,
    pin: '',
    is_active: true
  });

  const fetchFarmers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getFarmers();
      setFarmers(data);
    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, []);

  const handleOpenDialog = (farmer = null) => {
    if (farmer) {
      setEditingFarmer(farmer);
      setFormData({
        farmer_id: farmer.farmer_id,
        name: farmer.name,
        phone: farmer.phone,
        has_smartphone: farmer.has_smartphone,
        pin: '',
        is_active: farmer.is_active
      });
    } else {
      setEditingFarmer(null);
      setFormData({
        farmer_id: '',
        name: '',
        phone: '',
        has_smartphone: false,
        pin: '',
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingFarmer(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingFarmer) {
        await adminService.updateFarmer(editingFarmer.farmer_id, {
          name: formData.name,
          phone: formData.phone,
          has_smartphone: formData.has_smartphone,
          is_active: formData.is_active
        });
        setSuccess('Farmer updated successfully');
      } else {
        await adminService.addFarmer({
          farmer_id: formData.farmer_id,
          name: formData.name,
          phone: formData.phone,
          has_smartphone: formData.has_smartphone,
          pin: formData.pin,
          is_active: true
        });
        setSuccess('Farmer added successfully');
      }
      handleCloseDialog();
      fetchFarmers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (farmerId, farmerName) => {
    if (window.confirm(`Are you sure you want to delete ${farmerName}?`)) {
      try {
        await adminService.deleteFarmer(farmerId);
        setSuccess('Farmer deleted successfully');
        fetchFarmers();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.message);
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" fontWeight="bold">Farmer Management</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Add Farmer
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Button startIcon={<RefreshIcon />} onClick={fetchFarmers} sx={{ mb: 2 }}>
          Refresh
        </Button>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>Farmer ID</strong></TableCell>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Phone</strong></TableCell>
                <TableCell><strong>Smartphone</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {farmers.map((farmer) => (
                <TableRow key={farmer.id} hover>
                  <TableCell>{farmer.farmer_id}</TableCell>
                  <TableCell>{farmer.name}</TableCell>
                  <TableCell>{farmer.phone}</TableCell>
                  <TableCell>
                    <Chip label={farmer.has_smartphone ? 'Yes' : 'No'} size="small" color={farmer.has_smartphone ? 'primary' : 'default'} />
                  </TableCell>
                  <TableCell>
                    <Chip label={farmer.is_active ? 'Active' : 'Inactive'} size="small" color={farmer.is_active ? 'success' : 'error'} />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(farmer)} color="primary" size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(farmer.farmer_id, farmer.name)} color="error" size="small">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingFarmer ? 'Edit Farmer' : 'Add New Farmer'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Farmer ID"
            value={formData.farmer_id}
            onChange={(e) => setFormData({ ...formData, farmer_id: e.target.value })}
            disabled={!!editingFarmer}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            margin="normal"
          />
          {!editingFarmer && (
            <TextField
              fullWidth
              label="PIN (4 digits)"
              value={formData.pin}
              onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
              type="password"
              inputProps={{ maxLength: 4 }}
              margin="normal"
            />
          )}
          <FormControlLabel
            control={
              <Switch
                checked={formData.has_smartphone}
                onChange={(e) => setFormData({ ...formData, has_smartphone: e.target.checked })}
              />
            }
            label="Has Smartphone"
          />
          {editingFarmer && (
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label="Active"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingFarmer ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default NewFarmerManagement;
