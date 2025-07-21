import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAssetSchema, updateAssetSchema, type Asset, type InsertAsset, type UpdateAsset } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface AssetFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: InsertAsset | UpdateAsset) => void;
  asset?: Asset;
  loading?: boolean;
}

export function ApiForm({ open, onClose, onSubmit, asset, loading = false }: AssetFormProps) {
  const isEditing = !!asset;
  const schema = isEditing ? updateAssetSchema : insertAssetSchema;

  const form = useForm<InsertAsset | UpdateAsset>({
    resolver: zodResolver(schema),
    defaultValues: isEditing ? {
      model_id: asset.model_id,
      model_year: asset.model_year,
      plate_number: asset.plate_number,
      chassis_no: asset.chassis_no,
      engine_no: asset.engine_no,
      ownership_type_id: asset.ownership_type_id,
      owner_company_id: asset.owner_company_id,
      register_date: asset.register_date,
      purchase_date: asset.purchase_date,
    } : {
      model_id: 1,
      model_year: 2023,
      plate_number: "",
      chassis_no: "",
      engine_no: "",
      ownership_type_id: 1,
      owner_company_id: 1,
      register_date: null,
      purchase_date: null,
    },
  });

  const handleSubmit = (data: InsertAsset | UpdateAsset) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Varlık Düzenle" : "Yeni Varlık Ekle"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="plate_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plaka No</FormLabel>
                  <FormControl>
                    <Input placeholder="Örn: 34 ABC 123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model_year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model Yılı</FormLabel>
                  <FormControl>
                    <Input
                      type="number" 
                      min="2000" 
                      max="2025"
                      placeholder="2023"
                      value={field.value?.toString()}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="chassis_no"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Şasi No</FormLabel>
                  <FormControl>
                    <Input placeholder="WDB1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="engine_no"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motor No</FormLabel>
                  <FormControl>
                    <Input placeholder="ENG123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                İptal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
