import Typography from '@mui/material/Typography';
import { Box } from '@mui/material';
import LayoutWeb from './layout/web/LayoutWeb';

function App() {
  return (
    <LayoutWeb>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 'calc(100vh - 80px)',
        px: 2
      }}>
        <Typography variant="h2" component="h1">
          Hello World
        </Typography>
      </Box>
    </LayoutWeb>
  );
}

export default App;
