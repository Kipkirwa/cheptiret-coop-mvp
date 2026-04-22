import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Paper, Typography, Box, TextField, Button,
  Alert, Divider, Chip, CircularProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Dialog,
  DialogTitle, DialogContent, DialogActions, LinearProgress,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import {
  Sms as SmsIcon,
  Send as SendIcon,
  People as PeopleIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarnIcon,
} from '@mui/icons-material';
import api from '../../services/api';
 
const MAX_SMS_CHARS = 160;
 
const BroadcastSMS = () => {
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all');
  const [farmers, setFarmers] = useState([]);
  const [selectedFarmerIds, setSelectedFarmerIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [farmersLoading, setFarmersLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
 
  // Load farmer list for selective sending
  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        setFarmersLoading(true);
        const res = await api.get('/farmers');
        setFarmers(res.data || []);
      } catch {
        // non-critical, audience selector degrades gracefully
      } finally {
        setFarmersLoading(false);
      }
    };
    fetchFarmers();
  }, []);
 
  const charCount = message.length;
  const smsCount = Math.ceil(charCount / MAX_SMS_CHARS) || 1;
  const charsRemaining = MAX_SMS_CHARS - (charCount % MAX_SMS_CHARS || MAX_SMS_CHARS);
  const isOverLimit = charCount > MAX_SMS_CHARS * 3; // hard cap at 3 SMS parts
 
  const recipientCount = audience === 'all'
    ? farmers.length
    : selectedFarmerIds.length;
 
  const handleSend = async () => {
    setConfirmOpen(false);
    setLoading(true);
    setError('');
    setResult(null);
 
    try {
      const payload = {
        message: message.trim(),
        farmer_ids: audience === 'all' ? null : selectedFarmerIds,
      };
      const res = await api.post('/admin/broadcast-sms', payload);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send broadcast. Please try again.');
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <Container maxWidth="lg" sx={{ pb: 4 }}>
 
      {/* Header */}
      <Paper sx={{
        p: 3, mb: 3, mt: 2, borderRadius: 3, color: 'white',
        background: 'linear-gradient(135deg, #1a237e 0%, #1976d2 100%)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SmsIcon sx={{ fontSize: 36 }} />
          <Box>
            <Typography variant="h4" fontWeight={700}>Broadcast SMS</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Send announcements to cooperative members
            </Typography>
          </Box>
        </Box>
      </Paper>
 
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
 
      <Grid container spacing={3}>
 
        {/* Composer */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Compose Message</Typography>
            <Divider sx={{ mb: 2 }} />
 
            {/* Audience selector */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Send to</InputLabel>
              <Select
                value={audience}
                label="Send to"
                onChange={(e) => { setAudience(e.target.value); setSelectedFarmerIds([]); }}
              >
                <MenuItem value="all">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon fontSize="small" />
                    All Active Farmers ({farmers.length})
                  </Box>
                </MenuItem>
                <MenuItem value="select">Select specific farmers</MenuItem>
              </Select>
            </FormControl>
 
            {/* Multi-select farmers */}
            {audience === 'select' && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Farmers</InputLabel>
                <Select
                  multiple
                  value={selectedFarmerIds}
                  label="Select Farmers"
                  onChange={(e) => setSelectedFarmerIds(e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((id) => {
                        const f = farmers.find(f => f.farmer_id === id);
                        return <Chip key={id} label={f?.name || id} size="small" />;
                      })}
                    </Box>
                  )}
                >
                  {farmersLoading
                    ? <MenuItem disabled>Loading farmers...</MenuItem>
                    : farmers.map((f) => (
                        <MenuItem key={f.farmer_id} value={f.farmer_id}>{f.name} — {f.farmer_id}</MenuItem>
                      ))
                  }
                </Select>
              </FormControl>
            )}
 
            {/* Message box */}
            <TextField
              fullWidth
              multiline
              rows={5}
              label="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              error={isOverLimit}
              helperText={isOverLimit ? 'Message too long (max 3 SMS parts / 480 chars)' : ''}
              sx={{ mb: 1 }}
            />
 
            {/* Character counter */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  size="small"
                  label={`${charCount} chars`}
                  color={isOverLimit ? 'error' : 'default'}
                />
                <Chip
                  size="small"
                  label={`${smsCount} SMS part${smsCount > 1 ? 's' : ''}`}
                  color={smsCount > 1 ? 'warning' : 'success'}
                />
                {smsCount > 1 && (
                  <Chip size="small" label={`${charsRemaining} chars to next part`} />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                160 chars = 1 SMS · Each extra part costs more
              </Typography>
            </Box>
 
            {/* SMS cost warning */}
            {smsCount > 1 && (
              <Alert severity="warning" icon={<WarnIcon />} sx={{ mb: 2, borderRadius: 2 }}>
                This message spans {smsCount} SMS parts. Sending to {recipientCount} farmers will cost approximately {recipientCount * smsCount} SMS credits.
              </Alert>
            )}
 
            {/* Preview box */}
            {message.trim() && (
              <Box sx={{ backgroundColor: '#f0f4ff', borderRadius: 2, p: 2, mb: 2, border: '1px solid #c5cae9' }}>
                <Typography variant="caption" color="#283593" fontWeight={700} gutterBottom>
                  PREVIEW
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>
                  {message}
                </Typography>
              </Box>
            )}
 
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<SendIcon />}
              disabled={!message.trim() || isOverLimit || loading || (audience === 'select' && selectedFarmerIds.length === 0)}
              onClick={() => setConfirmOpen(true)}
              sx={{
                py: 1.5, fontWeight: 700, borderRadius: 2,
                backgroundColor: '#1976d2',
                '&:hover': { backgroundColor: '#1565c0' },
              }}
            >
              {loading ? 'Sending...' : `Send to ${recipientCount} Farmer${recipientCount !== 1 ? 's' : ''}`}
            </Button>
 
            {loading && <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />}
          </Paper>
        </Grid>
 
        {/* Results panel */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Delivery Results</Typography>
            <Divider sx={{ mb: 2 }} />
 
            {!result && !loading && (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <SmsIcon sx={{ fontSize: 48, color: '#bdbdbd', mb: 1 }} />
                <Typography color="text.secondary">
                  Results will appear here after sending.
                </Typography>
              </Box>
            )}
 
            {loading && (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <CircularProgress size={36} sx={{ color: '#1976d2', mb: 2 }} />
                <Typography color="text.secondary">Sending messages...</Typography>
              </Box>
            )}
 
            {result && (
              <>
                {/* Summary chips */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip icon={<CheckIcon />} label={`${result.total_sent} sent`} color="success" />
                  {result.total_simulated > 0 && (
                    <Chip label={`${result.total_simulated} simulated`} color="info" />
                  )}
                  {result.total_failed > 0 && (
                    <Chip icon={<ErrorIcon />} label={`${result.total_failed} failed`} color="error" />
                  )}
                </Box>
 
                {/* Per-farmer results */}
                <TableContainer sx={{ maxHeight: 380 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell>Farmer</TableCell>
                        <TableCell align="center">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.results.map((r) => (
                        <TableRow key={r.farmer_id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{r.farmer_name}</Typography>
                            <Typography variant="caption" color="text.secondary">{r.phone || 'No phone'}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              size="small"
                              label={r.status}
                              color={r.status === 'sent' ? 'success' : r.status === 'simulated' ? 'info' : 'error'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
 
      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Broadcast</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            You are about to send the following message to <strong>{recipientCount} farmer{recipientCount !== 1 ? 's' : ''}</strong>:
          </Typography>
          <Box sx={{ backgroundColor: '#f0f4ff', borderRadius: 2, p: 2, my: 2, border: '1px solid #c5cae9' }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{message}</Typography>
          </Box>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            This action cannot be undone. Please confirm the message is correct before sending.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setConfirmOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleSend} variant="contained" startIcon={<SendIcon />}
            sx={{ backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#1565c0' } }}>
            Confirm & Send
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
 
export default BroadcastSMS;