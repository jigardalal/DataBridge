import { FileUpload } from '../components/FileUpload';
import { Box, Typography, Container } from '@mui/material';

export const UploadPage = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Upload Dataset
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Upload your Excel or CSV files to process and analyze the data.
        </Typography>
        <FileUpload />
      </Box>
    </Container>
  );
}; 