import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { FileUpload } from '../FileUpload';
import { uploadDataset } from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  uploadDataset: jest.fn().mockResolvedValue({ data: 'success' })
}));

describe('FileUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the upload area', () => {
    render(<FileUpload />);
    expect(screen.getByText('Drag and drop files here')).toBeInTheDocument();
    expect(screen.getByText('or click to select files')).toBeInTheDocument();
  });

  it('handles drag and drop events', () => {
    render(<FileUpload />);
    const uploadArea = screen.getByText('Drag and drop files here').parentElement!;
    
    fireEvent.dragOver(uploadArea);
    expect(uploadArea).toHaveStyle({ backgroundColor: 'action.hover' });
    
    fireEvent.dragLeave(uploadArea);
    expect(uploadArea).not.toHaveStyle({ backgroundColor: 'action.hover' });
  });

  it('validates file types', async () => {
    render(<FileUpload />);
    
    // Create a test file
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    // Simulate file drop
    const uploadArea = screen.getByText('Drag and drop files here').parentElement!;
    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file]
      }
    });

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed.')).toBeInTheDocument();
    });
  });

  it('validates file size', async () => {
    render(<FileUpload />);
    
    // Create a large file (6MB)
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Simulate file drop
    const uploadArea = screen.getByText('Drag and drop files here').parentElement!;
    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [largeFile]
      }
    });

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('File size too large. Maximum size is 5MB.')).toBeInTheDocument();
    });
  });

  it('handles successful file upload', async () => {
    render(<FileUpload />);
    
    // Create a valid file
    const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Simulate file drop
    const uploadArea = screen.getByText('Drag and drop files here').parentElement!;
    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file]
      }
    });

    // Check for upload progress
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    // Check for success icon
    await waitFor(() => {
      expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument();
    });
  });

  it('handles failed file upload', async () => {
    // Mock API to reject
    (uploadDataset as jest.Mock).mockRejectedValueOnce(new Error('Upload failed'));
    
    render(<FileUpload />);
    
    // Create a valid file
    const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Simulate file drop
    const uploadArea = screen.getByText('Drag and drop files here').parentElement!;
    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file]
      }
    });

    // Check for error icon
    await waitFor(() => {
      expect(screen.getByTestId('ErrorIcon')).toBeInTheDocument();
    });
  });

  it('removes files when delete button is clicked', async () => {
    render(<FileUpload />);
    
    // Create a valid file
    const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Simulate file drop
    const uploadArea = screen.getByText('Drag and drop files here').parentElement!;
    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file]
      }
    });

    // Wait for file to appear
    await waitFor(() => {
      expect(screen.getByText('test.xlsx')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByLabelText('delete');
    fireEvent.click(deleteButton);

    // Check that file is removed
    await waitFor(() => {
      expect(screen.queryByText('test.xlsx')).not.toBeInTheDocument();
    });
  });
}); 