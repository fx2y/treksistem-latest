import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { mitraApi } from '@/services/mitraApi';

const CreateProfilePage: React.FC = () => {
  const { setMitraProfile } = useAuthStore();
  const [mitraName, setMitraName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mitraName.trim()) {
      toast.error("Mitra name cannot be empty.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const newProfile = await mitraApi.createProfile({ name: mitraName.trim() });
      setMitraProfile(newProfile);
      toast.success("Your Mitra profile has been successfully created.");
      // Navigation will happen automatically via ProtectedRoute logic
    } catch (error: any) {
      toast.error(error.message || "Could not create profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Your Mitra Profile</CardTitle>
          <CardDescription>
            Welcome! You're authenticated via Cloudflare Access. 
            Please provide a name for your Mitra business to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="mitraName" className="text-sm font-medium">
                Mitra Business Name
              </label>
              <Input
                id="mitraName"
                type="text"
                value={mitraName}
                onChange={(e) => setMitraName(e.target.value)}
                placeholder="e.g., Warung Makan Barokah"
                required
                disabled={isSubmitting}
                className="w-full"
              />
            </div>
            <Button 
              type="submit" 
              disabled={isSubmitting || !mitraName.trim()}
              className="w-full"
            >
              {isSubmitting ? 'Creating Profile...' : 'Create Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateProfilePage; 