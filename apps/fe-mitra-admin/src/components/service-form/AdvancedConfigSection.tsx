import React from 'react';
import { Control, UseFormWatch, useFieldArray } from 'react-hook-form';
import { CreateServicePayload } from '@/types/service';
import { Plus, Trash2 } from 'lucide-react';

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface AdvancedConfigSectionProps {
  control: Control<CreateServicePayload>;
  watch: UseFormWatch<CreateServicePayload>;
}

export const AdvancedConfigSection: React.FC<AdvancedConfigSectionProps> = ({ control, watch }) => {
  const talanganEnabled = watch('configJson.fiturTalangan.enabled');
  
  const { fields: allowedOrderFields, append: appendOrderModel, remove: removeOrderModel } = useFieldArray({
    control,
    name: 'configJson.allowedModelOrder' as any,
  });

  const { fields: kotaCoverageFields, append: appendKota, remove: removeKota } = useFieldArray({
    control,
    name: 'configJson.jangkauanLayanan.kotaCoverage' as any,
  });

  return (
    <div className="space-y-8">
      {/* Talangan Feature */}
      <Card>
        <CardHeader>
          <CardTitle>Talangan (Advance Payment) Feature</CardTitle>
          <CardDescription>
            Configure advance payment capabilities for your service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="configJson.fiturTalangan.enabled"
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
                    Enable Talangan Feature
                  </FormLabel>
                  <FormDescription>
                    Allow customers to request advance payment for purchases
                  </FormDescription>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {talanganEnabled && (
            <FormField
              control={control}
              name="configJson.fiturTalangan.maxAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Talangan Amount (IDR)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="0"
                      step="10000"
                      placeholder="e.g., 500000"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum amount that can be advanced to customers
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* Service Coverage Area */}
      <Card>
        <CardHeader>
          <CardTitle>Service Coverage Area</CardTitle>
          <CardDescription>
            Define the geographical coverage of your service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="configJson.jangkauanLayanan.maxDistanceKm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Distance (KM)</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g., 50"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormDescription>
                  Maximum distance your service can cover (optional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Covered Cities/Areas</h4>
                <p className="text-sm text-muted-foreground">List of cities or areas you serve</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendKota('') as any}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add City
              </Button>
            </div>

            {kotaCoverageFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <FormField
                  control={control}
                  name={`configJson.jangkauanLayanan.kotaCoverage.${index}` as any}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="e.g., Malang" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeKota(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Allowed Order Models */}
      <Card>
        <CardHeader>
          <CardTitle>Allowed Order Models</CardTitle>
          <CardDescription>
            Define how customers can place orders for this service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {allowedOrderFields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <FormField
                control={control}
                name={`configJson.allowedModelOrder.${index}` as any}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select order model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PANGGIL_KE_ORDERER">Call to Customer</SelectItem>
                        <SelectItem value="JEMPUT_ANTAR_LAIN">Pickup & Deliver to Different Location</SelectItem>
                        <SelectItem value="AMBIL_ANTAR_ORDERER">Pickup & Return to Customer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeOrderModel(index)}
                className="text-red-600 hover:text-red-700"
                disabled={allowedOrderFields.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() => appendOrderModel('PANGGIL_KE_ORDERER' as any)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Order Model
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}; 