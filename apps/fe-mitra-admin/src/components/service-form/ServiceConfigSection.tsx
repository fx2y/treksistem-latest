import React from 'react';
import { Control, UseFormWatch } from 'react-hook-form';
import { CreateServicePayload } from '@/types/service';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { BasicConfigSection } from './BasicConfigSection';
import { PricingConfigSection } from './PricingConfigSection';
import { MuatanFasilitasSection } from './MuatanFasilitasSection';
import { AdvancedConfigSection } from './AdvancedConfigSection';

interface ServiceConfigSectionProps {
  control: Control<CreateServicePayload>;
  watch: UseFormWatch<CreateServicePayload>;
}

export const ServiceConfigSection: React.FC<ServiceConfigSectionProps> = ({ control, watch }) => {
  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic">Basic Config</TabsTrigger>
        <TabsTrigger value="pricing">Pricing</TabsTrigger>
        <TabsTrigger value="muatan">Cargo & Facilities</TabsTrigger>
        <TabsTrigger value="advanced">Advanced</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-6 mt-6">
        <BasicConfigSection control={control} />
      </TabsContent>

      <TabsContent value="pricing" className="space-y-6 mt-6">
        <PricingConfigSection control={control} watch={watch} />
      </TabsContent>

      <TabsContent value="muatan" className="space-y-6 mt-6">
        <MuatanFasilitasSection control={control} />
      </TabsContent>

      <TabsContent value="advanced" className="space-y-6 mt-6">
        <AdvancedConfigSection control={control} watch={watch} />
      </TabsContent>
    </Tabs>
  );
}; 