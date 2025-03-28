import React, { useState, ReactNode } from 'react';
import { 
  AppBar, 
  Box, 
  CssBaseline, 
  Divider, 
  Drawer, 
  IconButton, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Typography, 
  Button, 
  useTheme,
  useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EmailIcon from '@mui/icons-material/Email';
import SettingsIcon from '@mui/icons-material/Settings';
import CampaignIcon from '@mui/icons-material/Campaign';
import DescriptionIcon from '@mui/icons-material/Description';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Helmet } from 'react-helmet';

// Largeur du menu latéral
const drawerWidth = 240;

// Props du composant
interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

// Éléments du menu
const menuItems = [
  { 
    name: 'Tableau de bord', 
    path: '/dashboard', 
    icon: <DashboardIcon /> 
  },
  { 
    name: 'Campagnes', 
    path: '/campaigns', 
    icon: <CampaignIcon /> 
  },
  { 
    name: 'Templates', 
    path: '/templates', 
    icon: <DescriptionIcon /> 
  },
  { 
    name: 'Fournisseurs SMTP', 
    path: '/smtp-providers', 
    icon: <EmailIcon /> 
  },
  { 
    name: 'Paramètres', 
    path: '/settings', 
    icon: <SettingsIcon /> 
  }
];

const Layout: React.FC<LayoutProps> = ({ children, title = 'North Eyes', description = 'Plateforme d\'envoi d\'emails professionnels' }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated, logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Gestion de l'ouverture/fermeture du menu mobile
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Gestion de la déconnexion
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Contenu du menu latéral
  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          North Eyes
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton 
              component={Link} 
              to={item.path}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Déconnexion" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  // Si l'utilisateur n'est pas authentifié, afficher uniquement le contenu
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Helmet>
        <title>{`${title} | North Eyes`}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Helmet>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          boxShadow: isMobile ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          {isAuthenticated && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ mr: 2 }}>
                {currentUser?.fullName}
              </Typography>
              <Button color="inherit" onClick={handleLogout}>
                Déconnexion
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Menu pour mobile */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Pour une meilleure performance sur mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        {/* Menu pour desktop */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` } ,
          marginTop: '64px' // Hauteur de la barre d'outils
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 