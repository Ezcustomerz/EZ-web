import { Box, Typography, Card, CardContent, IconButton, Chip, Tooltip, MenuItem, Select, FormControl, InputLabel, TextField, InputAdornment } from '@mui/material';
import { Add, Edit, Search as SearchIcon } from '@mui/icons-material';
import { useState } from 'react';

const mockServices = [
  {
    id: '1',
    title: 'Mixing & Mastering',
    description: 'Professional mixing and mastering for your tracks. Includes up to 5 revisions and delivery in high-quality formats.',
    price: 120,
    status: 'Public',
    delivery: '3 days',
  },
  {
    id: '2',
    title: 'Custom Beat Production',
    description: 'Get a unique, custom beat tailored to your style and needs. Includes stems and commercial rights.',
    price: 200,
    status: 'Private',
    delivery: '5 days',
  },
  {
    id: '3',
    title: 'Vocal Tuning',
    description: 'Pitch correction and tuning for vocal tracks. Natural sound, fast turnaround.',
    price: 60,
    status: 'Public',
    delivery: '2 days',
  },
];

const statusHelp = {
  Public: 'Visible to everyone on your public profile.',
  Private: 'Only visible to you. Not shown on your public profile.',
};

function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

const sortOptions = [
  { value: 'title', label: 'Title' },
  { value: 'price', label: 'Price' },
  { value: 'status', label: 'Visibility' },
];

export function ServicesTab() {
  const [sortBy, setSortBy] = useState('title');
  const [search, setSearch] = useState('');
  // Filter and sort
  const filteredServices = mockServices.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );
  const sortedServices = [...filteredServices].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'price') return a.price - b.price;
    if (sortBy === 'status') return a.status.localeCompare(b.status);
    return 0;
  });

  return (
    <Box sx={{ width: '100%', flexGrow: 1, py: 2 }}>
      {/* Search and Sort Controls */}
      <Box sx={{ mb: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: { xs: 'flex-start', sm: 'space-between' }, alignItems: { sm: 'center' } }}>
        <TextField
          size="small"
          placeholder="Search services..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{ width: { xs: '100%', sm: 220 } }}
        />
        <FormControl size="small" sx={{ minWidth: 140, ml: { sm: 'auto' } }}>
          <InputLabel id="sort-label">Sort By</InputLabel>
          <Select
            labelId="sort-label"
            value={sortBy}
            label="Sort By"
            onChange={e => setSortBy(e.target.value)}
          >
            {sortOptions.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 2, sm: 3 },
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            md: '1fr 1fr 1fr',
          },
          alignItems: 'stretch',
        }}
      >
        {/* Add Service Card */}
        <Box
          sx={{
            animation: 'fadeInCard 0.7s cubic-bezier(0.4,0,0.2,1)',
            '@keyframes fadeInCard': {
              '0%': { opacity: 0, transform: 'scale(0.97) translateY(16px)' },
              '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
            },
          }}
        >
          <Card
            sx={{
              height: '100%',
              minHeight: 210,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(59,130,246,0.10)',
              border: 'none',
              borderRadius: 1,
              boxShadow: 'none',
              cursor: 'pointer',
              p: 3,
              transition: 'box-shadow 0.18s, background 0.18s, transform 0.18s',
              '&:hover': {
                boxShadow: 6,
                background: 'rgba(59,130,246,0.16)',
                transform: 'scale(1.035)',
              },
            }}
          >
            <IconButton color="primary" size="large" sx={{ mb: 1, background: 'rgba(59,130,246,0.10)', borderRadius: 2, boxShadow: 'none', border: 'none' }}>
              <Add sx={{ fontSize: 36 }} />
            </IconButton>
            <Typography color="primary" fontWeight={700} fontSize="1.08rem">
              Add Service
            </Typography>
          </Card>
        </Box>
        {/* Service Cards */}
        {sortedServices.map((service, idx) => (
          <Box
            key={service.id}
            sx={{
              animation: `fadeInCard 0.7s cubic-bezier(0.4,0,0.2,1) ${(idx+1)*0.07}s both`,
            }}
          >
            <Card
              sx={{
                height: '100%',
                minHeight: 210,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: 1,
                boxShadow: '0px 2px 8px rgba(59,130,246,0.07)',
                p: 3,
                transition: 'box-shadow 0.18s, transform 0.18s',
                '&:hover': {
                  boxShadow: 10,
                  transform: 'scale(1.025) translateY(-2px)',
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Top row: Title + Edit */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography fontWeight={700} fontSize="1.08rem" sx={{ pr: 1, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.primary' }}>
                    {service.title}
                  </Typography>
                  <Tooltip title="Edit Service" arrow>
                    <IconButton
                      size="small"
                      sx={{
                        color: 'primary.main',
                        background: '#fff',
                        border: '2px solid',
                        borderColor: 'primary.main',
                        boxShadow: '0 2px 8px 0 rgba(59,130,246,0.10)',
                        '&:hover': {
                          background: 'primary.50',
                        },
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                {/* Description */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2.5,
                    minHeight: 44,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {service.description}
                </Typography>
                {/* Bottom row: Price left, pill+delivery right (responsive) */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: { xs: 1, sm: 0 },
                    mt: 'auto',
                    pt: 1,
                  }}
                >
                  <Typography fontWeight={700} color="primary" fontSize="1rem" sx={{ mb: { xs: 0.5, sm: 0 } }}>
                    ${service.price}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Tooltip title={statusHelp[service.status as 'Public' | 'Private']} arrow>
                      <Chip
                        label={service.status}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          color: service.status === 'Public' ? 'success.main' : 'grey.700',
                          backgroundColor: service.status === 'Public' ? 'success.50' : 'grey.100',
                          borderRadius: 1,
                          px: 1.5,
                          fontSize: '0.82rem',
                          textTransform: 'capitalize',
                          cursor: 'help',
                        }}
                      />
                    </Tooltip>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                      {service.delivery} delivery
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );
} 