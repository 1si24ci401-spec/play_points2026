import { useState, useEffect } from 'react';
import { Button, InputField } from '@figma/astraui';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: string;
  imageUrl?: string;
}

interface OffersEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  offers: Offer[];
  onSave: (offers: Offer[]) => void;
}

export function OffersEditModal({ isOpen, onClose, offers, onSave }: OffersEditModalProps) {
  const [editedOffers, setEditedOffers] = useState<Offer[]>(offers);

  useEffect(() => {
    setEditedOffers(offers);
  }, [offers]);

  const handleSave = () => {
    onSave(editedOffers);
    toast('Offers updated successfully');
    onClose();
  };

  const updateOffer = (index: number, field: keyof Offer, value: string) => {
    const updated = [...editedOffers];
    updated[index] = { ...updated[index], [field]: value };
    setEditedOffers(updated);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-3xl md:max-h-[90vh] bg-background rounded-[var(--radius-lg)] shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-medium text-foreground">Edit Offers</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-[var(--radius-md)] transition-colors"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="flex flex-col gap-6">
                {editedOffers.map((offer, index) => (
                  <div
                    key={offer.id}
                    className="p-6 bg-card rounded-[var(--radius-lg)] border border-border"
                  >
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">
                      Offer {index + 1}
                    </h3>
                    <div className="flex flex-col gap-4">
                      <InputField
                        label="Title"
                        value={offer.title}
                        onChange={(value) => updateOffer(index, 'title', value)}
                      />
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-foreground">Description</label>
                        <textarea
                          value={offer.description}
                          onChange={(e) => updateOffer(index, 'description', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 bg-input-background border border-border rounded-[var(--radius-md)] text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <InputField
                        label="Discount"
                        value={offer.discount}
                        onChange={(value) => updateOffer(index, 'discount', value)}
                        placeholder="50% OFF"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
              <Button variant="neutral" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
