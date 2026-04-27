import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, CircularProgress,
  Alert, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Switch, FormControlLabel
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import api from '../../services/api';

const TransporterManagement = () => {
  const [transporters, setTransporters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransporter, setEditingTransporter] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    phone: '',
    password: '',
    role: 'transporter',
    is_active: true
  });

  const fetchTransporters = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://cheptiret-coop-mvp-backend-production.up.railway.app/api/transporters/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch transporters');
      const data = await response.json();
      setTransporters(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransporters();
  }, []);

  const handleOpenDialog = (transporter = null) => {
    if (transporter) {
      setEditingTransporter(transporter);
      setFormData({
        username: transporter.username,
        name: transporter.name,
        phone: transporter.phone || '',
        password: '',
        role: transporter.role || 'transporter',
        is_active: transporter.is_active
      });
    } else {
      setEditingTransporter(null);
      setFormData({
        username: '',
        name: '',
        phone: '',
        password: '',
        role: 'transporter',
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTransporter(null);
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    try {
      if (editingTransporter) {
        // Update transporter
        const response = await fetch(`https://cheptiret-coop-mvp-backend-production.up.railway.app/api/transporters/${editingTransporter.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            is_active: formData.is_active,
            role: formData.role
          })
        });
        if (!response.ok) throw new Error('Failed to update transporter');
        setSuccess('Transporter updated successfully');
      } else {
        // Create new transporter
        const response = await fetch('https://cheptiret-coop-mvp-backend-production.up.railway.app/api/transporters/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: formData.username,
            name: formData.name,
            phone: formData.phone,
            password: formData.password,
            role: formData.role,
            is_active: true
          })
        });
        if (!response.ok) throw new Error('Failed to create transporter');
        setSuccess('Transporter added successfully');
      }
      handleCloseDialog();
      fetchTransporters();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`https://cheptiret-coop-mvp-backend-production.up.railway.app/api/transporters/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) throw new Error('Failed to delete transporter');
        setSuccess('Transporter deleted successfully');
        fetchTransporters();
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
          <Typography variant="h4" fontWeight="bold">Transporter Management</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Add Transporter
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Button startIcon={<RefreshIcon />} onClick={fetchTransporters} sx={{ mb: 2 }}>
          Refresh
        </Button>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>Username</strong></TableCell>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Phone</strong></TableCell>
                <TableCell><strong>Role</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transporters.map((transporter) => (
                <TableRow key={transporter.id} hover>
                  <TableCell>{transporter.username}</TableCell>
                  <TableCell>{transporter.name}</TableCell>
                  <TableCell>{transporter.phone || '-'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={transporter.role === 'admin' ? 'Admin' : 'Transporter'} 
                      size="small" 
                      color={transporter.role === 'admin' ? 'secondary' : 'primary'} 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={transporter.is_active ? 'Active' : 'Inactive'} 
                      size="small" 
                      color={transporter.is_active ? 'success' : 'error'} 
                    />
                  </TableCell>
                  <TableCell>
                    {transporter.username !== 'admin' && (
                      <>
                        <IconButton onClick={() => handleOpenDialog(transporter)} color="primary" size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(transporter.id, transporter.name)} color="error" size="small">
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                    {transporter.username === 'admin' && (
                      <Typography variant="caption" color="text.secondary">System account</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTransporter ? 'Edit Transporter' : 'Add New Transporter'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            disabled={!!editingTransporter}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            margin="normal"
            placeholder="+254700000000"
          />
          {!editingTransporter && (
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              margin="normal"
              required
            />
          )}
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
            }
            label="Active Account"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingTransporter ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TransporterManagement;
