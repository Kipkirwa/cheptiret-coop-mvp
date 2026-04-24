import React, { useState } from 'react';
import { Container, Paper, Typography, Button, Alert, CircularProgress } from '@mui/material';
import farmerService from '../../services/farmerService';

const ApiTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testGetFarmers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await farmerService.getFarmers();
      setResult(data);
      console.log('Farmers data:', data);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>API Test Page</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Backend URL: https://cheptiret-coop-mvp-backend-production.up.railway.app/api
        </Typography>
        
        <Button 
          variant="contained" 
          onClick={testGetFarmers}
          disabled={loading}
          sx={{ mb: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Test GET /farmers'}
        </Button>
        
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        
        {result && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Success! Found {Array.isArray(result) ? result.length : Object.keys(result).length} items
            <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '300px' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default ApiTest;