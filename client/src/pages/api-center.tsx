import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Play, 
  FileText, 
  Code, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Database,
  TestTube,
  BookOpen,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApiEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  description: string;
  category: string;
  requiredPermissions: string[];
  sampleRequest?: any;
  sampleResponse?: any;
  parameters?: Array<{ name: string; type: string; required: boolean; description: string }>;
  requestStructure?: Array<{
    field: string;
    type: string;
    required: boolean;
    description: string;
    example?: any;
  }>;
}

const apiEndpoints: ApiEndpoint[] = [
  // Referans Veriler Kategorisi
  {
    id: 'cities',
    name: 'Şehirler Listesi',
    method: 'GET',
    endpoint: '/api/getCities',
    description: 'Türkiye şehirlerinin tam listesini getirir',
    category: 'referans',
    requiredPermissions: ['data:read'],
    parameters: [
      { name: 'search', type: 'string', required: false, description: 'Şehir adında arama' },
      { name: 'limit', type: 'number', required: false, description: 'Sayfa başına kayıt sayısı' },
      { name: 'offset', type: 'number', required: false, description: 'Başlangıç noktası' }
    ],
    sampleResponse: { success: true, data: [{id: 1, name: "Adana"}, {id: 6, name: "Ankara"}] }
  },
  {
    id: 'countries',
    name: 'Ülkeler Listesi',
    method: 'GET',
    endpoint: '/api/getCountries',
    description: 'Dünya ülkelerinin listesini getirir',
    category: 'referans',
    requiredPermissions: ['data:read'],
    sampleResponse: { success: true, data: [{id: 1, name: "Türkiye", phoneCode: "+90"}] }
  },
  {
    id: 'car-brands',
    name: 'Araç Markaları',
    method: 'GET',
    endpoint: '/api/getCarBrands',
    description: 'Araç markalarının listesini getirir',
    category: 'referans',
    requiredPermissions: ['data:read'],
    sampleResponse: { success: true, data: [{id: 1, name: "Ford"}, {id: 2, name: "Mercedes"}] }
  },
  {
    id: 'car-models',
    name: 'Araç Modelleri',
    method: 'GET',
    endpoint: '/api/getCarModels',
    description: 'Araç modellerinin listesini getirir',
    category: 'referans',
    requiredPermissions: ['data:read'],
    parameters: [
      { name: 'brandId', type: 'number', required: false, description: 'Belirli bir marka için modeller' }
    ],
    sampleResponse: { success: true, data: [{id: 1, name: "Transit", brandId: 1}] }
  },
  {
    id: 'car-types',
    name: 'Araç Tipleri',
    method: 'GET',
    endpoint: '/api/getCarTypes',
    description: 'Araç tiplerinin listesini getirir',
    category: 'referans',
    requiredPermissions: ['data:read'],
    sampleResponse: { success: true, data: [{id: 1, name: "Otomobil"}, {id: 2, name: "Kamyonet"}] }
  },
  {
    id: 'ownership-types',
    name: 'Sahiplik Türleri',
    method: 'GET',
    endpoint: '/api/getOwnershipTypes',
    description: 'Sahiplik türlerinin listesini getirir',
    category: 'referans',
    requiredPermissions: ['data:read'],
    sampleResponse: { success: true, data: [{id: 1, name: "Şirket Mülkiyeti"}, {id: 2, name: "Kiralık"}] }
  },
  {
    id: 'work-areas',
    name: 'Çalışma Alanları',
    method: 'GET',
    endpoint: '/api/getWorkAreas',
    description: 'Çalışma alanlarının listesini getirir',
    category: 'referans',
    requiredPermissions: ['data:read'],
    sampleResponse: { success: true, data: [{id: 1, name: "İstanbul Bölgesi"}, {id: 2, name: "Ankara Bölgesi"}] }
  },
  {
    id: 'payment-methods',
    name: 'Ödeme Yöntemleri',
    method: 'GET',
    endpoint: '/api/getPaymentMethods',
    description: 'Ödeme yöntemlerinin listesini getirir',
    category: 'referans',
    requiredPermissions: ['data:read'],
    sampleResponse: { success: true, data: [{id: 1, name: "Nakit"}, {id: 2, name: "Kredi Kartı"}] }
  },
  {
    id: 'payment-types',
    name: 'Ödeme Türleri',
    method: 'GET',
    endpoint: '/api/financial/payment-types',
    description: 'Finansal ödeme türlerini getirir',
    category: 'referans',
    requiredPermissions: ['data:read'],
    sampleResponse: { success: true, data: [{id: 1, name: "Yakıt"}, {id: 2, name: "Bakım"}] }
  },
  {
    id: 'doc-main-types',
    name: 'Doküman Ana Tipleri',
    method: 'GET',
    endpoint: '/api/getDocMainTypes',
    description: 'Doküman ana tiplerini getirir',
    category: 'referans',
    requiredPermissions: ['data:read'],
    sampleResponse: { success: true, data: [{id: 1, name: "Ruhsat"}, {id: 2, name: "Sigorta"}] }
  },
  {
    id: 'doc-sub-types',
    name: 'Doküman Alt Tipleri',
    method: 'GET',
    endpoint: '/api/getDocSubTypes',
    description: 'Doküman alt tiplerini getirir',
    category: 'referans',
    requiredPermissions: ['data:read'],
    sampleResponse: { success: true, data: [{id: 1, name: "Araç Ruhsatı", mainTypeId: 1}] }
  },
  {
    id: 'maintenance-types',
    name: 'Bakım Türleri',
    method: 'GET',
    endpoint: '/api/getMaintenanceTypes',
    description: 'Bakım türlerinin listesini getirir',
    category: 'referans',
    requiredPermissions: ['data:read'],
    sampleResponse: { success: true, data: [{id: 1, name: "Periyodik Bakım"}, {id: 2, name: "Arıza Bakımı"}] }
  },
  {
    id: 'penalty-types',
    name: 'Ceza Türleri',
    method: 'GET',
    endpoint: '/api/getPenaltyTypes',
    description: 'Ceza türlerinin listesini getirir',
    category: 'referans',
    requiredPermissions: ['data:read'],
    sampleResponse: { success: true, data: [{id: 1, name: "Hız Cezası"}, {id: 2, name: "Park Cezası"}] }
  },
  {
    id: 'policy-types',
    name: 'Poliçe Türleri',
    method: 'GET',
    endpoint: '/api/getPolicyTypes',
    description: 'Poliçe türlerinin listesini getirir',
    category: 'referans',
    requiredPermissions: ['data:read'],
    sampleResponse: { success: true, data: [{id: 1, name: "Kasko"}, {id: 2, name: "Trafik Sigortası"}] }
  },
  {
    id: 'personnel-positions',
    name: 'Personel Pozisyonları',
    method: 'GET',
    endpoint: '/api/getPersonnelPositions',
    description: 'Personel pozisyonlarının listesini getirir',
    category: 'referans',
    requiredPermissions: ['data:read'],
    sampleResponse: { success: true, data: [{id: 1, name: "Şoför"}, {id: 2, name: "Müdür"}] }
  },
  // Asset Yönetimi
  {
    id: 'assets-list',
    name: 'Araç Listesi',
    method: 'GET',
    endpoint: '/api/assets',
    description: 'Şirket araçlarının listesini getirir',
    category: 'asset',
    requiredPermissions: ['asset:read'],
    parameters: [
      { name: 'search', type: 'string', required: false, description: 'Plaka veya model araması' },
      { name: 'active', type: 'boolean', required: false, description: 'Sadece aktif araçlar' },
      { name: 'modelId', type: 'number', required: false, description: 'Model ID filtresi' },
      { name: 'companyId', type: 'number', required: false, description: 'Şirket ID filtresi' }
    ],
    sampleResponse: { success: true, data: [{id: 1, plateNumber: "34ABC123", modelName: "Ford Transit"}] }
  },
  {
    id: 'assets-detail',
    name: 'Araç Detayı',
    method: 'GET',
    endpoint: '/api/assets/{id}',
    description: 'Belirli bir aracın detaylarını getirir',
    category: 'asset',
    requiredPermissions: ['asset:read'],
    parameters: [
      { name: 'id', type: 'number', required: true, description: 'Araç ID' }
    ],
    sampleResponse: { success: true, data: {id: 1, plateNumber: "34ABC123", modelName: "Ford Transit"} }
  },
  {
    id: 'assets-create',
    name: 'Yeni Araç Ekle',
    method: 'POST',
    endpoint: '/api/assets',
    description: 'Sisteme yeni araç ekler',
    category: 'asset',
    requiredPermissions: ['asset:write'],
    requestStructure: [
      { field: 'plateNumber', type: 'string', required: true, description: 'Araç plakası', example: "34XYZ789" },
      { field: 'modelId', type: 'number', required: true, description: 'Araç model ID', example: 1 },
      { field: 'modelYear', type: 'number', required: true, description: 'Model yılı', example: 2023 },
      { field: 'chassisNo', type: 'string', required: false, description: 'Şasi numarası', example: "CH123456" },
      { field: 'engineNo', type: 'string', required: false, description: 'Motor numarası', example: "EN789012" },
      { field: 'ownershipTypeId', type: 'number', required: true, description: 'Sahiplik türü ID', example: 1 },
      { field: 'isActive', type: 'boolean', required: false, description: 'Aktiflik durumu', example: true }
    ],
    sampleRequest: {
      plateNumber: "34XYZ789",
      modelId: 1,
      modelYear: 2023,
      chassisNo: "CH123456",
      engineNo: "EN789012",
      ownershipTypeId: 1,
      isActive: true
    },
    sampleResponse: { success: true, message: "Araç başarıyla eklendi", data: {id: 123} }
  },
  {
    id: 'assets-update',
    name: 'Araç Güncelle',
    method: 'PUT',
    endpoint: '/api/assets/{id}',
    description: 'Mevcut araç bilgilerini günceller',
    category: 'asset',
    requiredPermissions: ['asset:write'],
    parameters: [
      { name: 'id', type: 'number', required: true, description: 'Araç ID' }
    ],
    sampleRequest: {
      plateNumber: "34XYZ789",
      modelYear: 2024
    },
    sampleResponse: { success: true, message: "Araç başarıyla güncellendi" }
  },
  {
    id: 'assets-delete',
    name: 'Araç Sil',
    method: 'DELETE',
    endpoint: '/api/assets/{id}',
    description: 'Aracı siler (soft delete)',
    category: 'asset',
    requiredPermissions: ['asset:delete'],
    parameters: [
      { name: 'id', type: 'number', required: true, description: 'Araç ID' }
    ],
    sampleResponse: { success: true, message: "Araç başarıyla silindi" }
  },
  // Şirket Yönetimi
  {
    id: 'companies-list',
    name: 'Şirket Listesi',
    method: 'GET',
    endpoint: '/api/companies',
    description: 'Tüm şirketleri listeler',
    category: 'sirket',
    requiredPermissions: ['company:read'],
    parameters: [
      { name: 'search', type: 'string', required: false, description: 'Şirket adında arama' },
      { name: 'active', type: 'boolean', required: false, description: 'Sadece aktif şirketler' },
      { name: 'cityId', type: 'number', required: false, description: 'Şehir ID filtresi' }
    ],
    sampleResponse: { success: true, data: [{id: 1, name: "ABC Lojistik", taxNo: "1234567890"}] }
  },
  {
    id: 'companies-detail',
    name: 'Şirket Detayı',
    method: 'GET',
    endpoint: '/api/companies/{id}',
    description: 'Şirket detaylarını getirir',
    category: 'sirket',
    requiredPermissions: ['company:read'],
    parameters: [
      { name: 'id', type: 'number', required: true, description: 'Şirket ID' }
    ],
    sampleResponse: { success: true, data: {id: 1, name: "ABC Lojistik", taxNo: "1234567890"} }
  },
  {
    id: 'companies-create',
    name: 'Yeni Şirket Ekle',
    method: 'POST',
    endpoint: '/api/companies',
    description: 'Sisteme yeni şirket ekler',
    category: 'sirket',
    requiredPermissions: ['company:write'],
    requestStructure: [
      { field: 'name', type: 'string', required: true, description: 'Şirket adı', example: "XYZ Lojistik" },
      { field: 'taxNo', type: 'string', required: true, description: 'Vergi numarası', example: "9876543210" },
      { field: 'taxOffice', type: 'string', required: true, description: 'Vergi dairesi', example: "Kadıköy" },
      { field: 'address', type: 'string', required: true, description: 'Şirket adresi', example: "İstanbul" },
      { field: 'phone', type: 'string', required: false, description: 'Telefon numarası', example: "0216-123-4567" },
      { field: 'email', type: 'string', required: false, description: 'E-posta adresi', example: "info@xyzlojistik.com" },
      { field: 'cityId', type: 'number', required: true, description: 'Şehir ID', example: 34 }
    ],
    sampleRequest: {
      name: "XYZ Lojistik",
      taxNo: "9876543210",
      taxOffice: "Kadıköy",
      address: "İstanbul",
      phone: "0216-123-4567",
      cityId: 34
    },
    sampleResponse: { success: true, message: "Şirket başarıyla eklendi", data: {id: 456} }
  },
  {
    id: 'companies-update',
    name: 'Şirket Güncelle',
    method: 'PUT',
    endpoint: '/api/companies/{id}',
    description: 'Şirket bilgilerini günceller',
    category: 'sirket',
    requiredPermissions: ['company:write'],
    parameters: [
      { name: 'id', type: 'number', required: true, description: 'Şirket ID' }
    ],
    sampleRequest: {
      name: "XYZ Lojistik A.Ş.",
      phone: "0216-987-6543"
    },
    sampleResponse: { success: true, message: "Şirket başarıyla güncellendi" }
  },
  {
    id: 'companies-delete',
    name: 'Şirket Sil',
    method: 'DELETE',
    endpoint: '/api/companies/{id}',
    description: 'Şirketi siler (soft delete)',
    category: 'sirket',
    requiredPermissions: ['company:delete'],
    parameters: [
      { name: 'id', type: 'number', required: true, description: 'Şirket ID' }
    ],
    sampleResponse: { success: true, message: "Şirket başarıyla silindi" }
  },
  // Personel Yönetimi
  {
    id: 'personnel-list',
    name: 'Personel Listesi',
    method: 'GET',
    endpoint: '/api/getPersonnel',
    description: 'Şirket personelinin listesini getirir',
    category: 'personel',
    requiredPermissions: ['data:read'],
    sampleResponse: { success: true, data: [{id: 1, name: "Ahmet Yılmaz", position: "Şoför"}] }
  },
  {
    id: 'personnel-create',
    name: 'Yeni Personel Ekle',
    method: 'POST',
    endpoint: '/api/addPersonnel',
    description: 'Sisteme yeni personel ekler',
    category: 'personel',
    requiredPermissions: ['data:write'],
    requestStructure: [
      { field: 'name', type: 'string', required: true, description: 'Personel adı soyadı', example: "Mehmet Kaya" },
      { field: 'positionId', type: 'number', required: true, description: 'Pozisyon ID', example: 1 },
      { field: 'workAreaId', type: 'number', required: true, description: 'Çalışma alanı ID', example: 1 },
      { field: 'phone', type: 'string', required: false, description: 'Telefon numarası', example: "0532-123-4567" },
      { field: 'email', type: 'string', required: false, description: 'E-posta adresi', example: "mehmet@company.com" },
      { field: 'startDate', type: 'string', required: false, description: 'İşe başlama tarihi (YYYY-MM-DD)', example: "2024-01-01" },
      { field: 'licenseNumber', type: 'string', required: false, description: 'Ehliyet numarası', example: "12345678" }
    ],
    sampleRequest: {
      name: "Mehmet Kaya",
      positionId: 1,
      workAreaId: 1,
      phone: "0532-123-4567",
      email: "mehmet@company.com"
    },
    sampleResponse: { success: true, message: "Personel başarıyla eklendi" }
  },
  {
    id: 'personnel-delete',
    name: 'Personel Sil',
    method: 'DELETE',
    endpoint: '/api/deletePersonnel/{id}',
    description: 'Personeli siler',
    category: 'personel',
    requiredPermissions: ['data:delete'],
    parameters: [
      { name: 'id', type: 'number', required: true, description: 'Personel ID' }
    ],
    sampleResponse: { success: true, message: "Personel başarıyla silindi" }
  },
  // Finansal İşlemler
  {
    id: 'financial-accounts',
    name: 'Finansal Hesaplar',
    method: 'GET',
    endpoint: '/api/financial/current-accounts',
    description: 'Finansal işlem kayıtlarını getirir',
    category: 'finansal',
    requiredPermissions: ['financial:read'],
    parameters: [
      { name: 'page', type: 'number', required: false, description: 'Sayfa numarası' },
      { name: 'limit', type: 'number', required: false, description: 'Sayfa başına kayıt' },
      { name: 'status', type: 'string', required: false, description: 'Ödeme durumu' },
      { name: 'search', type: 'string', required: false, description: 'Arama terimi' }
    ],
    sampleResponse: { success: true, data: [{id: 1, amount: 50000, paymentType: "hasar"}] }
  },
  {
    id: 'financial-accounts-create',
    name: 'Yeni Finansal İşlem',
    method: 'POST',
    endpoint: '/api/financial/current-accounts',
    description: 'Yeni finansal işlem ekler',
    category: 'finansal',
    requiredPermissions: ['financial:write'],
    requestStructure: [
      { field: 'description', type: 'string', required: true, description: 'İşlem açıklaması', example: "Yakıt alımı" },
      { field: 'payerCompanyId', type: 'number', required: true, description: 'Ödeyen şirket ID', example: 1 },
      { field: 'payeeCompanyId', type: 'number', required: true, description: 'Alacaklı şirket ID', example: 2 },
      { field: 'amountCents', type: 'number', required: true, description: 'Tutar (kuruş cinsinden)', example: 50000 },
      { field: 'transactionDate', type: 'string', required: true, description: 'İşlem tarihi (YYYY-MM-DD)', example: "2024-01-15" },
      { field: 'paymentStatus', type: 'string', required: true, description: 'Ödeme durumu (pending/paid/cancelled)', example: "pending" },
      { field: 'paymentMethodId', type: 'number', required: false, description: 'Ödeme yöntemi ID', example: 1 },
      { field: 'dueDate', type: 'string', required: false, description: 'Vade tarihi (YYYY-MM-DD)', example: "2024-02-15" }
    ],
    sampleRequest: {
      description: "Yakıt alımı",
      payerCompanyId: 1,
      payeeCompanyId: 2,
      amountCents: 50000,
      transactionDate: "2024-01-15",
      paymentStatus: "pending"
    },
    sampleResponse: { success: true, message: "İşlem başarıyla eklendi" }
  },
  {
    id: 'financial-details',
    name: 'Finansal Detaylar',
    method: 'GET',
    endpoint: '/api/financial/accounts-details',
    description: 'Finansal detay kayıtlarını getirir',
    category: 'finansal',
    requiredPermissions: ['financial:read'],
    parameters: [
      { name: 'current_account_id', type: 'number', required: false, description: 'Ana hesap ID' }
    ],
    sampleResponse: { success: true, data: [{id: 1, amount: 15000, paymentTypeId: 1}] }
  },
  {
    id: 'financial-details-create',
    name: 'Yeni Detay Kayıt',
    method: 'POST',
    endpoint: '/api/financial/accounts-details',
    description: 'Yeni finansal detay ekler',
    category: 'finansal',
    requiredPermissions: ['financial:write'],
    sampleRequest: {
      finCurAcId: 1,
      amount: 15000,
      date: "2024-01-15",
      paymentTypeId: 1
    },
    sampleResponse: { success: true, message: "Detay başarıyla eklendi" }
  },
  // Yakıt Yönetimi
  {
    id: 'fuel-records-list',
    name: 'Yakıt Kayıtları',
    method: 'GET',
    endpoint: '/api/fuel-records',
    description: 'Yakıt kayıtlarını listeler',
    category: 'yakit',
    requiredPermissions: ['fuel:read'],
    parameters: [
      { name: 'assetId', type: 'number', required: false, description: 'Araç ID' },
      { name: 'startDate', type: 'string', required: false, description: 'Başlangıç tarihi' },
      { name: 'endDate', type: 'string', required: false, description: 'Bitiş tarihi' }
    ],
    sampleResponse: { success: true, data: [{id: 1, assetId: 1, fuelAmount: 50, fuelCostCents: 150000}] }
  },
  {
    id: 'fuel-records-detail',
    name: 'Yakıt Kaydı Detayı',
    method: 'GET',
    endpoint: '/api/fuel-records/{id}',
    description: 'Yakıt kaydı detayını getirir',
    category: 'yakit',
    requiredPermissions: ['fuel:read'],
    parameters: [
      { name: 'id', type: 'number', required: true, description: 'Kayıt ID' }
    ],
    sampleResponse: { success: true, data: {id: 1, assetId: 1, fuelAmount: 50} }
  },
  {
    id: 'fuel-records-create',
    name: 'Yeni Yakıt Kaydı',
    method: 'POST',
    endpoint: '/api/fuel-records',
    description: 'Yeni yakıt kaydı ekler',
    category: 'yakit',
    requiredPermissions: ['fuel:write'],
    requestStructure: [
      { field: 'assetId', type: 'number', required: true, description: 'Araç ID', example: 1 },
      { field: 'recordDate', type: 'string', required: true, description: 'Kayıt tarihi (YYYY-MM-DD)', example: "2024-01-15" },
      { field: 'currentKilometers', type: 'number', required: true, description: 'Güncel kilometre', example: 125000 },
      { field: 'fuelAmount', type: 'number', required: true, description: 'Yakıt miktarı (litre)', example: 50 },
      { field: 'fuelCostCents', type: 'number', required: true, description: 'Yakıt tutarı (kuruş)', example: 150000 },
      { field: 'gasStationName', type: 'string', required: false, description: 'Yakıt istasyonu adı', example: "Shell" },
      { field: 'paymentMethodId', type: 'number', required: false, description: 'Ödeme yöntemi ID', example: 1 },
      { field: 'notes', type: 'string', required: false, description: 'Notlar', example: "Şehir içi kullanım" }
    ],
    sampleRequest: {
      assetId: 1,
      recordDate: "2024-01-15",
      currentKilometers: 125000,
      fuelAmount: 50,
      fuelCostCents: 150000,
      gasStationName: "Shell"
    },
    sampleResponse: { success: true, message: "Yakıt kaydı eklendi" }
  },
  {
    id: 'fuel-records-update',
    name: 'Yakıt Kaydı Güncelle',
    method: 'PUT',
    endpoint: '/api/fuel-records/{id}',
    description: 'Yakıt kaydını günceller',
    category: 'yakit',
    requiredPermissions: ['fuel:write'],
    parameters: [
      { name: 'id', type: 'number', required: true, description: 'Kayıt ID' }
    ],
    sampleRequest: {
      fuelAmount: 55,
      fuelCostCents: 165000
    },
    sampleResponse: { success: true, message: "Yakıt kaydı güncellendi" }
  },
  {
    id: 'fuel-records-delete',
    name: 'Yakıt Kaydı Sil',
    method: 'DELETE',
    endpoint: '/api/fuel-records/{id}',
    description: 'Yakıt kaydını siler',
    category: 'yakit',
    requiredPermissions: ['fuel:delete'],
    parameters: [
      { name: 'id', type: 'number', required: true, description: 'Kayıt ID' }
    ],
    sampleResponse: { success: true, message: "Yakıt kaydı silindi" }
  },
  // Doküman Yönetimi
  {
    id: 'document-upload',
    name: 'Dosya Yükleme',
    method: 'POST',
    endpoint: '/api/documents',
    description: 'Asset veya personel için dosya yükler',
    category: 'dokuman',
    requiredPermissions: ['document:write'],
    sampleRequest: "FormData (multipart/form-data)",
    sampleResponse: { success: true, message: "Dosya başarıyla yüklendi" }
  },
  {
    id: 'document-list',
    name: 'Doküman Listesi',
    method: 'GET',
    endpoint: '/api/documents/entity/{entityType}/{entityId}',
    description: 'Entity dokümanlarını listeler',
    category: 'dokuman',
    requiredPermissions: ['document:read'],
    parameters: [
      { name: 'entityType', type: 'string', required: true, description: 'Entity tipi (asset/personnel)' },
      { name: 'entityId', type: 'number', required: true, description: 'Entity ID' }
    ],
    sampleResponse: { success: true, data: [{id: 1, fileName: "ruhsat.pdf", fileSize: 1024000}] }
  },
  {
    id: 'document-delete',
    name: 'Doküman Sil',
    method: 'DELETE',
    endpoint: '/api/documents/{id}',
    description: 'Dokümanı siler',
    category: 'dokuman',
    requiredPermissions: ['document:delete'],
    parameters: [
      { name: 'id', type: 'number', required: true, description: 'Doküman ID' }
    ],
    sampleResponse: { success: true, message: "Doküman silindi" }
  },
  // Toplu İşlemler
  {
    id: 'bulk-import-csv',
    name: 'CSV İle Toplu Veri Aktarımı',
    method: 'POST',
    endpoint: '/api/bulk-import/csv',
    description: 'CSV dosyası ile toplu veri aktarımı yapar',
    category: 'toplu',
    requiredPermissions: ['data:write'],
    sampleRequest: "FormData: file + targetTable + batchSize",
    sampleResponse: { success: true, data: { importId: "import_123", totalRows: 1000 } }
  },
  {
    id: 'bulk-import-status',
    name: 'Import Durumu',
    method: 'GET',
    endpoint: '/api/bulk-import/status/{importId}',
    description: 'Import işleminin durumunu kontrol eder',
    category: 'toplu',
    requiredPermissions: ['data:read'],
    parameters: [
      { name: 'importId', type: 'string', required: true, description: 'Import ID' }
    ],
    sampleResponse: { success: true, data: { status: "processing", progress: 75 } }
  },
  {
    id: 'bulk-import-template',
    name: 'CSV Şablonu İndir',
    method: 'GET',
    endpoint: '/api/bulk-import/template/{tableName}',
    description: 'Belirtilen tablo için CSV şablonu indirir',
    category: 'toplu',
    requiredPermissions: ['data:read'],
    parameters: [
      { name: 'tableName', type: 'string', required: true, description: 'Tablo adı' }
    ],
    sampleResponse: "CSV dosyası indirme"
  },
  {
    id: 'bulk-import-stop',
    name: 'Tüm İmportları Durdur',
    method: 'POST',
    endpoint: '/api/bulk-import/stop-all',
    description: 'Tüm import işlemlerini durdurur',
    category: 'toplu',
    requiredPermissions: ['data:write'],
    sampleResponse: { success: true, message: "Tüm import işlemleri durduruldu" }
  },
  {
    id: 'bulk-import-clear',
    name: 'Import Durumlarını Temizle',
    method: 'DELETE',
    endpoint: '/api/bulk-import/clear-status',
    description: 'Import durumlarını temizler',
    category: 'toplu',
    requiredPermissions: ['data:write'],
    sampleResponse: { success: true, message: "5 import status kaydı temizlendi" }
  },
  // Backend API - Hiyerarşik Sistem
  {
    id: 'backend-login',
    name: 'Backend Kullanıcı Girişi',
    method: 'POST',
    endpoint: '/api/backend/auth/login',
    description: 'Backend kullanıcı girişi yapar',
    category: 'backend',
    requiredPermissions: [],
    sampleRequest: {
      username: "admin",
      password: "password123"
    },
    sampleResponse: { success: true, data: { token: "jwt_token_here", user: {id: 1, username: "admin"} } }
  },
  {
    id: 'backend-assets',
    name: 'Hiyerarşik Asset Listesi',
    method: 'GET',
    endpoint: '/api/backend/assets',
    description: 'Kullanıcının yetkisine göre asset listesi getirir',
    category: 'backend',
    requiredPermissions: ['backend:read'],
    parameters: [
      { name: 'search', type: 'string', required: false, description: 'Arama terimi' },
      { name: 'assignedToMe', type: 'boolean', required: false, description: 'Bana atananlar' }
    ],
    sampleResponse: { success: true, data: [{id: 1, plateNumber: "34ABC123", assignedPersonnel: {}}] }
  },
  {
    id: 'backend-personnel',
    name: 'Hiyerarşik Personel Listesi',
    method: 'GET',
    endpoint: '/api/backend/personnel',
    description: 'Kullanıcının yetkisine göre personel listesi getirir',
    category: 'backend',
    requiredPermissions: ['backend:read'],
    sampleResponse: { success: true, data: [{id: 1, name: "Ahmet Yılmaz", workArea: "İstanbul"}] }
  },
  {
    id: 'backend-fuel-records',
    name: 'Hiyerarşik Yakıt Kayıtları',
    method: 'GET',
    endpoint: '/api/backend/fuel-records',
    description: 'Kullanıcının yetkisine göre yakıt kayıtları getirir',
    category: 'backend',
    requiredPermissions: ['backend:read'],
    sampleResponse: { success: true, data: [{id: 1, assetPlate: "34ABC123", fuelAmount: 50}] }
  }
];

const categoryNames = {
  referans: 'Referans Veriler',
  asset: 'Araç Yönetimi', 
  sirket: 'Şirket Yönetimi',
  personel: 'Personel Yönetimi',
  finansal: 'Finansal İşlemler',
  yakit: 'Yakıt Yönetimi',
  dokuman: 'Döküman Yönetimi',
  toplu: 'Toplu İşlemler',
  backend: 'Backend API'
};

const categoryColors = {
  referans: 'bg-blue-50 text-blue-700 border-blue-200',
  asset: 'bg-green-50 text-green-700 border-green-200',
  sirket: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  personel: 'bg-purple-50 text-purple-700 border-purple-200',
  finansal: 'bg-orange-50 text-orange-700 border-orange-200',
  yakit: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  dokuman: 'bg-pink-50 text-pink-700 border-pink-200',
  toplu: 'bg-red-50 text-red-700 border-red-200',
  backend: 'bg-gray-50 text-gray-700 border-gray-200'
};

const methodColors = {
  GET: 'bg-green-100 text-green-800',
  POST: 'bg-blue-100 text-blue-800',
  PUT: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800'
};

export default function ApiCenter() {
  const [selectedApi, setSelectedApi] = useState<ApiEndpoint | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [requestBody, setRequestBody] = useState("{}");
  const [testResponse, setTestResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['referans']));
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // URL parametrelerini ekle
  const [urlParams, setUrlParams] = useState<Record<string, string>>({});

  const filteredEndpoints = apiEndpoints.filter(endpoint => {
    const matchesCategory = selectedCategory === 'all' || endpoint.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      endpoint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.endpoint.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const categorizedEndpoints = filteredEndpoints.reduce((acc, endpoint) => {
    if (!acc[endpoint.category]) {
      acc[endpoint.category] = [];
    }
    acc[endpoint.category].push(endpoint);
    return acc;
  }, {} as Record<string, ApiEndpoint[]>);

  const toggleCategory = (category: string) => {
    const newOpenCategories = new Set(openCategories);
    if (newOpenCategories.has(category)) {
      newOpenCategories.delete(category);
    } else {
      newOpenCategories.add(category);
    }
    setOpenCategories(newOpenCategories);
  };

  const testApi = async () => {
    if (!selectedApi || !apiKey) {
      toast({
        title: "Hata",
        description: "API seçin ve API anahtarı girin",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // URL'yi oluştur
      let url = selectedApi.endpoint;
      
      // Path parametrelerini değiştir (örn: /api/assets/{id} -> /api/assets/123)
      if (selectedApi.parameters) {
        selectedApi.parameters.forEach(param => {
          if (url.includes(`{${param.name}}`)) {
            const value = urlParams[param.name];
            if (!value && param.required) {
              throw new Error(`Zorunlu parametre eksik: ${param.name}`);
            }
            url = url.replace(`{${param.name}}`, value || '');
          }
        });
      }
      
      // Query parametrelerini ekle (GET için)
      if (selectedApi.method === 'GET' && selectedApi.parameters) {
        const queryParams = selectedApi.parameters.filter(p => !url.includes(p.name));
        const params = new URLSearchParams();
        queryParams.forEach(param => {
          const value = urlParams[param.name];
          if (value) {
            params.append(param.name, value);
          }
        });
        if (params.toString()) {
          url += '?' + params.toString();
        }
      }

      const options: RequestInit = {
        method: selectedApi.method,
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      // POST/PUT için body ekle
      if (['POST', 'PUT'].includes(selectedApi.method)) {
        try {
          // JSON'ı validate et
          JSON.parse(requestBody);
          options.body = requestBody;
        } catch (error) {
          throw new Error('Geçersiz JSON formatı. Lütfen JSON syntax\'ını kontrol edin.');
        }
      }

      // Base URL ekle
      const baseUrl = window.location.origin;
      const fullUrl = `${baseUrl}${url}`;

      const response = await fetch(fullUrl, options);
      
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      setTestResponse({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: data,
        url: fullUrl
      });

      toast({
        title: response.ok ? "Başarılı" : "Hata",
        description: response.ok ? "API başarıyla test edildi" : `HTTP ${response.status}: ${response.statusText}`,
        variant: response.ok ? "default" : "destructive"
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      setTestResponse({
        status: 'ERROR',
        statusText: 'Network Error',
        data: { error: errorMessage }
      });
      
      toast({
        title: "Bağlantı Hatası",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Kopyalandı",
      description: "Panoya kopyalandı"
    });
  };

  const handleApiSelect = (api: ApiEndpoint) => {
    setSelectedApi(api);
    setTestResponse(null);
    setUrlParams({});
    
    // Sample request'i request body'ye yükle
    if (api.sampleRequest) {
      setRequestBody(JSON.stringify(api.sampleRequest, null, 2));
    } else {
      setRequestBody('{}');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="text-white" size={24} />
            </div>
            API Test & Dokümantasyon Merkezi
          </h1>
          <p className="text-gray-600">
            Tüm API endpoint'leri tek yerde test edin ve dokümantasyonu inceleyin
          </p>
        </div>

        <Tabs defaultValue="explorer" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="explorer" className="flex items-center gap-2">
              <Database size={16} />
              API Explorer
            </TabsTrigger>
            <TabsTrigger value="tester" className="flex items-center gap-2">
              <TestTube size={16} />
              API Test
            </TabsTrigger>
            <TabsTrigger value="docs" className="flex items-center gap-2">
              <BookOpen size={16} />
              Dokümantasyon
            </TabsTrigger>
          </TabsList>

          {/* API Explorer Tab */}
          <TabsContent value="explorer" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sol Panel - API Listesi */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">API'ler ({filteredEndpoints.length})</CardTitle>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        138+ Endpoint
                      </Badge>
                    </div>
                    
                    {/* Arama ve Filtre */}
                    <div className="space-y-3">
                      <Input
                        placeholder="API ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="text-sm"
                      />
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Kategori seç" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tüm Kategoriler</SelectItem>
                          {Object.entries(categoryNames).map(([key, name]) => (
                            <SelectItem key={key} value={key}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    <div className="max-h-96 overflow-y-auto">
                      {Object.entries(categorizedEndpoints).map(([category, endpoints]) => (
                        <Collapsible 
                          key={category}
                          open={openCategories.has(category)}
                          onOpenChange={() => toggleCategory(category)}
                        >
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-gray-50 border-b">
                            <div className="flex items-center gap-2">
                              {openCategories.has(category) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              <span className="font-medium text-sm">{categoryNames[category as keyof typeof categoryNames]}</span>
                              <Badge variant="outline" className="text-xs">{endpoints.length}</Badge>
                            </div>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent>
                            {endpoints.map((api) => (
                              <div
                                key={api.id}
                                className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                                  selectedApi?.id === api.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                }`}
                                onClick={() => handleApiSelect(api)}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">{api.name}</span>
                                  <Badge className={`text-xs ${methodColors[api.method]}`}>
                                    {api.method}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600 mb-1">{api.description}</p>
                                <code className="text-xs text-gray-500 bg-gray-100 px-1 rounded">
                                  {api.endpoint}
                                </code>
                              </div>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sağ Panel - API Detayları */}
              <div className="lg:col-span-2">
                {selectedApi ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Badge className={`${methodColors[selectedApi.method]}`}>
                          {selectedApi.method}
                        </Badge>
                        <CardTitle className="text-lg">{selectedApi.name}</CardTitle>
                        <Badge variant="outline" className={categoryColors[selectedApi.category as keyof typeof categoryColors]}>
                          {categoryNames[selectedApi.category as keyof typeof categoryNames]}
                        </Badge>
                      </div>
                      <p className="text-gray-600">{selectedApi.description}</p>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      {/* Endpoint URL */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Endpoint</label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-gray-100 p-2 rounded text-sm font-mono">
                            {selectedApi.endpoint}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(selectedApi.endpoint)}
                          >
                            <Copy size={14} />
                          </Button>
                        </div>
                      </div>

                      {/* Parametreler */}
                      {selectedApi.parameters && selectedApi.parameters.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium mb-2">Parametreler</label>
                          <div className="space-y-2">
                            {selectedApi.parameters.map((param) => (
                              <div key={param.name} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                <code className="text-sm font-mono text-blue-600">{param.name}</code>
                                <Badge variant={param.required ? "default" : "secondary"} className="text-xs">
                                  {param.type}
                                </Badge>
                                {param.required && (
                                  <Badge variant="destructive" className="text-xs">
                                    Gerekli
                                  </Badge>
                                )}
                                <span className="text-sm text-gray-600 ml-auto">{param.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* İzinler */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Gerekli İzinler</label>
                        <div className="flex flex-wrap gap-1">
                          {selectedApi.requiredPermissions.map((permission) => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* İstek Yapısı (POST/PUT için) */}
                      {selectedApi.requestStructure && ['POST', 'PUT'].includes(selectedApi.method) && (
                        <div>
                          <label className="block text-sm font-medium mb-2">İstek Yapısı</label>
                          <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left font-medium">Alan</th>
                                  <th className="px-3 py-2 text-left font-medium">Tip</th>
                                  <th className="px-3 py-2 text-left font-medium">Zorunlu</th>
                                  <th className="px-3 py-2 text-left font-medium">Açıklama</th>
                                  <th className="px-3 py-2 text-left font-medium">Örnek</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {selectedApi.requestStructure.map((field) => (
                                  <tr key={field.field} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 font-mono text-blue-600">{field.field}</td>
                                    <td className="px-3 py-2">
                                      <Badge variant="outline" className="text-xs">
                                        {field.type}
                                      </Badge>
                                    </td>
                                    <td className="px-3 py-2">
                                      {field.required ? (
                                        <Badge variant="destructive" className="text-xs">Evet</Badge>
                                      ) : (
                                        <Badge variant="secondary" className="text-xs">Hayır</Badge>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-gray-600">{field.description}</td>
                                    <td className="px-3 py-2 font-mono text-xs text-gray-500">
                                      {field.example !== undefined ? JSON.stringify(field.example) : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Örnek İstek (POST/PUT için) */}
                      {selectedApi.sampleRequest && ['POST', 'PUT'].includes(selectedApi.method) && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium">Örnek İstek</label>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(JSON.stringify(selectedApi.sampleRequest, null, 2))}
                              className="text-xs"
                            >
                              <Copy size={12} className="mr-1" />
                              Kopyala
                            </Button>
                          </div>
                          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                            {JSON.stringify(selectedApi.sampleRequest, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Örnek Yanıt */}
                      {selectedApi.sampleResponse && (
                        <div>
                          <label className="block text-sm font-medium mb-2">Örnek Yanıt</label>
                          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                            {JSON.stringify(selectedApi.sampleResponse, null, 2)}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="flex items-center justify-center h-64">
                      <div className="text-center text-gray-500">
                        <Database size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Test etmek için bir API seçin</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* API Test Tab */}
          <TabsContent value="tester" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sol Panel - Test Ayarları */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube size={20} />
                    API Test Ayarları
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* API Key */}
                  <div>
                    <label className="block text-sm font-medium mb-2">API Anahtarı</label>
                    <div className="space-y-1">
                      <Input
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="ak_prod2025_rwba6dj1sw"
                        className="font-mono text-sm"
                        type="password"
                      />
                      <p className="text-xs text-gray-500">
                        Format: ak_[env][year]_[random] (örn: ak_prod2025_rwba6dj1sw)
                      </p>
                    </div>
                  </div>

                  {/* API Seçimi */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Test Edilecek API</label>
                    <Select 
                      value={selectedApi?.id || ""} 
                      onValueChange={(value) => {
                        const api = apiEndpoints.find(a => a.id === value);
                        if (api) handleApiSelect(api);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="API seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categorizedEndpoints).map(([category, endpoints]) => (
                          <div key={category}>
                            <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {categoryNames[category as keyof typeof categoryNames]}
                            </div>
                            {endpoints.map((api) => (
                              <SelectItem key={api.id} value={api.id}>
                                <div className="flex items-center gap-2">
                                  <Badge className={`text-xs ${methodColors[api.method]}`}>
                                    {api.method}
                                  </Badge>
                                  {api.name}
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Parametreler (Path ve Query) */}
                  {selectedApi?.parameters && selectedApi.parameters.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {selectedApi.endpoint.includes('{') ? 'Path ve Query Parametreleri' : 'Parametreler'}
                      </label>
                      <div className="space-y-2">
                        {selectedApi.parameters.map((param) => {
                          const isPathParam = selectedApi.endpoint.includes(`{${param.name}}`);
                          return (
                            <div key={param.name}>
                              <label className="block text-xs text-gray-600 mb-1">
                                {param.name} 
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {param.type}
                                </Badge>
                                {isPathParam && (
                                  <Badge variant="secondary" className="ml-1 text-xs">
                                    Path
                                  </Badge>
                                )}
                                {param.required && <span className="text-red-500 ml-1">*</span>}
                              </label>
                              <Input
                                placeholder={param.description}
                                value={urlParams[param.name] || ''}
                                onChange={(e) => setUrlParams({...urlParams, [param.name]: e.target.value})}
                                className="text-sm"
                                required={param.required}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Request Yapısı Gösterimi (POST/PUT için) */}
                  {selectedApi && selectedApi.requestStructure && ['POST', 'PUT'].includes(selectedApi.method) && (
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium mb-2 hover:text-blue-600">
                        <span>İstek Yapısını Görüntüle</span>
                        <ChevronDown size={16} />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mb-4 border rounded-lg overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-2 py-1 text-left">Alan</th>
                                <th className="px-2 py-1 text-left">Tip</th>
                                <th className="px-2 py-1 text-left">Zorunlu</th>
                                <th className="px-2 py-1 text-left">Açıklama</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {selectedApi.requestStructure.map((field) => (
                                <tr key={field.field} className="hover:bg-gray-50">
                                  <td className="px-2 py-1 font-mono text-blue-600">{field.field}</td>
                                  <td className="px-2 py-1">
                                    <Badge variant="outline" className="text-xs">
                                      {field.type}
                                    </Badge>
                                  </td>
                                  <td className="px-2 py-1">
                                    {field.required ? (
                                      <span className="text-red-500">●</span>
                                    ) : (
                                      <span className="text-gray-400">○</span>
                                    )}
                                  </td>
                                  <td className="px-2 py-1 text-gray-600">{field.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Request Body (POST/PUT için) */}
                  {selectedApi && ['POST', 'PUT'].includes(selectedApi.method) && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Request Body (JSON)</label>
                      <Textarea
                        value={requestBody}
                        onChange={(e) => setRequestBody(e.target.value)}
                        className="font-mono text-sm min-h-32"
                        placeholder="JSON verisi girin"
                      />
                    </div>
                  )}

                  {/* Test Butonu */}
                  <Button 
                    onClick={testApi} 
                    disabled={!selectedApi || !apiKey || isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Test Ediliyor...
                      </>
                    ) : (
                      <>
                        <Play size={16} className="mr-2" />
                        API'yi Test Et
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Sağ Panel - Test Sonucu */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code size={20} />
                    Test Sonucu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {testResponse ? (
                    <div className="space-y-4">
                      {/* Status */}
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={testResponse.status === 200 ? "default" : testResponse.status === 'ERROR' ? "destructive" : "secondary"}
                          className="text-sm"
                        >
                          {testResponse.status} {testResponse.statusText}
                        </Badge>
                        {testResponse.status === 200 ? (
                          <CheckCircle size={16} className="text-green-500" />
                        ) : (
                          <AlertCircle size={16} className="text-red-500" />
                        )}
                      </div>

                      {/* Test URL */}
                      {testResponse.url && (
                        <div>
                          <label className="text-sm font-medium mb-1 block">Test URL'si</label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 bg-gray-100 p-2 rounded text-xs font-mono truncate">
                              {testResponse.url}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(testResponse.url)}
                            >
                              <Copy size={12} />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Response Headers */}
                      {testResponse.headers && (
                        <Collapsible>
                          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-blue-600">
                            <ChevronRight size={16} />
                            Response Headers
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="mt-2 bg-gray-50 p-3 rounded text-xs font-mono">
                              {Object.entries(testResponse.headers).map(([key, value]) => (
                                <div key={key} className="flex gap-2">
                                  <span className="font-semibold">{key}:</span>
                                  <span className="text-gray-600">{value as string}</span>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {/* Response Data */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium">Yanıt Verisi</label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(
                              typeof testResponse.data === 'string' 
                                ? testResponse.data 
                                : JSON.stringify(testResponse.data, null, 2)
                            )}
                          >
                            <Copy size={14} />
                          </Button>
                        </div>
                        <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96 border">
                          {typeof testResponse.data === 'string' 
                            ? testResponse.data 
                            : JSON.stringify(testResponse.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <div className="text-center">
                        <TestTube size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Test sonucu burada görünecek</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Dokümantasyon Tab */}
          <TabsContent value="docs" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Swagger Dokümantasyonu */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen size={20} />
                    Swagger API Dokümantasyonu
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Tam API dokümantasyonu için Swagger UI'yi kullanın
                  </p>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full flex items-center gap-2"
                    onClick={() => window.open('/api/docs', '_blank')}
                  >
                    <ExternalLink size={16} />
                    Swagger UI'yi Aç
                  </Button>
                </CardContent>
              </Card>

              {/* API İstatistikleri */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database size={20} />
                    API İstatistikleri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">138+</div>
                      <div className="text-sm text-blue-600">Toplam API</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">{apiEndpoints.length}</div>
                      <div className="text-sm text-green-600">Dokümante API</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded">
                      <div className="text-2xl font-bold text-purple-600">{Object.keys(categoryNames).length}</div>
                      <div className="text-sm text-purple-600">Kategori</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded">
                      <div className="text-2xl font-bold text-orange-600">21</div>
                      <div className="text-sm text-orange-600">İzin Tipi</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Kategoriler Özeti */}
            <Card>
              <CardHeader>
                <CardTitle>API Kategorileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(categoryNames).map(([key, name]) => {
                    const count = apiEndpoints.filter(api => api.category === key).length;
                    return (
                      <div key={key} className={`p-4 rounded-lg border ${categoryColors[key as keyof typeof categoryColors]}`}>
                        <h3 className="font-medium mb-2">{name}</h3>
                        <p className="text-sm opacity-75">{count} API endpoint</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}