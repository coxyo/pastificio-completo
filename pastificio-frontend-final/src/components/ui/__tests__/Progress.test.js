import { render, screen } from '@testing-library/react';
import Progress from './Progress';

describe('Progress Component', () => {
  it('renders correctly with default props', () => {
    render(<Progress value={50} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('shows correct percentage in label', () => {
    render(<Progress value={75} showLabel={true} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('hides label when showLabel is false', () => {
    render(<Progress value={75} showLabel={false} />);
    expect(screen.queryByText('75%')).not.toBeInTheDocument();
  });

  it('applies different sizes correctly', () => {
    const { rerender } = render(<Progress value={50} size="small" />);
    expect(screen.getByRole('progressbar')).toHaveClass('h-2');

    rerender(<Progress value={50} size="large" />);
    expect(screen.getByRole('progressbar')).toHaveClass('h-6');
  });

  it('applies different variants correctly', () => {
    const { rerender } = render(<Progress value={50} variant="success" />);
    expect(screen.getByRole('progressbar')).toHaveClass('bg-green-500');

    rerender(<Progress value={50} variant="error" />);
    expect(screen.getByRole('progressbar')).toHaveClass('bg-red-500');
  });
});