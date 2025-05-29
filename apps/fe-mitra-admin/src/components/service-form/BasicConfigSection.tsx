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

interface BasicConfigSectionProps {
  control: Control<CreateServicePayload>;
}

export const BasicConfigSection: React.FC<BasicConfigSectionProps> = ({ control }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Service Type Alias */}
        <FormField
          control={control}
          name="configJson.serviceTypeAlias"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Display Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Ojek Motor Cepat" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                User-facing name for this service type
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Primary Transport Type */}
        <FormField
          control={control}
          name="configJson.angkutanUtama"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Transport</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transport type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="MOTOR">Motor/Motorcycle</SelectItem>
                  <SelectItem value="MOBIL">Car/Vehicle</SelectItem>
                  <SelectItem value="AMBULANCE">Ambulance</SelectItem>
                  <SelectItem value="KULI_ANGKUT">Manual Labor</SelectItem>
                  <SelectItem value="SEPEDA">Bicycle</SelectItem>
                  <SelectItem value="TRUCK">Truck</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Primary vehicle or transport method
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Business Model */}
        <FormField
          control={control}
          name="configJson.modelBisnis"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Model</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business model" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="USAHA_SENDIRI">Own Business</SelectItem>
                  <SelectItem value="PUBLIC_3RD_PARTY">Public 3rd Party</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                How this service operates
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Driver Gender Constraint */}
        <FormField
          control={control}
          name="configJson.driverGenderConstraint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Driver Gender Requirement</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender requirement" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="SEMUA">Any Gender</SelectItem>
                  <SelectItem value="PRIA">Male Only</SelectItem>
                  <SelectItem value="WANITA">Female Only</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Gender requirement for drivers
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Route Model */}
        <FormField
          control={control}
          name="configJson.modelRute"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Route Model</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select route model" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="DYNAMIC_P2P">Dynamic Point-to-Point</SelectItem>
                  <SelectItem value="FIXED_SCHEDULED">Fixed Scheduled Route</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                How routes are determined
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Privacy/Mass Model */}
        <FormField
          control={control}
          name="configJson.privasiMassal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Privacy</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select privacy model" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PRIVATE_SINGLE_ORDER">Private (Single Order)</SelectItem>
                  <SelectItem value="MASSAL_MULTI_ORDER">Shared (Multiple Orders)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Whether orders are private or can be shared
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Default Service Timing */}
        <FormField
          control={control}
          name="configJson.waktuLayananDefault"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Service Timing</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timing model" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="EXPRESS_NOW">Express (Now)</SelectItem>
                  <SelectItem value="SCHEDULED_TIME">Scheduled Time</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Default timing for service delivery
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Order Responsibility */}
        <FormField
          control={control}
          name="configJson.penanggungJawabOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Order Responsibility</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select responsibility model" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="KETEMU_LANGSUNG">Direct Meeting</SelectItem>
                  <SelectItem value="DIWAKILKAN">Can be Delegated</SelectItem>
                  <SelectItem value="BEBAS_NON_KONTAK">Non-Contact Delivery</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                How orders are handled and delivered
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Important Items Default */}
        <FormField
          control={control}
          name="configJson.isBarangPentingDefault"
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
                  High-Value Items by Default
                </FormLabel>
                <FormDescription>
                  Whether orders are considered high-value by default
                </FormDescription>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Service Flow */}
        <FormField
          control={control}
          name="configJson.alurLayanan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Flow</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service flow" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="DIRECT_PICKUP_DELIVER">Direct Pickup & Deliver</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                How the service process flows
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}; 