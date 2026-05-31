import { useState } from 'react';
import { Button } from '@figma/astraui';
import { Database } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../utils/api';

export function SeedDataButton({ accessToken }: { accessToken: string }) {
  const [loading, setLoading] = useState(false);

  const seedData = async () => {
    setLoading(true);
    try {
      const demoProducts = [
        {
          name: 'Premium Digital License',
          description: 'Lifetime access to our premium digital content library with exclusive features and priority support.',
          price: 49.99,
          category: 'License',
        },
        {
          name: 'Software Development Kit',
          description: 'Complete SDK with documentation, sample code, and API access for building integrations.',
          price: 99.99,
          category: 'Software',
        },
        {
          name: 'Pro Membership (Annual)',
          description: 'One year of Pro membership with unlimited downloads, premium support, and early access to new releases.',
          price: 299.99,
          category: 'Membership',
        },
        {
          name: 'Video Tutorial Bundle',
          description: 'Comprehensive video tutorial series covering advanced topics with downloadable resources and project files.',
          price: 79.99,
          category: 'Educational',
        },
        {
          name: 'Custom Integration Service',
          description: 'Professional integration service with personalized setup, configuration, and 30 days of support.',
          price: 199.99,
          category: 'Service',
        },
        {
          name: 'Digital Asset Pack',
          description: 'High-quality digital assets including graphics, templates, and design elements for commercial use.',
          price: 39.99,
          category: 'Assets',
        },
      ];

      for (const product of demoProducts) {
        await api.createProduct(accessToken, product);
      }

      toast('Demo products added successfully!');
    } catch (error) {
      console.error('Error seeding data:', error);
      toast('Failed to add demo products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="neutral"
      iconStart={<Database size={16} />}
      onClick={seedData}
      disabled={loading}
    >
      {loading ? 'Adding...' : 'Add Demo Products'}
    </Button>
  );
}
