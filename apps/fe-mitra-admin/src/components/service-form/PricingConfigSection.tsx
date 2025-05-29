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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface PricingConfigSectionProps {
  control: Control<CreateServicePayload>;
  watch: UseFormWatch<CreateServicePayload>;
}

export const PricingConfigSection: React.FC<PricingConfigSectionProps> = ({ control, watch }) => {
  const modelHargaJarak = watch('configJson.pricing.modelHargaJarak');

  const { fields: zonaHargaFields, append: appendZonaHarga, remove: removeZonaHarga } = useFieldArray({
    control,
    name: 'configJson.pricing.zonaHarga',
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Admin Fee */}
        <FormField
          control={control}
          name="configJson.pricing.biayaAdminPerOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Admin Fee per Order</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="e.g., 2000"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Fixed admin fee charged per order (in IDR)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Pricing Model */}
        <FormField
          control={control}
          name="configJson.pricing.modelHargaJarak"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Distance Pricing Model</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pricing model" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PER_KM">Per Kilometer</SelectItem>
                  <SelectItem value="ZONA_ASAL_TUJUAN">Zone-based</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                How distance-based pricing is calculated
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Per-KM Pricing (conditional) */}
      {modelHargaJarak === 'PER_KM' && (
        <FormField
          control={control}
          name="configJson.pricing.biayaPerKm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cost per Kilometer</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  min="0"
                  step="500"
                  placeholder="e.g., 3000"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Cost charged per kilometer (in IDR)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Zone-based Pricing (conditional) */}
      {modelHargaJarak === 'ZONA_ASAL_TUJUAN' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Zone-based Pricing</CardTitle>
            <CardDescription>
              Define pricing for different origin-destination zone combinations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {zonaHargaFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                <FormField
                  control={control}
                  name={`configJson.pricing.zonaHarga.${index}.asalZona`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origin Zone</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Malang Kota" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`configJson.pricing.zonaHarga.${index}.tujuanZona`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination Zone</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Kab. Malang" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`configJson.pricing.zonaHarga.${index}.harga`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (IDR)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          step="1000"
                          placeholder="e.g., 15000"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeZonaHarga(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => appendZonaHarga({ asalZona: '', tujuanZona: '', harga: 0 })}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Zone Pricing
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Per-Item Pricing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="configJson.pricing.modelHargaMuatanPcs"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Per-Item Pricing Model</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select per-item model" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="PER_PCS">Per Piece</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Optional per-item pricing (e.g., for packages)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {watch('configJson.pricing.modelHargaMuatanPcs') === 'PER_PCS' && (
          <FormField
            control={control}
            name="configJson.pricing.biayaPerPcs"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost per Piece</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    min="0"
                    step="500"
                    placeholder="e.g., 2000"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Additional cost per item/piece (in IDR)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </div>
  );
}; 