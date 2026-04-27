import React, { useState } from 'react';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Box, Toolbar, IconButton, Typography,
  Divider, useTheme, useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Today as TodayIcon,
  CalendarMonth as MonthlyIcon,
  LocalShipping as TruckIcon,
  History as HistoryIcon,
  Agriculture as FarmIcon,
  Settings as SettingsIcon,
  Assessment as ReportsIcon,
  Menu as MenuIcon,
  AddCircleOutline as RecordIcon,
  Sms as SmsIcon,
  AttachMoney as PaymentIcon,
  Search as SearchIcon,
  Assessment as SummaryIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
 
const drawerWidth = 240;
 
const menuItems = {
  farmer: [
    { text: 'Dashboard',         icon: <DashboardIcon />, path: '/farmer/dashboard' },
    { text: 'Daily Record',      icon: <TodayIcon />,     path: '/farmer/daily' },
    { text: 'Monthly Statement', icon: <MonthlyIcon />,   path: '/farmer/monthly' },
  ],
  transporter: [
    { text: 'Dashboard',         icon: <DashboardIcon />, path: '/transporter/dashboard' },
    { text: 'Record Collection', icon: <RecordIcon />,    path: '/transporter/record' },
    { text: 'Find Farmer',       icon: <SearchIcon />,    path: '/transporter/search' },
    { text: 'Daily Summary',     icon: <SummaryIcon />,   path: '/transporter/summary' },
    { text: 'History',           icon: <HistoryIcon />,   path: '/transporter/history' },
  ],
  admin: [
    { text: 'Dashboard',         icon: <DashboardIcon />, path: '/admin/dashboard' },
    { text: 'Farmers',           icon: <FarmIcon />,      path: '/admin/farmers' },
    { text: 'Set Price',         icon: <SettingsIcon />,  path: '/admin/prices' },
    { text: 'Transporters',      icon: <TruckIcon />,     path: '/admin/transporters' },
    { text: 'Broadcast SMS',     icon: <SmsIcon />,       path: '/admin/broadcast' },
    { text: 'Monthly Payments',  icon: <PaymentIcon />,   path: '/admin/payments' },
    { text: 'Collections',       icon: <TruckIcon />,     path: '/admin/collections' },
    { text: 'Reports',           icon: <ReportsIcon />,   path: '/admin/reports' },
  ],
};
 
const roleLabels = {
  farmer:      'Farmer Menu',
  transporter: 'Transporter Menu',
  admin:       'Admin Menu',
};
 
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
 
  const role = user?.role || '';
  const items = menuItems[role] || [];
 
  const drawer = (
    <>
      <Toolbar />
      <Box sx={{ overflow: 'auto', mt: 1 }}>
        {role && (
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" sx={{ color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
              {roleLabels[role]}
            </Typography>
          </Box>
        )}
        <Divider sx={{ mb: 1 }} />
        <List disablePadding>
          {items.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5, px: 1 }}>
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) setMobileOpen(false);
                  }}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: isActive ? '#e8f5e9' : 'transparent',
                    borderLeft: isActive ? '4px solid #2E7D32' : '4px solid transparent',
                    '&:hover': { backgroundColor: '#e8f5e9' },
                  }}
                >
                  <ListItemIcon sx={{ color: isActive ? '#2E7D32' : '#757575', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.9rem',
                      color: isActive ? '#1B5E20' : '#333',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </>
  );
 
  return (
    <>
      {isMobile && (
        <IconButton
          onClick={() => setMobileOpen(!mobileOpen)}
          sx={{
            position: 'fixed', left: 10, top: 80, zIndex: 1200,
            backgroundColor: '#2E7D32', color: 'white',
            '&:hover': { backgroundColor: '#1B5E20' },
          }}
        >
          <MenuIcon />
        </IconButton>
      )}
 
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: drawerWidth, backgroundColor: '#fafafa' },
        }}
      >
        {drawer}
      </Drawer>
 
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#fafafa',
            borderRight: '1px solid #e0e0e0',
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};
 
export default Sidebar;
