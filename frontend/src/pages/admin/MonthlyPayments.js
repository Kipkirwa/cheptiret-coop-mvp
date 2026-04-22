import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Grid, Paper, Typography, Box, Button, Alert,
  CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tabs, Tab, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip,
  MenuItem, Select, FormControl,
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Edit as EditIcon,
  CheckCircle as CheckIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  Warning as WarnIcon,
} from '@mui/icons-material';
import api from '../../services/api';
 
const today = new Date();
 
const MonthlyPayments = () => {
  const [tab, setTab] = useState(0);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [payments, setPayments] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
 
  // Correction dialog state
  const [correctDialog, setCorrectDialog] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [newLiters, setNewLiters] = useState('');
  const [reason, setReason] = useState('');
  const [correcting, setCorrecting] = useState(false);
  const [correctSuccess, setCorrectSuccess] = useState('');
 
  // Collection search for corrections tab
  const [searchFarmerId, setSearchFarmerId] = useState('');
  const [collections, setCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
 
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/admin/monthly-payments/${year}/${month}`);
      setPayments(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load payment data.');
    } finally {
      setLoading(false);
    }
  }, [year, month]);
 
  useEffect(() => { fetchPayments(); }, [fetchPayments]);
 
  const fetchCollections = async () => {
    if (!searchFarmerId.trim()) return;
    try {
      setCollectionsLoading(true);
      const res = await api.get(`/collections/farmer/${searchFarmerId.trim()}/history`, {
        params: {
          start_date: `${year}-${String(month).padStart(2, '0')}-01`,
          end_date: `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`,
        },
      });
      setCollections(res.data || []);
    } catch {
      setCollections([]);
    } finally {
      setCollectionsLoading(false);
    }
  };
 
  const openCorrectDialog = (collection) => {
    setSelectedCollection(collection);
    setNewLiters(collection.liters.toString());
    setReason('');
    setCorrectDialog(true);
  };
 
  const handleCorrect = async () => {
    if (!reason.trim()) return;
    try {
      setCorrecting(true);
      await api.patch(`/admin/collections/${selectedCollection.id}/correct`, {
        new_liters: parseFloat(newLiters),
        reason: reason.trim(),
      });
      setCorrectSuccess(`Collection #${selectedCollection.id} corrected successfully.`);
      setCorrectDialog(false);
      // Refresh collections and payments
      fetchCollections();
      fetchPayments();
    } catch (err) {
      setError(err.response?.data?.detail || 'Correction failed.');
    } finally {
      setCorrecting(false);
    }
  };
 
  const exportCSV = () => {
    if (!payments?.farmers) return;
    const rows = [
      ['Farmer ID', 'Farmer Name', 'Phone', 'Total Liters', 'Price/L', 'Total Payment (Ksh)'],
      ...payments.farmers.map(f => [
        f.farmer_id, f.farmer_name, f.phone,
        f.total_liters, f.price_per_liter, f.total_payment,
      ]),
      [],
      ['', '', 'TOTALS', payments.grand_total_liters, '', payments.grand_total_payment],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cheptiret_payments_${payments.month_name}_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
 
  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];
 
  return (
    <Container maxWidth="lg" sx={{ pb: 4 }}>
 
      {/* Header */}
      <Paper sx={{
        p: 3, mb: 3, mt: 2, borderRadius: 3, color: 'white',
        background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <MoneyIcon sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="h4" fontWeight={700}>Monthly Payments</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Review collections, correct errors and finalize farmer payments
              </Typography>
            </Box>
          </Box>
 
          {/* Month/Year selector */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <Select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                sx={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white',
                  '& .MuiSvgIcon-root': { color: 'white' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' },
                }}
              >
                {months.map((m, i) => (
                  <MenuItem key={i + 1} value={i + 1}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 90 }}>
              <Select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                sx={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white',
                  '& .MuiSvgIcon-root': { color: 'white' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' },
                }}
              >
                {[today.getFullYear(), today.getFullYear() - 1].map(y => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>
 
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {correctSuccess && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setCorrectSuccess('')}>{correctSuccess}</Alert>}
 
      {/* Summary stats */}
      {payments && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Active Farmers', value: payments.total_farmers, color: '#1976d2' },
            { label: 'Total Liters', value: `${payments.grand_total_liters} L`, color: '#2e7d32' },
            { label: 'Price per Liter', value: `Ksh ${payments.price_per_liter}`, color: '#f57c00' },
            { label: 'Total Payout', value: `Ksh ${payments.grand_total_payment.toLocaleString()}`, color: '#7b1fa2' },
          ].map((s) => (
            <Grid item xs={6} md={3} key={s.label}>
              <Paper sx={{ p: 2, borderRadius: 3, textAlign: 'center', boxShadow: 1 }}>
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                <Typography variant="h5" fontWeight={800} color={s.color}>{s.value}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
 
      {/* Tabs */}
      <Paper sx={{ borderRadius: 3, boxShadow: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: '1px solid #e0e0e0', px: 2, pt: 1 }}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Payment Summary" icon={<MoneyIcon />} iconPosition="start" />
          <Tab label="Correct Errors" icon={<EditIcon />} iconPosition="start" />
        </Tabs>
 
        <Box sx={{ p: 3 }}>
 
          {/* ── TAB 1: Payment Summary ── */}
          {tab === 0 && (
            <>
              {loading ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <CircularProgress sx={{ color: '#2e7d32' }} />
                </Box>
              ) : payments?.farmers?.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  No collections recorded for {months[month - 1]} {year}.
                </Alert>
              ) : (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                      startIcon={<DownloadIcon />}
                      variant="outlined"
                      onClick={exportCSV}
                      sx={{ borderRadius: 2, color: '#2e7d32', borderColor: '#2e7d32' }}
                    >
                      Export CSV
                    </Button>
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableCell sx={{ fontWeight: 700 }}>Farmer</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Total Liters</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Price/L</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Payment (Ksh)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {payments?.farmers?.map((f, idx) => (
                          <TableRow key={f.farmer_id} hover
                            sx={{ backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>{f.farmer_name}</Typography>
                              <Typography variant="caption" color="text.secondary">{f.farmer_id}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">{f.phone}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={600} color="#1976d2">
                                {f.total_liters} L
                              </Typography>
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
                          </TableRow>
                        ))}
 
                        {/* Totals row */}
                        <TableRow sx={{ backgroundColor: '#e8f5e9' }}>
                          <TableCell colSpan={2} sx={{ fontWeight: 800 }}>TOTAL</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: '#1976d2' }}>
                            {payments?.grand_total_liters} L
                          </TableCell>
                          <TableCell />
                          <TableCell align="right" sx={{ fontWeight: 800, color: '#1b5e20' }}>
                            Ksh {payments?.grand_total_payment?.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </>
          )}
 
          {/* ── TAB 2: Correct Errors ── */}
          {tab === 1 && (
            <>
              <Alert severity="warning" icon={<WarnIcon />} sx={{ mb: 3, borderRadius: 2 }}>
                Any correction requires a written reason and is permanently logged for audit purposes.
              </Alert>
 
              {/* Farmer search */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  label="Farmer ID"
                  value={searchFarmerId}
                  onChange={(e) => setSearchFarmerId(e.target.value)}
                  placeholder="e.g. F001"
                  size="small"
                  sx={{ flexGrow: 1 }}
                  onKeyDown={(e) => e.key === 'Enter' && fetchCollections()}
                />
                <Button
                  variant="contained"
                  startIcon={collectionsLoading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
                  onClick={fetchCollections}
                  disabled={collectionsLoading}
                  sx={{ backgroundColor: '#283593', borderRadius: 2, '&:hover': { backgroundColor: '#1a237e' } }}
                >
                  Search
                </Button>
              </Box>
 
              {collections.length > 0 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Transporter</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Liters</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {collections.map((c) => (
                        <TableRow key={c.id} hover>
                          <TableCell>#{c.id}</TableCell>
                          <TableCell>{c.collection_date}</TableCell>
                          <TableCell>
                            {new Date(c.recorded_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                          </TableCell>
                          <TableCell>{c.transporter_name}</TableCell>
                          <TableCell align="right">
                            <Typography fontWeight={700} color="#1976d2">{c.liters} L</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              startIcon={<EditIcon />}
                              variant="outlined"
                              onClick={() => openCorrectDialog(c)}
                              sx={{ borderRadius: 2, color: '#f57c00', borderColor: '#f57c00' }}
                            >
                              Correct
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
 
              {collections.length === 0 && searchFarmerId && !collectionsLoading && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  No collections found for farmer ID "{searchFarmerId}" in {months[month - 1]} {year}.
                </Alert>
              )}
            </>
          )}
        </Box>
      </Paper>
 
      {/* Correction Dialog */}
      <Dialog open={correctDialog} onClose={() => setCorrectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Correct Collection #{selectedCollection?.id}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            You are editing a collection record. This will affect the farmer's monthly payment.
          </Alert>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current value: <strong>{selectedCollection?.liters} L</strong>
          </Typography>
          <TextField
            fullWidth
            label="Corrected Liters"
            type="number"
            value={newLiters}
            onChange={(e) => setNewLiters(e.target.value)}
            inputProps={{ min: 0.1, step: 0.1 }}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Reason for correction (required)"
            multiline
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Transporter entered 20L instead of 2L by mistake."
            error={!reason.trim() && correcting}
            helperText={!reason.trim() && correcting ? 'Reason is required' : ''}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setCorrectDialog(false)} variant="outlined">Cancel</Button>
          <Button
            onClick={handleCorrect}
            variant="contained"
            disabled={correcting || !reason.trim() || !newLiters}
            startIcon={correcting ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
            sx={{ backgroundColor: '#2e7d32', '&:hover': { backgroundColor: '#1b5e20' } }}
          >
            {correcting ? 'Saving...' : 'Save Correction'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
 
export default MonthlyPayments;