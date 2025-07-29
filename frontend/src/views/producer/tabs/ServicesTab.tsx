import { Box, Card, Tooltip } from '@mui/material';
import { useMemo } from 'react';
import { ServiceCard } from '../../../components/cards/producer/ServiceCard';

const mockServices: any[] = [
  {
    id: 'service-1',
    title: 'Mixing',
    description: 'Professional mixing for your tracks',
    price: 200,
    delivery: '3 days',
    status: 'Public',
    color: '#F3E8FF',
    producer: 'Demo User',
  },
  {
    id: 'service-2',
    title: 'Mastering',
    description: 'High-quality mastering for release',
    price: 150,
    delivery: '2 days',
    status: 'Private',
    color: '#E0F2FE',
    producer: 'Demo User',
  },
  {
    id: 'service-3',
    title: 'Vocal Tuning',
    description: 'Pitch correction and tuning for vocals',
    price: 100,
    delivery: '1 day',
    status: 'Public',
    color: '#FEF9C3',
    producer: 'Demo User',
  },
  {
    id: 'service-4',
    title: 'Full Production',
    description: 'From songwriting to final mix',
    price: 1000,
    delivery: '10 days',
    status: 'Public',
    color: '#FEE2E2',
    producer: 'Demo User',
  },
  {
    id: 'service-5',
    title: 'Beat Making',
    description: 'Custom beats for any genre',
    price: 300,
    delivery: '4 days',
    status: 'Private',
    color: '#DCFCE7',
    producer: 'Demo User',
  },
  {
    id: 'service-6',
    title: 'Session Guitar',
    description: 'Professional guitar tracks for your song',
    price: 120,
    delivery: '2 days',
    status: 'Public',
    color: '#E0E7FF',
    producer: 'Demo User',
  },
  {
    id: 'service-7',
    title: 'Drum Programming',
    description: 'Realistic drum programming for your track',
    price: 180,
    delivery: '3 days',
    status: 'Public',
    color: '#FFE4E6',
    producer: 'Demo User',
  },
  {
    id: 'service-8',
    title: 'Arrangement',
    description: 'Song arrangement and structure advice',
    price: 80,
    delivery: '2 days',
    status: 'Private',
    color: '#F1F5F9',
    producer: 'Demo User',
  },
  {
    id: 'service-9',
    title: 'Vocal Recording',
    description: 'Studio vocal recording session',
    price: 250,
    delivery: '1 day',
    status: 'Public',
    color: '#FDE68A',
    producer: 'Demo User',
  },
  {
    id: 'service-10',
    title: 'Piano Session',
    description: 'Professional piano tracks for your project',
    price: 140,
    delivery: '2 days',
    status: 'Public',
    color: '#C7D2FE',
    producer: 'Demo User',
  },
];

export interface ServicesTabProps {
  search: string;
  sortBy: 'title' | 'price' | 'delivery';
  sortOrder: 'asc' | 'desc';
  visibility: 'all' | 'Public' | 'Private';
}

export function ServicesTab({ search, sortBy, sortOrder, visibility }: ServicesTabProps) {
  const animationKey = sortBy + '-' + sortOrder + '-' + visibility + '-' + search;
  const sortedServices = useMemo(() => {
    const filtered = mockServices.filter(s =>
      (visibility === 'all' || s.status === visibility) &&
      (s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase()))
    );
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'title') cmp = a.title.localeCompare(b.title);
      if (sortBy === 'price') cmp = a.price - b.price;
      if (sortBy === 'delivery') {
        const parseDays = (str: string) => {
          const match = str.match(/(\d+)/g);
          if (!match) return 0;
          return Math.min(...match.map(Number));
        };
        cmp = parseDays(a.delivery) - parseDays(b.delivery);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [search, sortBy, sortOrder, visibility]);

  return (
    <Box sx={{
      width: '100%',
      flexGrow: 1,
      py: 2,
      overflowY: { xs: 'auto', sm: 'auto', md: 'auto' },
      minHeight: 0,
    }}>
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 1, sm: 1.7 },
          px: 2,
          pb: 1.1,
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            md: '1fr 1fr 1fr',
          },
          alignItems: 'stretch',
          minHeight: 0,
        }}
      >
        {/* Build Your Setlist Card (Service Creation CTA, with Note Trail Animation) */}
        <Box
          sx={{
            animation: 'fadeInCard 0.7s cubic-bezier(0.4,0,0.2,1)',
            '@keyframes fadeInCard': {
              '0%': { opacity: 0, transform: 'scale(0.97) translateY(16px)' },
              '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
            },
            gridColumn: '1',
          }}
        >
          <Tooltip title="Make a new service or bundle existing services" arrow>
            <Card
              tabIndex={0}
              role="button"
              aria-label="Build Your Setlist"
              onClick={() => {/* TODO: trigger service creation flow */ }}
              sx={{
                position: 'relative',
                height: '100%',
                minHeight: { xs: 80, sm: 210 },
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'column' },
                alignItems: 'center',
                justifyContent: 'flex-start',
                borderRadius: 1.2,
                boxShadow: '0 2px 8px 0 rgba(122,95,255,0.07), 0 1px 3px 0 rgba(51,155,255,0.05)',
                cursor: 'pointer',
                p: 0,
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #f7f7fb 0%, #e9eaf6 100%)',
                border: '2.5px dashed #b7aaff',
                borderColor: '#b7aaff',
                transition: 'box-shadow 0.22s, transform 0.22s, border 0.22s, background 0.22s',
                outline: 'none',
                pt: { xs: 0.7, sm: 2.2 },
                pb: { xs: 0.7, sm: 2.2 },
                px: { xs: 0.7, sm: 2.2 },
                '&:hover, &:focus': {
                  boxShadow: '0 0 0 4px rgba(122,95,255,0.09), 0 4px 16px 0 rgba(51,155,255,0.07)',
                  transform: 'translateY(-3px) scale(1.035)',
                  borderColor: '#7A5FFF',
                  background: 'linear-gradient(135deg, #f3f6ff 0%, #e3eafc 100%)',
                },
              }}
            >
              {/* Background overlays: stylized waveform only */}
              <Box sx={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: 38, left: 0, width: '100%', opacity: 0.20 }}>
                  <svg width="100%" height="90" viewBox="0 0 240 90" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '90px' }}>
                    {/* Wider, more expansive jagged waveform */}
                    <polyline points="0,70 15,30 30,85 45,18 60,88 75,44 90,89 105,24 120,78 135,12 150,84 165,36 180,70 195,30 210,85 225,18 240,70" stroke="#7A5FFF" strokeWidth="3.2" fill="none" opacity="0.45" />
                  </svg>
                </Box>
              </Box>
              {/* Corner badge: Service or Bundle with icon */}
              <Box sx={{
                position: 'absolute',
                top: { xs: 6, sm: 12 },
                right: { xs: 6, sm: 12 },
                zIndex: 2,
                background: 'linear-gradient(90deg, #FFCD38 0%, #b7aaff 100%)',
                color: '#23243a',
                fontWeight: 700,
                fontSize: { xs: '0.60rem', sm: '0.72rem' },
                px: { xs: 0.8, sm: 1.5 },
                py: { xs: 0.15, sm: 0.3 },
                borderRadius: 0.7,
                boxShadow: '0 1px 4px 0 rgba(122,95,255,0.10)',
                letterSpacing: '0.03em',
                opacity: 0.93,
                display: 'flex',
                alignItems: 'center',
                pr: { xs: 0.5, sm: 1 },
              }}>
                {/* Layers icon (Lucide/MUI) */}
                <svg width={window.innerWidth < 600 ? 11 : 15} height={window.innerWidth < 600 ? 11 : 15} viewBox="0 0 24 24" fill="none" stroke="#7A5FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: window.innerWidth < 600 ? 2 : 4, marginTop: window.innerWidth < 600 ? -0.5 : -1 }}><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
                Service or Bundle
              </Box>
              {/* Main Content */}
              <Box sx={{ zIndex: 1, width: '100%', display: 'flex', flexDirection: { xs: 'column', sm: 'column' }, alignItems: 'center', justifyContent: 'center', flexGrow: 1, pt: { xs: 0.5, sm: 4 }, pb: { xs: 0.5, sm: 2.5 }, px: { xs: 0.5, sm: 2 }, position: 'relative' }}>
                {/* Note trail animation container (absolute, pointer-events none) */}
                <Box
                  className="note-trail-container"
                  sx={{
                    position: 'absolute',
                    left: '50%',
                    top: 38,
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    zIndex: 2,
                    pointerEvents: 'none',
                  }}
                >
                  {/* Music notes, only animate on hover/focus (prefers-reduced-motion: no-preference) */}
                  <Box
                    className="note-svg note1"
                    sx={{
                      position: 'absolute',
                      left: -8,
                      top: 0,
                      opacity: 0,
                      '@media (hover: hover)': {
                        '.MuiCard-root:hover &, .MuiCard-root:focus &': {
                          animation: 'noteFloat1 1.2s 0.05s both',
                          opacity: 1,
                        },
                      },
                      '@media (prefers-reduced-motion: reduce)': {
                        animation: 'none !important',
                      },
                      zIndex: 2,
                    }}
                  >
                    {/* SVG music note */}
                    <svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 20c2 0 3.5-1.5 3.5-3.5V6.5h6V4H9.5V16.5C9.5 18 8 19.5 6 19.5S2.5 18 2.5 16.5 4 13.5 6 13.5" stroke="#7A5FFF" strokeWidth="2" fill="#b7aaff" fillOpacity="0.18" />
                    </svg>
                  </Box>
                  <Box
                    className="note-svg note2"
                    sx={{
                      position: 'absolute',
                      left: 8,
                      top: 6,
                      opacity: 0,
                      '@media (hover: hover)': {
                        '.MuiCard-root:hover &, .MuiCard-root:focus &': {
                          animation: 'noteFloat2 1.25s 0.18s both',
                          opacity: 1,
                        },
                      },
                      '@media (prefers-reduced-motion: reduce)': {
                        animation: 'none !important',
                      },
                      zIndex: 2,
                    }}
                  >
                    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 18c1.5 0 2.5-1.2 2.5-2.7V5.5h5V3.5H7.5V15.3C7.5 16.5 6.5 17.7 5 17.7S2.5 16.5 2.5 15.3 3.5 13.5 5 13.5" stroke="#7A5FFF" strokeWidth="1.7" fill="#b7aaff" fillOpacity="0.13" />
                    </svg>
                  </Box>
                  <Box
                    className="note-svg note3"
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 16,
                      opacity: 0,
                      '@media (hover: hover)': {
                        '.MuiCard-root:hover &, .MuiCard-root:focus &': {
                          animation: 'noteFloat3 1.1s 0.32s both',
                          opacity: 1,
                        },
                      },
                      '@media (prefers-reduced-motion: reduce)': {
                        animation: 'none !important',
                      },
                      zIndex: 2,
                    }}
                  >
                    <svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 16c1.2 0 2-1 2-2.2V4.5h4V2.5H6V13.8C6 15 5.2 16 4 16S2 15 2 13.8 2.8 12.5 4 12.5" stroke="#7A5FFF" strokeWidth="1.3" fill="#b7aaff" fillOpacity="0.10" />
                    </svg>
                  </Box>
                  {/* Keyframes for note float */}
                  <style>{`
                    @keyframes noteFloat1 {
                      0% { opacity: 0; transform: translateY(0) translateX(0) scale(1); }
                      10% { opacity: 0.7; }
                      60% { opacity: 1; transform: translateY(-30px) translateX(-8px) scale(1.08); }
                      100% { opacity: 0; transform: translateY(-48px) translateX(-16px) scale(1.12); }
                    }
                    @keyframes noteFloat2 {
                      0% { opacity: 0; transform: translateY(0) translateX(0) scale(1); }
                      10% { opacity: 0.7; }
                      60% { opacity: 1; transform: translateY(-32px) translateX(10px) scale(1.10); }
                      100% { opacity: 0; transform: translateY(-54px) translateX(18px) scale(1.13); }
                    }
                    @keyframes noteFloat3 {
                      0% { opacity: 0; transform: translateY(0) translateX(0) scale(1); }
                      10% { opacity: 0.7; }
                      60% { opacity: 1; transform: translateY(-28px) translateX(0px) scale(1.07); }
                      100% { opacity: 0; transform: translateY(-44px) translateX(-6px) scale(1.10); }
                    }
                  `}</style>
                </Box>
                {/* Central icon: checklist with floating + icons, smaller and spaced */}
                <Box sx={{ mt: 0.5, mb: 2.2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'transform 0.18s' }}>
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      borderRadius: 2.2,
                      background: 'linear-gradient(135deg, #fff 60%, #b7aaff 100%)',
                      boxShadow: '0 2px 16px 0 rgba(122,95,255,0.10)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #b7aaff',
                      cursor: 'pointer',
                      transition: 'box-shadow 0.18s, transform 0.18s',
                      animation: 'setlistIconBounce 1.5s infinite cubic-bezier(0.4,0,0.2,1)',
                      '@media (hover: hover)': {
                        '.MuiCard-root:hover &, .MuiCard-root:focus &': {
                          animation: 'setlistIconBounce 1.5s infinite cubic-bezier(0.4,0,0.2,1), setlistIconSpin 0.7s cubic-bezier(0.4,0,0.2,1) 1',
                        },
                      },
                      '@keyframes setlistIconBounce': {
                        '0%': { boxShadow: '0 0 0 0 rgba(183,170,255,0.13), 0 2px 16px 0 rgba(122,95,255,0.10)', transform: 'scale(1) rotate(0deg)' },
                        '60%': { boxShadow: '0 0 0 12px rgba(183,170,255,0.10), 0 2px 16px 0 rgba(122,95,255,0.10)', transform: 'scale(1.06) rotate(-2deg)' },
                        '100%': { boxShadow: '0 0 0 0 rgba(183,170,255,0.13), 0 2px 16px 0 rgba(122,95,255,0.10)', transform: 'scale(1) rotate(0deg)' },
                      },
                      '@keyframes setlistIconSpin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  >
                    {/* Checklist icon */}
                    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="6" y="6" width="20" height="20" rx="5" fill="#b7aaff" />
                      <path d="M11 16l3 3 7-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {/* Floating + icons */}
                    <Box sx={{ position: 'absolute', top: 2, right: 2, background: '#fff', borderRadius: '50%', width: 13, height: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px 0 rgba(122,95,255,0.10)', border: '1.2px solid #b7aaff', fontSize: 10, color: '#b7aaff', fontWeight: 700 }}>+</Box>
                    <Box sx={{ position: 'absolute', bottom: 2, left: 2, background: '#fff', borderRadius: '50%', width: 10, height: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px 0 rgba(122,95,255,0.10)', border: '1px solid #b7aaff', fontSize: 8, color: '#b7aaff', fontWeight: 700 }}>+</Box>
                  </Box>
                </Box>
                {/* Title and subtitle */}
                <Box sx={{ mt: { xs: 0.5, sm: 1.2 }, mb: { xs: 0.2, sm: 0.5 }, width: '100%', display: 'flex', flexDirection: { xs: 'column', sm: 'column' }, alignItems: { xs: 'center', sm: 'center' }, textAlign: { xs: 'center', sm: 'center' } }}>
                  <span style={{ fontWeight: 900, fontSize: window.innerWidth < 600 ? '1rem' : '1.18rem', color: '#7A5FFF', letterSpacing: '0.01em', fontFamily: 'inherit', textShadow: '0 2px 8px rgba(122,95,255,0.10)' }}>
                    Click to create a new service or bundle
                  </span>
                </Box>
              </Box>
            </Card>
          </Tooltip>
        </Box>
        {/* Service Cards */}
        {sortedServices.map((service, idx) => (
          <Box
            key={service.id + '-' + animationKey}
            sx={{
              animation: `fadeInCard 0.7s cubic-bezier(0.4,0,0.2,1) ${(idx + 1) * 0.07}s both`,
            }}
          >
            <ServiceCard
              title={service.title}
              description={service.description}
              price={service.price}
              delivery={service.delivery}
              status={service.status}
              producer={service.producer}
              onEdit={() => {/* TODO: trigger edit flow */}}
              color={service.color}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
} 