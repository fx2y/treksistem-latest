import React from 'react';
import { Control } from 'react-hook-form';
import { CreateServicePayload } from '@/types/service';

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BasicServiceInfoSectionProps {
  control: Control<CreateServicePayload>;
}

// Common service type options for the dropdown
const SERVICE_TYPE_OPTIONS = [
  { value: 'P2P_EXPRESS_MOTOR', label: 'Ojek Motor Express' },
  { value: 'P2P_EXPRESS_MOBIL', label: 'Mobil Express' },
  { value: 'KURIR_MAKANAN', label: 'Kurir Makanan' },
  { value: 'KURIR_PAKET', label: 'Kurir Paket' },
  { value: 'AMBULANCE_TRANSPORT', label: 'Ambulance Transport' },
  { value: 'AMBULANCE_DARURAT', label: 'Ambulance Darurat' },
  { value: 'SCHEDULED_ANJEM_MOBIL', label: 'Antar Jemput Mobil' },
  { value: 'SCHEDULED_ANJEM_MOTOR', label: 'Antar Jemput Motor' },
  { value: 'KULI_ANGKUT', label: 'Kuli Angkut' },
  { value: 'CUSTOM', label: 'Custom Service' },
];

export const BasicServiceInfoSection: React.FC<BasicServiceInfoSectionProps> = ({ control }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Service Name */}
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Service Name</FormLabel>
            <FormControl>
              <Input 
                placeholder="e.g., Ojek Motor Cepat" 
                {...field} 
              />
            </FormControl>
            <FormDescription>
              The name customers will see for this service
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Service Type Key */}
      <FormField
        control={control}
        name="serviceTypeKey"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Service Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {SERVICE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              The core type of service you're offering
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Is Active */}
      <FormField
        control={control}
        name="isActive"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Active Service
              </FormLabel>
              <FormDescription>
                Whether this service is currently available to customers
              </FormDescription>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}; 