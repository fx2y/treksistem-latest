import React from 'react';
import { Control, useFieldArray } from 'react-hook-form';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface MuatanFasilitasSectionProps {
  control: Control<CreateServicePayload>;
}

export const MuatanFasilitasSection: React.FC<MuatanFasilitasSectionProps> = ({ control }) => {
  const { fields: muatanFields, append: appendMuatan, remove: removeMuatan } = useFieldArray({
    control,
    name: 'configJson.allowedMuatan',
  });

  const { fields: fasilitasFields, append: appendFasilitas, remove: removeFasilitas } = useFieldArray({
    control,
    name: 'configJson.availableFasilitas',
  });

  return (
    <div className="space-y-8">
      {/* Allowed Cargo Types */}
      <Card>
        <CardHeader>
          <CardTitle>Allowed Cargo Types</CardTitle>
          <CardDescription>
            Define what types of cargo or passengers this service can handle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {muatanFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
              <FormField
                control={control}
                name={`configJson.allowedMuatan.${index}.muatanId`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., PENUMPANG" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Unique identifier
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`configJson.allowedMuatan.${index}.namaTampil`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Passenger" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      User-facing name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`configJson.allowedMuatan.${index}.biayaHandlingTambahan`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Fee (IDR)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="0"
                        step="500"
                        placeholder="e.g., 2000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Optional extra fee
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeMuatan(index)}
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
            onClick={() => appendMuatan({ muatanId: '', namaTampil: '', biayaHandlingTambahan: undefined })}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Cargo Type
          </Button>
        </CardContent>
      </Card>

      {/* Available Facilities */}
      <Card>
        <CardHeader>
          <CardTitle>Available Facilities</CardTitle>
          <CardDescription>
            Define additional facilities or equipment available with this service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fasilitasFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
              <FormField
                control={control}
                name={`configJson.availableFasilitas.${index}.fasilitasId`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facility ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., HELM" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Unique identifier
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`configJson.availableFasilitas.${index}.namaTampil`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Helmet" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      User-facing name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`configJson.availableFasilitas.${index}.biayaFasilitasTambahan`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Fee (IDR)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="0"
                        step="500"
                        placeholder="e.g., 1000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Optional extra fee
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeFasilitas(index)}
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
            onClick={() => appendFasilitas({ fasilitasId: '', namaTampil: '', biayaFasilitasTambahan: undefined })}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Facility
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}; 