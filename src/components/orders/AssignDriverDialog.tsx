import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserPlus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ApiOrder, assignDriverToOrder } from '@/services/mitraOrderApi';
import { fetchMitraDrivers, ApiDriver } from '@/services/mitraDriverApi';
import { createWhatsAppLink, WhatsAppMessages } from '@treksistem/shared-types/src/utils/whatsapp-links';

// ... existing code ... 