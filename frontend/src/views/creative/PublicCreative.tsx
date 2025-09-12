import { Box, Typography, Paper, Tab, Tabs, useTheme, TextField, InputAdornment, Button, FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { LayoutCreative } from '../../layout/creative/LayoutCreative';
import { useState } from 'react';
import { Build, Search, FilterList } from '@mui/icons-material';
import { ServicesTab } from './tabs/ServicesTab';
import { CalendarTab } from './tabs/CalendarTab';
import { ProfileTab } from './tabs/ProfileTab';
import { Menu, ListItemIcon, ListItemText, Grow } from '@mui/material';
import { MusicNote, CalendarMonth, AccountCircle } from '@mui/icons-material';
import { useMediaQuery } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown, faGlobe, faLock, faLayerGroup, faBan } from '@fortawesome/free-solid-svg-icons';

const tabLabels = [
  { label: 'Services', icon: <Build sx={{ fontSize: 18, mr: 1 }} /> },
  { label: 'Calendar', icon: <CalendarMonth sx={{ fontSize: 18, mr: 1 }} /> },
  { label: 'Profile', icon: <AccountCircle sx={{ fontSize: 18, mr: 1 }} /> },
];

const sortOptions = [
  { value: 'title', label: 'Name' },
  { value: 'price', label: 'Price' },
  { value: 'delivery', label: 'Delivery Time' },
];

export function PublicCreative() {
  // Dialog open states for CalendarTab
  const [calendarDayDialogOpen, setCalendarDayDialogOpen] = useState(false);
  const [calendarSessionDialogOpen, setCalendarSessionDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const stored = localStorage.getItem('public-active-tab');
    return stored !== null ? Number(stored) : 0;
  });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    localStorage.setItem('public-active-tab', String(newValue));
  };

  // Search/filter/sort state
  const [sortBy, setSortBy] = useState<'title' | 'price' | 'delivery'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [visibility, setVisibility] = useState<'all' | 'Public' | 'Private' | 'Disabled'>('all');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [profileSeeAllDialogOpen, setProfileSeeAllDialogOpen] = useState(false);

  // Handler to pass to ProfileTab to control dialog state
  const handleProfileSeeAllDialogChange = (open: boolean) => {
    setProfileSeeAllDialogOpen(open);
  };

  return (
    <LayoutCreative selectedNavItem="public" hideMenuButton={calendarDayDialogOpen || calendarSessionDialogOpen || profileSeeAllDialogOpen}>
      <Box sx={{
        px: { xs: 2, sm: 2, md: 3 },
        pb: { xs: 2, sm: 2, md: 3 },
        pt: { md: 2 },
        minHeight: '100vh',
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
        animation: 'pageSlideIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        '@keyframes pageSlideIn': {
          '0%': {
            opacity: 0,
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
        '@media (max-height: 784px)': {
          p: { xs: 1, sm: 1.5, md: 2 },
          pt: { md: 1 },
        },
      }}>
        {/* Header Section */}
        <Box
          sx={{
            mb: 2,
            pt: { xs: 2, sm: 2, md: 1 },
            textAlign: { xs: 'center', md: 'left' },
            px: { xs: 2, md: 0 },
            '@media (max-height: 784px)': {
              my: 1,
            },
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: '1.3rem', sm: '1.4rem', md: '1.5rem' },
              color: 'primary.main',
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
              mb: 0.25,
            }}
          >
            Public
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' },
              fontWeight: 400,
              color: 'text.secondary',
              letterSpacing: '0.01em',
            }}
          >
            Manage your public profile and service visibility
          </Typography>
        </Box>
        {/* Tabs + content */}
        <Paper
          elevation={0}
          sx={{
            p: 1,
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            minHeight: 0,
            height: { xs: 'calc(100vh - 200px)', sm: 'calc(100vh - 250px)', md: 'calc(100vh - 280px)' },
            overflow: { xs: 'hidden', sm: 'hidden' },
          }}
        >
          {isMobile ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <Box
                component="button"
                aria-label={`Current tab: ${tabLabels[activeTab].label}`}
                aria-haspopup="menu"
                aria-controls="mobile-tab-menu"
                onClick={handleMenuOpen}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 2.2,
                  py: 1.1,
                  borderRadius: '12px',
                  background: '#f7f7fb',
                  boxShadow: theme.shadows[1],
                  border: '1.5px solid #e0e0f7',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  color: theme.palette.primary.main,
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: 0,
                  transition: 'box-shadow 0.18s, border 0.18s, background 0.18s',
                  '&:hover, &:focus': {
                    background: '#edeaff',
                    boxShadow: theme.shadows[4],
                    borderColor: '#b7aaff',
                  },
                  position: 'relative',
                }}
              >
                {tabLabels[activeTab].icon}
                <span style={{ fontWeight: 700, fontSize: '1.05rem', marginRight: 6 }}>{tabLabels[activeTab].label}</span>
                <MusicNote sx={{ fontSize: 18, transform: 'rotate(-25deg)', ml: 0.5, color: '#7A5FFF', transition: 'transform 0.2s', }} />
                {/* Down arrow for dropdown indication */}
                <Box component="span" sx={{ ml: 1, display: 'flex', alignItems: 'center', transition: 'transform 0.2s', transform: Boolean(anchorEl) ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  {/* Use MUI ExpandMore icon for chevron */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 10l5 5 5-5" stroke="#7A5FFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Box>
                {/* Animated underline for selected */}
                <Box sx={{
                  position: 'absolute',
                  left: 18,
                  right: 18,
                  bottom: 5,
                  height: 3,
                  borderRadius: 2,
                  background: 'linear-gradient(90deg, #b7aaff 0%, #7A5FFF 100%)',
                  opacity: 0.7,
                  transform: 'scaleX(0.7)',
                  transition: 'opacity 0.2s',
                  animation: 'waveUnderline 1.2s infinite alternate',
                  '@keyframes waveUnderline': {
                    '0%': { opacity: 0.7, transform: 'scaleX(0.7)' },
                    '100%': { opacity: 1, transform: 'scaleX(1)' },
                  },
                }} />
              </Box>
              <Menu
                id="mobile-tab-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                TransitionComponent={Grow}
                PaperProps={{
                  sx: {
                    mt: 1,
                    borderRadius: '12px',
                    boxShadow: theme.shadows[4],
                    minWidth: 180,
                    p: 0.5,
                  },
                }}
                MenuListProps={{
                  'aria-label': 'Select view',
                  sx: { p: 0 },
                }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
              >
                {tabLabels.map((tab, idx) => (
                  <MenuItem
                    key={tab.label}
                    selected={activeTab === idx}
                    aria-label={tab.label}
                    aria-selected={activeTab === idx}
                    onClick={() => {
                      setActiveTab(idx);
                      localStorage.setItem('public-active-tab', String(idx));
                      handleMenuClose();
                    }}
                    sx={{
                      borderRadius: '8px',
                      my: 0.5,
                      px: 2,
                      py: 1.2,
                      background: activeTab === idx ? 'linear-gradient(90deg, #edeaff 0%, #f7f7fb 100%)' : 'none',
                      color: activeTab === idx ? theme.palette.primary.main : theme.palette.text.primary,
                      fontWeight: activeTab === idx ? 700 : 500,
                      transition: 'background 0.18s, color 0.18s',
                      '&:hover, &:focus': {
                        background: 'linear-gradient(90deg, #edeaff 0%, #f7f7fb 100%)',
                        color: theme.palette.primary.main,
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 0, mr: 1.2, color: theme.palette.primary.main }}>
                      {tab.icon}
                    </ListItemIcon>
                    <ListItemText primary={tab.label} primaryTypographyProps={{ fontWeight: 700, fontSize: '1.01rem' }} />
                    <MusicNote sx={{ fontSize: 16, color: '#b7aaff', ml: 1, opacity: activeTab === idx ? 1 : 0.5, transform: 'rotate(-25deg)' }} />
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          ) : (
            <Tabs
              value={activeTab}
              onChange={handleChange}
              variant="scrollable"
              scrollButtons={false}
              sx={{
                borderBottom: `2px solid ${theme.palette.divider}`,
              }}
            >
              {tabLabels.map((tab, idx) => (
                <Tab
                  key={tab.label}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {tab.icon}
                      <Typography
                        sx={{
                          fontWeight: activeTab === idx ? 600 : 500,
                          fontSize: { xs: '0.85rem', sm: '0.95rem' },
                          color:
                            activeTab === idx
                              ? theme.palette.primary.main
                              : theme.palette.text.primary,
                          textTransform: 'none',
                        }}
                      >
                        {tab.label}
                      </Typography>
                    </Box>
                  }
                  disableRipple
                  sx={{
                    px: 4,
                    minHeight: 48,
                    borderBottom:
                      activeTab === idx
                        ? `2px solid ${theme.palette.primary.main}`
                        : '2px solid transparent',
                  }}
                />
              ))}
            </Tabs>
          )}
          {/* Sticky search/filter/sort bar (only for Services tab) */}
          {Number(activeTab) === 0 && (
            <Box
              sx={{
                position: 'sticky',
                top: 0,
                zIndex: 20,
                background: { xs: '#fff', sm: 'transparent' },
                boxShadow: { xs: '0 2px 8px 0 rgba(122,95,255,0.04)', sm: 'none' },
                px: 0,
                pt: { xs: 0, sm: 2 },
              }}
            >
              <Box
                sx={{
                  px: 2,
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                  justifyContent: { xs: 'flex-start', sm: 'space-between' },
                  alignItems: { sm: 'center' },
                  mb: 0,
                }}
              >
                <TextField
                  size="small"
                  placeholder="Search services..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: { xs: '100%', sm: 220 } }}
                />
                {isMobile ? (
                  <Button
                    variant="outlined"
                    startIcon={<FilterList />}
                    onClick={() => setFilterModalOpen(true)}
                    sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: 0, py: 1, px: 2, borderRadius: 2, fontWeight: 600 }}
                  >
                    Filters
                  </Button>
                ) : (
                  <>
                    {/* Visibility Filter */}
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel id="visibility-label">Visibility</InputLabel>
                      <Select
                        labelId="visibility-label"
                        value={visibility}
                        label="Visibility"
                        onChange={e => setVisibility(e.target.value as 'all' | 'Public' | 'Private' | 'Disabled')}
                        renderValue={() => {
                          let icon = faLayerGroup;
                          let label = 'All';
                          if (visibility === 'Public') {
                            icon = faGlobe;
                            label = 'Public';
                          } else if (visibility === 'Private') {
                            icon = faLock;
                            label = 'Private';
                          } else if (visibility === 'Disabled') {
                            icon = faBan;
                            label = 'Disabled';
                          }
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <FontAwesomeIcon icon={icon} style={{ marginRight: 8, color: '#888', fontSize: 16 }} />
                              <span>{label}</span>
                            </Box>
                          );
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              borderRadius: 1,
                              mt: 1,
                              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                              border: '1px solid rgba(0, 0, 0, 0.05)',
                              background: 'rgba(255, 255, 255, 0.95)',
                              backdropFilter: 'blur(10px)',
                              '& .MuiMenuItem-root': {
                                py: 1,
                                px: 2,
                                borderRadius: 0,
                                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                  backgroundColor: 'transparent',
                                  transform: 'translateX(4px)',
                                  fontWeight: 600,
                                  color: 'primary.main',
                                },
                                '&.Mui-selected': {
                                  backgroundColor: 'transparent',
                                  fontWeight: 600,
                                  color: 'text.primary',
                                },
                                '&.Mui-selected:hover': {
                                  backgroundColor: 'transparent',
                                  color: 'primary.main',
                                },
                                '&.Mui-focusVisible': {
                                  backgroundColor: 'transparent',
                                },
                              },
                              // Icon color logic
                              '& .dropdown-icon': {
                                color: '#888',
                                transition: 'color 0.15s',
                              },
                              '& .MuiMenuItem-root.Mui-selected .dropdown-icon': {
                                color: '#23243a', // text.primary
                              },
                              '& .MuiMenuItem-root:hover .dropdown-icon, & .MuiMenuItem-root.Mui-selected:hover .dropdown-icon': {
                                color: '#7A5FFF', // primary.main
                              },
                            },
                          },
                        }}
                      >
                        <MenuItem value="all" disableRipple>
                          <FontAwesomeIcon icon={faLayerGroup} className="dropdown-icon" style={{ marginRight: 12, fontSize: 16 }} />
                          <Box sx={{ flex: 1, fontWeight: visibility === 'all' ? 600 : 400 }}>All</Box>
                        </MenuItem>
                        <MenuItem value="Public" disableRipple>
                          <FontAwesomeIcon icon={faGlobe} className="dropdown-icon" style={{ marginRight: 12, fontSize: 16 }} />
                          <Box sx={{ flex: 1, fontWeight: visibility === 'Public' ? 600 : 400 }}>Public</Box>
                        </MenuItem>
                        <MenuItem value="Private" disableRipple>
                          <FontAwesomeIcon icon={faLock} className="dropdown-icon" style={{ marginRight: 12, fontSize: 16 }} />
                          <Box sx={{ flex: 1, fontWeight: visibility === 'Private' ? 600 : 400 }}>Private</Box>
                        </MenuItem>
                        <MenuItem value="Disabled" disableRipple>
                          <FontAwesomeIcon icon={faBan} className="dropdown-icon" style={{ marginRight: 12, fontSize: 16 }} />
                          <Box sx={{ flex: 1, fontWeight: visibility === 'Disabled' ? 600 : 400 }}>Disabled only</Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                    {/* Sort Dropdown */}
                    <FormControl size="small" sx={{ minWidth: 140, ml: { sm: 'auto' } }}>
                      <InputLabel id="sort-label">Sort By</InputLabel>
                      <Select
                        labelId="sort-label"
                        value={sortBy + '-' + sortOrder}
                        label="Sort By"
                        onChange={e => {
                          const [field, order] = (e.target.value as string).split('-');
                          setSortBy(field as 'title' | 'price' | 'delivery');
                          setSortOrder(order as 'asc' | 'desc');
                        }}
                        renderValue={() => {
                          const opt = sortOptions.find(o => o.value === sortBy);
                          const icon = sortOrder === 'asc' ? faArrowUp : faArrowDown;
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                              <FontAwesomeIcon icon={icon} style={{ marginRight: 8, color: '#888', fontSize: 18 }} />
                              <span>{opt?.label || ''}</span>
                            </Box>
                          );
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              borderRadius: 1,
                              mt: 1,
                              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                              border: '1px solid rgba(0, 0, 0, 0.05)',
                              background: 'rgba(255, 255, 255, 0.95)',
                              backdropFilter: 'blur(10px)',
                              '& .MuiMenuItem-root': {
                                py: 1,
                                px: 2,
                                borderRadius: 0,
                                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                  backgroundColor: 'transparent',
                                  transform: 'translateX(4px)',
                                  fontWeight: 600,
                                  color: 'primary.main',
                                },
                                '&.Mui-selected': {
                                  backgroundColor: 'transparent',
                                  fontWeight: 600,
                                  color: 'text.primary',
                                },
                                '&.Mui-selected:hover': {
                                  backgroundColor: 'transparent',
                                  color: 'primary.main',
                                },
                                '&.Mui-focusVisible': {
                                  backgroundColor: 'transparent',
                                },
                              },
                              // Icon color logic
                              '& .dropdown-icon': {
                                color: '#888',
                                transition: 'color 0.15s',
                              },
                              '& .MuiMenuItem-root.Mui-selected .dropdown-icon': {
                                color: '#23243a', // text.primary
                              },
                              '& .MuiMenuItem-root:hover .dropdown-icon, & .MuiMenuItem-root.Mui-selected:hover .dropdown-icon': {
                                color: '#7A5FFF', // primary.main
                              },
                            },
                          },
                        }}
                      >
                        {sortOptions.map(opt => [
                          <MenuItem key={opt.value + '-desc'} value={opt.value + '-desc'} disableRipple>
                            <FontAwesomeIcon icon={faArrowDown} className="dropdown-icon" style={{ marginRight: 12, fontSize: 18 }} />
                            <Box sx={{ flex: 1, fontWeight: (sortBy === opt.value && sortOrder === 'desc') ? 600 : 400 }}>{opt.label}</Box>
                          </MenuItem>,
                          <MenuItem key={opt.value + '-asc'} value={opt.value + '-asc'} disableRipple>
                            <FontAwesomeIcon icon={faArrowUp} className="dropdown-icon" style={{ marginRight: 12, fontSize: 18 }} />
                            <Box sx={{ flex: 1, fontWeight: (sortBy === opt.value && sortOrder === 'asc') ? 600 : 400 }}>{opt.label}</Box>
                          </MenuItem>
                        ])}
                      </Select>
                    </FormControl>
                  </>
                )}
                {/* Filter Modal for mobile */}
                <Dialog
                  open={filterModalOpen}
                  onClose={() => setFilterModalOpen(false)}
                  fullWidth
                  maxWidth="xs"
                  PaperProps={{
                    sx: { borderRadius: 3, p: 2, background: 'rgba(255,255,255,0.98)' }
                  }}
                >
                  <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', pb: 1.5 }}>Filters</DialogTitle>
                  <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2.5, px: 4, overflow: 'visible' }}>
                    <FormControl size="small" fullWidth sx={{ minWidth: 0 }} margin="dense">
                      <InputLabel id="modal-visibility-label" shrink={true}>Visibility</InputLabel>
                      <Select
                        labelId="modal-visibility-label"
                        value={visibility}
                        label="Visibility"
                        onChange={e => setVisibility(e.target.value as 'all' | 'Public' | 'Private' | 'Disabled')}
                        renderValue={() => {
                          let icon = faLayerGroup;
                          let label = 'All';
                          if (visibility === 'Public') {
                            icon = faGlobe;
                            label = 'Public';
                          } else if (visibility === 'Private') {
                            icon = faLock;
                            label = 'Private';
                          }
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <FontAwesomeIcon icon={icon} style={{ marginRight: 8, color: '#888', fontSize: 16 }} />
                              <span>{label}</span>
                            </Box>
                          );
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              borderRadius: 1,
                              mt: 1,
                              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                              border: '1px solid rgba(0, 0, 0, 0.05)',
                              background: 'rgba(255, 255, 255, 0.95)',
                              backdropFilter: 'blur(10px)',
                              '& .MuiMenuItem-root': {
                                py: 1,
                                px: 2,
                                borderRadius: 0,
                                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                  backgroundColor: 'transparent',
                                  transform: 'translateX(4px)',
                                  fontWeight: 600,
                                  color: 'primary.main',
                                },
                                '&.Mui-selected': {
                                  backgroundColor: 'transparent',
                                  fontWeight: 600,
                                  color: 'text.primary',
                                },
                                '&.Mui-selected:hover': {
                                  backgroundColor: 'transparent',
                                  color: 'primary.main',
                                },
                                '&.Mui-focusVisible': {
                                  backgroundColor: 'transparent',
                                },
                              },
                              // Icon color logic
                              '& .dropdown-icon': {
                                color: '#888',
                                transition: 'color 0.15s',
                              },
                              '& .MuiMenuItem-root.Mui-selected .dropdown-icon': {
                                color: '#23243a', // text.primary
                              },
                              '& .MuiMenuItem-root:hover .dropdown-icon, & .MuiMenuItem-root.Mui-selected:hover .dropdown-icon': {
                                color: '#7A5FFF', // primary.main
                              },
                            },
                          },
                        }}
                      >
                        <MenuItem value="all" disableRipple>
                          <FontAwesomeIcon icon={faLayerGroup} className="dropdown-icon" style={{ marginRight: 12, fontSize: 16 }} />
                          <Box sx={{ flex: 1, fontWeight: visibility === 'all' ? 600 : 400 }}>All</Box>
                        </MenuItem>
                        <MenuItem value="Public" disableRipple>
                          <FontAwesomeIcon icon={faGlobe} className="dropdown-icon" style={{ marginRight: 12, fontSize: 16 }} />
                          <Box sx={{ flex: 1, fontWeight: visibility === 'Public' ? 600 : 400 }}>Public</Box>
                        </MenuItem>
                        <MenuItem value="Private" disableRipple>
                          <FontAwesomeIcon icon={faLock} className="dropdown-icon" style={{ marginRight: 12, fontSize: 16 }} />
                          <Box sx={{ flex: 1, fontWeight: visibility === 'Private' ? 600 : 400 }}>Private</Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth sx={{ minWidth: 0 }} margin="dense">
                      <InputLabel id="modal-sort-label" shrink={true}>Sort By</InputLabel>
                      <Select
                        labelId="modal-sort-label"
                        value={sortBy + '-' + sortOrder}
                        label="Sort By"
                        onChange={e => {
                          const [field, order] = (e.target.value as string).split('-');
                          setSortBy(field as 'title' | 'price' | 'delivery');
                          setSortOrder(order as 'asc' | 'desc');
                        }}
                        renderValue={() => {
                          const opt = sortOptions.find(o => o.value === sortBy);
                          const icon = sortOrder === 'asc' ? faArrowUp : faArrowDown;
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                              <FontAwesomeIcon icon={icon} style={{ marginRight: 8, color: '#888', fontSize: 18 }} />
                              <span>{opt?.label || ''}</span>
                            </Box>
                          );
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              borderRadius: 1,
                              mt: 1,
                              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                              border: '1px solid rgba(0, 0, 0, 0.05)',
                              background: 'rgba(255, 255, 255, 0.95)',
                              backdropFilter: 'blur(10px)',
                              '& .MuiMenuItem-root': {
                                py: 1,
                                px: 2,
                                borderRadius: 0,
                                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                  backgroundColor: 'transparent',
                                  transform: 'translateX(4px)',
                                  fontWeight: 600,
                                  color: 'primary.main',
                                },
                                '&.Mui-selected': {
                                  backgroundColor: 'transparent',
                                  fontWeight: 600,
                                  color: 'text.primary',
                                },
                                '&.Mui-selected:hover': {
                                  backgroundColor: 'transparent',
                                  color: 'primary.main',
                                },
                                '&.Mui-focusVisible': {
                                  backgroundColor: 'transparent',
                                },
                              },
                              // Icon color logic
                              '& .dropdown-icon': {
                                color: '#888',
                                transition: 'color 0.15s',
                              },
                              '& .MuiMenuItem-root.Mui-selected .dropdown-icon': {
                                color: '#23243a', // text.primary
                              },
                              '& .MuiMenuItem-root:hover .dropdown-icon, & .MuiMenuItem-root.Mui-selected:hover .dropdown-icon': {
                                color: '#7A5FFF', // primary.main
                              },
                            },
                          },
                        }}
                      >
                        {sortOptions.map(opt => [
                          <MenuItem key={opt.value + '-desc'} value={opt.value + '-desc'} disableRipple>
                            <FontAwesomeIcon icon={faArrowDown} className="dropdown-icon" style={{ marginRight: 12, fontSize: 18 }} />
                            <Box sx={{ flex: 1, fontWeight: (sortBy === opt.value && sortOrder === 'desc') ? 600 : 400 }}>{opt.label}</Box>
                          </MenuItem>,
                          <MenuItem key={opt.value + '-asc'} value={opt.value + '-asc'} disableRipple>
                            <FontAwesomeIcon icon={faArrowUp} className="dropdown-icon" style={{ marginRight: 12, fontSize: 18 }} />
                            <Box sx={{ flex: 1, fontWeight: (sortBy === opt.value && sortOrder === 'asc') ? 600 : 400 }}>{opt.label}</Box>
                          </MenuItem>
                        ])}
                      </Select>
                    </FormControl>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setFilterModalOpen(false)} variant="contained" color="primary" sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}>Apply</Button>
                  </DialogActions>
                </Dialog>
              </Box>
            </Box>
          )}
          {/* Tab content */}
          {Number(activeTab) === 0 && (
            <ServicesTab
              search={search}
              sortBy={sortBy}
              sortOrder={sortOrder}
              visibility={visibility}
            />
          )}
          {Number(activeTab) === 1 && (
            <CalendarTab
              dayDialogOpen={calendarDayDialogOpen}
              setDayDialogOpen={setCalendarDayDialogOpen}
              sessionDialogOpen={calendarSessionDialogOpen}
              setSessionDialogOpen={setCalendarSessionDialogOpen}
            />
          )}
          {Number(activeTab) === 2 && (
            <ProfileTab
              seeAllDialogOpen={profileSeeAllDialogOpen}
              onSeeAllDialogChange={handleProfileSeeAllDialogChange}
            />
          )}
        </Paper>
      </Box>
    </LayoutCreative>
  );
} 