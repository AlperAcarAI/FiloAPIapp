import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Play, Copy, CheckCircle, XCircle, Clock, FileCode } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface ApiEndpoint {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: string;
  category: string;
  dataCount?: string;
  filterParams?: string[];
  filterExamples?: string[];
}

const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id: "getCities",
    name: "Şehirler API",
    description: "Türkiye'deki 81 şehrin listesini döndürür",
    endpoint: "/api/secure/getCities",
    method: "GET",
    category: "Referans Veriler",
    dataCount: "81 şehir",
    filterParams: ["search", "limit", "offset", "sortBy", "sortOrder"],
    filterExamples: [
      "?search=ist&limit=5",
      "?sortBy=name&sortOrder=desc&limit=10",
      "?offset=20&limit=5"
    ]
  },
  {
    id: "getPenaltyTypes", 
    name: "Ceza Türleri API",
    description: "301 trafik cezası türünün detaylı listesini döndürür",
    endpoint: "/api/secure/getPenaltyTypes",
    method: "GET",
    category: "Referans Veriler",
    dataCount: "301 ceza türü",
    filterParams: ["search", "minAmount", "maxAmount", "activeOnly", "limit", "offset", "sortBy", "sortOrder"],
    filterExamples: [
      "?search=hız&limit=5",
      "?minAmount=500&maxAmount=1000",
      "?sortBy=amountCents&sortOrder=desc&limit=10",
      "?activeOnly=true&limit=20"
    ]
  },
  {
    id: "getCountries",
    name: "Ülkeler API", 
    description: "Dünya ülkeleri ve telefon kodlarının listesini döndürür",
    endpoint: "/api/secure/getCountries",
    method: "GET",
    category: "Referans Veriler",
    dataCount: "195 ülke",
    filterParams: ["search", "phoneCode", "limit", "offset", "sortBy", "sortOrder"],
    filterExamples: [
      "?search=Türk&limit=5",
      "?phoneCode=+90",
      "?sortBy=phoneCode&sortOrder=asc&limit=10"
    ]
  },
  {
    id: "getPolicyTypes",
    name: "Poliçe Türleri API",
    description: "Sigorta poliçe türlerinin listesini döndürür", 
    endpoint: "/api/secure/getPolicyTypes",
    method: "GET",
    category: "Referans Veriler",
    dataCount: "7 poliçe türü",
    filterParams: ["search", "activeOnly", "limit", "offset", "sortBy", "sortOrder"],
    filterExamples: [
      "?search=Kasko&limit=3",
      "?activeOnly=true&sortBy=name",
      "?limit=5&sortOrder=desc"
    ]
  },
  {
    id: "getPaymentMethods",
    name: "Ödeme Yöntemleri API",
    description: "Ödeme yöntemlerinin listesini döndürür",
    endpoint: "/api/secure/getPaymentMethods", 
    method: "GET",
    category: "Referans Veriler",
    dataCount: "7 ödeme yöntemi",
    filterParams: ["search", "activeOnly", "limit", "offset", "sortBy", "sortOrder"],
    filterExamples: [
      "?search=Kredi&limit=2",
      "?activeOnly=true&sortBy=name",
      "?limit=3&sortOrder=asc"
    ]
  },
  {
    id: "getMaintenanceTypes",
    name: "Bakım Türleri API",
    description: "Araç bakım türlerinin listesini döndürür",
    endpoint: "/api/secure/getMaintenanceTypes",
    method: "GET", 
    category: "Referans Veriler",
    dataCount: "7 bakım türü",
    filterParams: ["search", "activeOnly", "limit", "offset", "sortBy", "sortOrder"],
    filterExamples: [
      "?search=motor&limit=3",
      "?activeOnly=true&sortBy=name",
      "?limit=5&sortOrder=desc"
    ]
  },
  {
    id: "addPolicyType",
    name: "Poliçe Tipi Ekleme API",
    description: "Yeni bir poliçe tipi ekler. Aynı isimde varsa uyarı döndürür",
    endpoint: "/api/secure/addPolicyType",
    method: "POST",
    category: "Veri İşlemleri",
    dataCount: "Yeni kayıt"
  },
  {
    id: "addPenaltyType",
    name: "Ceza Türü Ekleme API",
    description: "Yeni bir trafik cezası türü ekler. Detaylı ceza bilgileri ile",
    endpoint: "/api/secure/addPenaltyType",
    method: "POST",
    category: "Veri İşlemleri",
    dataCount: "Yeni ceza türü"
  },
  {
    id: "updatePenaltyType",
    name: "Ceza Türü Güncelleme API",
    description: "Mevcut trafik cezası türünü günceller. ID ile belirlenen kaydı düzenler",
    endpoint: "/api/secure/updatePenaltyType/1",
    method: "PUT",
    category: "Veri İşlemleri", 
    dataCount: "Güncelleme"
  },
  {
    id: "addMaintenanceType",
    name: "Bakım Türü Ekleme API",
    description: "Yeni bir bakım türü ekler. Araç bakım kategorileri için kullanılır",
    endpoint: "/api/secure/addMaintenanceType",
    method: "POST",
    category: "Veri İşlemleri",
    dataCount: "Yeni bakım türü"
  },
  {
    id: "addPersonnel",
    name: "Personel Ekleme API",
    description: "Yeni personel ekler. TC numarası kontrolü ile mükerrer kayıt engellenir",
    endpoint: "/api/secure/addPersonnel",
    method: "POST",
    category: "Veri İşlemleri",
    dataCount: "Yeni personel"
  },
  {
    id: "addWorkArea",
    name: "Çalışma Alanı Ekleme API",
    description: "Yeni çalışma alanı ekler. Aynı şehirde aynı isimde alan kontrolü yapar",
    endpoint: "/api/secure/addWorkArea",
    method: "POST",
    category: "Veri İşlemleri",
    dataCount: "Yeni çalışma alanı"
  },
  {
    id: "updateWorkArea",
    name: "Çalışma Alanı Güncelleme API",
    description: "Mevcut çalışma alanı bilgilerini günceller",
    endpoint: "/api/secure/updateWorkArea/1",
    method: "PUT",
    category: "Veri İşlemleri",
    dataCount: "Güncelleme"
  },
  {
    id: "getOwnershipTypes",
    name: "Sahiplik Türleri API",
    description: "Araç sahiplik türlerinin listesini döndürür (Şirket Mülkiyeti, Kiralık, Leasing vb.)",
    endpoint: "/api/secure/getOwnershipTypes",
    method: "GET",
    category: "Referans Veriler",
    dataCount: "4 sahiplik türü"
  },
  {
    id: "addOwnershipType",
    name: "Sahiplik Türü Ekleme API",
    description: "Yeni sahiplik türü ekler. Duplicate kontrol ile aynı isimde tür engellenir",
    endpoint: "/api/secure/addOwnershipType",
    method: "POST",
    category: "Veri İşlemleri",
    dataCount: "Yeni sahiplik türü"
  },
  {
    id: "getPersonnelPositions",
    name: "Personel Pozisyonları API", 
    description: "Personel pozisyonlarının listesini döndürür (Filo Yöneticisi, Şoför, Teknisyen vb.)",
    endpoint: "/api/secure/getPersonnelPositions",
    method: "GET",
    category: "Referans Veriler",
    dataCount: "8 pozisyon türü"
  },
  {
    id: "addPersonnelPosition",
    name: "Personel Pozisyonu Ekleme API",
    description: "Yeni personel pozisyonu ekler. Açıklama alanı ile detaylı tanım yapılabilir",
    endpoint: "/api/secure/addPersonnelPosition",
    method: "POST",
    category: "Veri İşlemleri",
    dataCount: "Yeni pozisyon"
  },
  {
    id: "getDocTypes",
    name: "Doküman Türleri API",
    description: "Sistemde tanımlı doküman türlerinin listesini döndürür",
    endpoint: "/api/secure/getDocTypes",
    method: "GET",
    category: "Dosya İşlemleri",
    dataCount: "12 doküman türü"
  },
  {
    id: "documentsUpload",
    name: "Dosya Yükleme API",
    description: "Multipart/form-data ile dosya yükleme işlemi. PDF, JPG, PNG, DOC, XLS, TXT formatları desteklenir (max 50MB)",
    endpoint: "/api/secure/documents/upload",
    method: "POST",
    category: "Dosya İşlemleri",
    dataCount: "Dosya yükleme"
  },
  {
    id: "documentsAsset",
    name: "Asset Dokümanları Listesi",
    description: "Belirli bir asset'e ait tüm dokümanları listeler",
    endpoint: "/api/secure/documents/asset/1",
    method: "GET",
    category: "Dosya İşlemleri",
    dataCount: "Asset dokümanları"
  },
  {
    id: "documentsPersonnel",
    name: "Personnel Dokümanları Listesi",
    description: "Belirli bir personele ait tüm dokümanları listeler",
    endpoint: "/api/secure/documents/personnel/1",
    method: "GET",
    category: "Dosya İşlemleri",
    dataCount: "Personnel dokümanları"
  },
  {
    id: "getAssetsPersonnelAssignments",
    name: "Araç-Personel Atamaları Listesi",
    description: "Araç ve personel arasındaki atama ilişkilerini listeler. Filtreleme destekler.",
    endpoint: "/api/secure/getAssetsPersonnelAssignments",
    method: "GET",
    category: "Asset Yönetimi",
    dataCount: "Atama kayıtları"
  },
  {
    id: "addAssetsPersonnelAssignment",
    name: "Araç-Personel Ataması Ekleme",
    description: "Yeni araç-personel ataması ekler. Tarih çakışması kontrolü yapar.",
    endpoint: "/api/secure/addAssetsPersonnelAssignment",
    method: "POST",
    category: "Veri İşlemleri",
    dataCount: "Yeni atama"
  },
  {
    id: "updateAssetsPersonnelAssignment",
    name: "Araç-Personel Ataması Güncelleme",
    description: "Mevcut atama bilgilerini günceller",
    endpoint: "/api/secure/updateAssetsPersonnelAssignment/1",
    method: "PUT",
    category: "Veri İşlemleri",
    dataCount: "Güncelleme"
  },
  {
    id: "deleteAssetsPersonnelAssignment",
    name: "Araç-Personel Ataması Silme",
    description: "Atama kaydını siler (soft delete)",
    endpoint: "/api/secure/deleteAssetsPersonnelAssignment/1",
    method: "DELETE",
    category: "Veri İşlemleri",
    dataCount: "Silme"
  },
  {
    id: "getPersonnel",
    name: "Personel Listesi",
    description: "Sistemdeki tüm personel kayıtlarını listeler. Aktif/pasif filtreleme destekler.",
    endpoint: "/api/secure/getPersonnel",
    method: "GET",
    category: "Personel Yönetimi",
    dataCount: "Personel kayıtları"
  },
  {
    id: "updatePersonnel",
    name: "Personel Güncelleme",
    description: "Mevcut personel bilgilerini günceller. TC Kimlik kontrolü yapar.",
    endpoint: "/api/secure/updatePersonnel/1",
    method: "PUT",
    category: "Veri İşlemleri",
    dataCount: "Güncelleme"
  },
  {
    id: "deletePersonnel",
    name: "Personel Silme",
    description: "Personel kaydını siler (soft delete)",
    endpoint: "/api/secure/deletePersonnel/1",
    method: "DELETE",
    category: "Veri İşlemleri",
    dataCount: "Silme"
  },
  {
    id: "getWorkAreas",
    name: "Çalışma Alanları Listesi",
    description: "Sistemdeki tüm çalışma alanlarını listeler",
    endpoint: "/api/secure/getWorkAreas",
    method: "GET",
    category: "Çalışma Alanı Yönetimi",
    dataCount: "Çalışma alanları"
  },
  {
    id: "deleteWorkArea",
    name: "Çalışma Alanı Silme",
    description: "Çalışma alanı kaydını siler (soft delete)",
    endpoint: "/api/secure/deleteWorkArea/1",
    method: "DELETE",
    category: "Veri İşlemleri",
    dataCount: "Silme"
  },
  {
    id: "addCarBrand",
    name: "Araç Markası Ekleme",
    description: "Yeni araç markası ekler. Duplicate kontrolü yapar.",
    endpoint: "/api/secure/addCarBrand",
    method: "POST",
    category: "Veri İşlemleri",
    dataCount: "Yeni marka"
  },
  {
    id: "updateCarBrand",
    name: "Araç Markası Güncelleme",
    description: "Mevcut araç markasını günceller",
    endpoint: "/api/secure/updateCarBrand/1",
    method: "PUT",
    category: "Veri İşlemleri",
    dataCount: "Güncelleme"
  },
  {
    id: "deleteCarBrand",
    name: "Araç Markası Silme",
    description: "Araç markasını siler (soft delete)",
    endpoint: "/api/secure/deleteCarBrand/1",
    method: "DELETE",
    category: "Veri İşlemleri",
    dataCount: "Silme"
  },
  {
    id: "updateCarModel",
    name: "Araç Modeli Güncelleme",
    description: "Mevcut araç modelini günceller",
    endpoint: "/api/secure/updateCarModel/1",
    method: "PUT",
    category: "Veri İşlemleri",
    dataCount: "Güncelleme"
  },
  {
    id: "deleteCarModel",
    name: "Araç Modeli Silme",
    description: "Araç modelini siler (soft delete)",
    endpoint: "/api/secure/deleteCarModel/1",
    method: "DELETE",
    category: "Veri İşlemleri",
    dataCount: "Silme"
  },
  {
    id: "updateOwnershipType",
    name: "Sahiplik Türü Güncelleme",
    description: "Mevcut sahiplik türünü günceller",
    endpoint: "/api/secure/updateOwnershipType/1",
    method: "PUT",
    category: "Veri İşlemleri",
    dataCount: "Güncelleme"
  },
  {
    id: "deleteOwnershipType",
    name: "Sahiplik Türü Silme",
    description: "Sahiplik türünü siler (soft delete)",
    endpoint: "/api/secure/deleteOwnershipType/1",
    method: "DELETE",
    category: "Veri İşlemleri",
    dataCount: "Silme"
  },
  {
    id: "updatePersonnelPosition",
    name: "Personel Pozisyonu Güncelleme",
    description: "Mevcut personel pozisyonunu günceller",
    endpoint: "/api/secure/updatePersonnelPosition/1",
    method: "PUT",
    category: "Veri İşlemleri",
    dataCount: "Güncelleme"
  },
  {
    id: "deletePersonnelPosition",
    name: "Personel Pozisyonu Silme",
    description: "Personel pozisyonunu siler (soft delete)",
    endpoint: "/api/secure/deletePersonnelPosition/1",
    method: "DELETE",
    category: "Veri İşlemleri",
    dataCount: "Silme"
  },
  {
    id: "updatePolicyType",
    name: "Poliçe Türü Güncelleme",
    description: "Mevcut poliçe türünü günceller",
    endpoint: "/api/secure/updatePolicyType/1",
    method: "PUT",
    category: "Veri İşlemleri",
    dataCount: "Güncelleme"
  },
  {
    id: "deletePolicyType",
    name: "Poliçe Türü Silme",
    description: "Poliçe türünü siler (soft delete)",
    endpoint: "/api/secure/deletePolicyType/1",
    method: "DELETE",
    category: "Veri İşlemleri",
    dataCount: "Silme"
  },
  {
    id: "updateMaintenanceType",
    name: "Bakım Türü Güncelleme",
    description: "Mevcut bakım türünü günceller",
    endpoint: "/api/secure/updateMaintenanceType/1",
    method: "PUT",
    category: "Veri İşlemleri",
    dataCount: "Güncelleme"
  },
  {
    id: "deleteMaintenanceType",
    name: "Bakım Türü Silme",
    description: "Bakım türünü siler (soft delete)",
    endpoint: "/api/secure/deleteMaintenanceType/1",
    method: "DELETE",
    category: "Veri İşlemleri",
    dataCount: "Silme"
  },
  {
    id: "deletePenaltyType",
    name: "Ceza Türü Silme",
    description: "Ceza türünü siler (soft delete)",
    endpoint: "/api/secure/deletePenaltyType/1",
    method: "DELETE",
    category: "Veri İşlemleri",
    dataCount: "Silme"
  },
  {
    id: "addCity",
    name: "Şehir Ekleme",
    description: "Yeni şehir ekler. Duplicate kontrolü yapar.",
    endpoint: "/api/secure/addCity",
    method: "POST",
    category: "Admin İşlemleri",
    dataCount: "Yeni şehir"
  },
  {
    id: "updateCity",
    name: "Şehir Güncelleme",
    description: "Mevcut şehir bilgilerini günceller",
    endpoint: "/api/secure/updateCity/1",
    method: "PUT",
    category: "Admin İşlemleri",
    dataCount: "Güncelleme"
  },
  {
    id: "deleteCity",
    name: "Şehir Silme",
    description: "Şehir kaydını siler (soft delete)",
    endpoint: "/api/secure/deleteCity/1",
    method: "DELETE",
    category: "Admin İşlemleri",
    dataCount: "Silme"
  },
  {
    id: "addCountry",
    name: "Ülke Ekleme",
    description: "Yeni ülke ekler. Duplicate kontrolü yapar.",
    endpoint: "/api/secure/addCountry",
    method: "POST",
    category: "Admin İşlemleri",
    dataCount: "Yeni ülke"
  },
  {
    id: "updateCountry",
    name: "Ülke Güncelleme",
    description: "Mevcut ülke bilgilerini günceller",
    endpoint: "/api/secure/updateCountry/1",
    method: "PUT",
    category: "Admin İşlemleri",
    dataCount: "Güncelleme"
  },
  {
    id: "deleteCountry",
    name: "Ülke Silme",
    description: "Ülke kaydını siler (soft delete)",
    endpoint: "/api/secure/deleteCountry/1",
    method: "DELETE",
    category: "Admin İşlemleri",
    dataCount: "Silme"
  },
  {
    id: "addCarType",
    name: "Araç Tipi Ekleme",
    description: "Yeni araç tipi ekler. Duplicate kontrolü yapar.",
    endpoint: "/api/secure/addCarType",
    method: "POST",
    category: "Veri İşlemleri",
    dataCount: "Yeni araç tipi"
  },
  {
    id: "updateCarType",
    name: "Araç Tipi Güncelleme",
    description: "Mevcut araç tipini günceller",
    endpoint: "/api/secure/updateCarType/1",
    method: "PUT",
    category: "Veri İşlemleri",
    dataCount: "Güncelleme"
  },
  {
    id: "deleteCarType",
    name: "Araç Tipi Silme",
    description: "Araç tipini siler (soft delete)",
    endpoint: "/api/secure/deleteCarType/1",
    method: "DELETE",
    category: "Veri İşlemleri",
    dataCount: "Silme"
  },
  {
    id: "addPaymentMethod",
    name: "Ödeme Yöntemi Ekleme",
    description: "Yeni ödeme yöntemi ekler. Duplicate kontrolü yapar.",
    endpoint: "/api/secure/addPaymentMethod",
    method: "POST",
    category: "Veri İşlemleri",
    dataCount: "Yeni ödeme yöntemi"
  },
  {
    id: "updatePaymentMethod",
    name: "Ödeme Yöntemi Güncelleme",
    description: "Mevcut ödeme yöntemini günceller",
    endpoint: "/api/secure/updatePaymentMethod/1",
    method: "PUT",
    category: "Veri İşlemleri",
    dataCount: "Güncelleme"
  },
  {
    id: "deletePaymentMethod",
    name: "Ödeme Yöntemi Silme",
    description: "Ödeme yöntemini siler (soft delete)",
    endpoint: "/api/secure/deletePaymentMethod/1",
    method: "DELETE",
    category: "Veri İşlemleri",
    dataCount: "Silme"
  }
];

export default function ApiTest() {
  const [selectedApi, setSelectedApi] = useState<ApiEndpoint | null>(null);
  const [apiKey, setApiKey] = useState("ak_demo2025key");
  const [requestBody, setRequestBody] = useState("{\n  \"name\": \"Yeni Poliçe Tipi\",\n  \"isActive\": true\n}");
  
  // Filtreleme parametreleri için state'ler
  const [filterParams, setFilterParams] = useState({
    search: "",
    limit: "",
    offset: "",
    sortBy: "",
    sortOrder: "asc",
    activeOnly: "",
    minAmount: "",
    maxAmount: "",
    phoneCode: ""
  });

  // API'ye göre default request body'yi ayarla
  const getDefaultRequestBody = (apiId: string) => {
    switch (apiId) {
      case 'addPolicyType':
        return JSON.stringify({
          name: "Yeni Poliçe Tipi",
          isActive: true
        }, null, 2);
      case 'addPenaltyType':
        return JSON.stringify({
          name: "Test Ceza Türü",
          description: "Test amaçlı oluşturulan ceza türü",
          penaltyScore: 10,
          amountCents: 50000,
          discountedAmountCents: 37500,
          isActive: true
        }, null, 2);
      case 'updatePenaltyType':
        return JSON.stringify({
          name: "Güncellenmiş Ceza Türü",
          description: "Güncelleme testi",
          penaltyScore: 15,
          amountCents: 75000,
          discountedAmountCents: 56250
        }, null, 2);
      case 'addMaintenanceType':
        return JSON.stringify({
          name: "Test Bakım Türü",
          isActive: true
        }, null, 2);
      case 'addPersonnel':
        return JSON.stringify({
          tcNo: "12345678901",
          name: "Ahmet",
          surname: "Yılmaz",
          birthdate: "1990-01-01",
          phoneNo: "05551234567",
          status: "aktif",
          isActive: true
        }, null, 2);
      case 'addWorkArea':
        return JSON.stringify({
          cityId: 1,
          name: "Merkez Ofis",
          address: "Atatürk Caddesi No:123",
          managerId: 1,
          startDate: "2025-01-01",
          endDate: "2025-12-31",
          isActive: true
        }, null, 2);
      case 'updateWorkArea':
        return JSON.stringify({
          name: "Güncellenen Çalışma Alanı",
          address: "Yeni Adres",
          isActive: false
        }, null, 2);
      case 'addOwnershipType':
        return JSON.stringify({
          name: "Operasyonel Kiralama",
          isActive: true
        }, null, 2);
      case 'addPersonnelPosition':
        return JSON.stringify({
          name: "Araç Bakım Teknisyeni",
          description: "Araç bakım ve onarım işlemlerinden sorumlu teknik personel",
          isActive: true
        }, null, 2);
      case 'addAssetsPersonnelAssignment':
        return JSON.stringify({
          assetId: 1,
          personnelId: 1,
          startDate: "2025-01-01",
          endDate: "2025-12-31",
          isActive: true
        }, null, 2);
      case 'updateAssetsPersonnelAssignment':
        return JSON.stringify({
          endDate: "2025-06-30",
          isActive: false
        }, null, 2);
      case 'updatePersonnel':
        return JSON.stringify({
          name: "Ahmet",
          surname: "Yılmaz",
          phone: "+90 532 123 4567",
          email: "ahmet.yilmaz@sirket.com",
          isActive: true
        }, null, 2);
      case 'addCarBrand':
        return JSON.stringify({
          name: "Tesla",
          isActive: true
        }, null, 2);
      case 'updateCarBrand':
        return JSON.stringify({
          name: "Tesla Motors",
          isActive: true
        }, null, 2);
      case 'updateCarModel':
        return JSON.stringify({
          name: "Model S Plaid",
          capacity: 5,
          detail: "Yüksek performanslı elektrikli sedan"
        }, null, 2);
      case 'updateOwnershipType':
        return JSON.stringify({
          name: "Operasyonel Kiralama Plus",
          isActive: true
        }, null, 2);
      case 'updatePersonnelPosition':
        return JSON.stringify({
          name: "Kıdemli Araç Bakım Teknisyeni",
          description: "Araç bakım ve onarım işlemlerinde uzman teknik personel"
        }, null, 2);
      case 'updatePolicyType':
        return JSON.stringify({
          name: "Kasko Plus",
          isActive: true
        }, null, 2);
      case 'updateMaintenanceType':
        return JSON.stringify({
          name: "Genel Kontrol Plus",
          isActive: true
        }, null, 2);
      case 'addCity':
        return JSON.stringify({
          name: "Yalova",
          plateNumber: "77",
          isActive: true
        }, null, 2);
      case 'updateCity':
        return JSON.stringify({
          name: "Yalova Merkez",
          plateNumber: "77"
        }, null, 2);
      case 'addCountry':
        return JSON.stringify({
          name: "Azerbaycan",
          phoneCode: "+994",
          isActive: true
        }, null, 2);
      case 'updateCountry':
        return JSON.stringify({
          name: "Azerbaycan Cumhuriyeti",
          phoneCode: "+994"
        }, null, 2);
      case 'addCarType':
        return JSON.stringify({
          name: "Elektrikli SUV",
          isActive: true
        }, null, 2);
      case 'updateCarType':
        return JSON.stringify({
          name: "Elektrikli SUV Plus",
          isActive: true
        }, null, 2);
      case 'addPaymentMethod':
        return JSON.stringify({
          name: "Kripto Para",
          isActive: true
        }, null, 2);
      case 'updatePaymentMethod':
        return JSON.stringify({
          name: "Kripto Para (Bitcoin)",
          isActive: true
        }, null, 2);
      case 'documentsUpload':
        return `Form Data Parametreleri:
{
  "assetId": "1",
  "docTypeId": "15", 
  "description": "Test dokümanı API'den",
  "files": "Dosyalar seçilecek (PDF, JPG, PNG, DOC, XLS, TXT)"
}

NOT: Bu API multipart/form-data kullanır, normal JSON değil.
Swagger dokümantasyonundan veya /documents sayfasından test edebilirsiniz.`;
      default:
        return "{}";
    }
  };
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Filtreleme parametrelerini URL query string'e çevir
  const buildFilteredUrl = (endpoint: ApiEndpoint) => {
    if (endpoint.method !== 'GET') return `${window.location.origin}${endpoint.endpoint}`;
    
    const params = new URLSearchParams();
    
    if (filterParams.search && filterParams.search.trim()) {
      params.append('search', filterParams.search.trim());
    }
    if (filterParams.limit && filterParams.limit.trim()) {
      params.append('limit', filterParams.limit.trim());
    }
    if (filterParams.offset && filterParams.offset.trim()) {
      params.append('offset', filterParams.offset.trim());
    }
    if (filterParams.sortBy && filterParams.sortBy.trim()) {
      params.append('sortBy', filterParams.sortBy.trim());
    }
    if (filterParams.sortOrder !== 'asc') {
      params.append('sortOrder', filterParams.sortOrder);
    }
    if (filterParams.activeOnly && filterParams.activeOnly !== '') {
      params.append('activeOnly', filterParams.activeOnly);
    }
    if (filterParams.minAmount && filterParams.minAmount.trim()) {
      params.append('minAmount', filterParams.minAmount.trim());
    }
    if (filterParams.maxAmount && filterParams.maxAmount.trim()) {
      params.append('maxAmount', filterParams.maxAmount.trim());
    }
    if (filterParams.phoneCode && filterParams.phoneCode.trim()) {
      params.append('phoneCode', filterParams.phoneCode.trim());
    }
    
    const queryString = params.toString();
    return `${window.location.origin}${endpoint.endpoint}${queryString ? '?' + queryString : ''}`;
  };

  const testApi = async (endpoint: ApiEndpoint) => {
    if (!apiKey.trim()) {
      toast({
        title: "Hata!",
        description: "API anahtarı gerekli",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Document upload API için özel işleme
      if (endpoint.id === 'documentsUpload') {
        toast({
          title: "Bilgi",
          description: "Document upload API'si multipart/form-data kullanır. Lütfen /documents sayfasından veya Swagger dokümantasyonundan test edin.",
          variant: "default"
        });
        setLoading(false);
        return;
      }

      const fetchOptions: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        }
      };

      // POST/PUT metodunda request body ekle
      if ((endpoint.method === 'POST' || endpoint.method === 'PUT') && requestBody.trim()) {
        try {
          JSON.parse(requestBody); // JSON validasyonu
          fetchOptions.body = requestBody;
        } catch (jsonError) {
          throw new Error('Geçersiz JSON formatı');
        }
      }

      const response = await fetch(buildFilteredUrl(endpoint), fetchOptions);

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setResponse(data);
      toast({
        title: "Başarılı!",
        description: `${endpoint.name} başarıyla test edildi`
      });
    } catch (err: any) {
      const errorMessage = err.message || "Bilinmeyen hata";
      setError(errorMessage);
      toast({
        title: "Test Başarısız!",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Kopyalandı!",
      description: "Metin panoya kopyalandı"
    });
  };

  const getStatusBadge = (status: "success" | "error" | "loading") => {
    if (status === "success") {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Başarılı</Badge>;
    }
    if (status === "error") {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Hata</Badge>;
    }
    return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Test Ediliyor</Badge>;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/">
                <Button variant="outline" size="sm" className="mr-4">
                  <ArrowLeft size={16} className="mr-2" />
                  Ana Sayfa
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  API Test Ortamı
                </h1>
                <p className="text-slate-600">
                  Güvenli API endpoint'lerini test edin
                </p>
              </div>
            </div>
            <div>
              <Button
                variant="outline"
                onClick={() => window.open("/api/docs", "_blank")}
                className="mr-2"
              >
                <FileCode size={16} className="mr-2" />
                API Dokümantasyonu
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* API List Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Play className="w-5 h-5 mr-2" />
                  API Endpoint'leri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* API Key Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    API Anahtarı
                  </label>
                  <Input
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="API anahtarınızı girin"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Demo: ak_demo2025key
                  </p>
                </div>

                {/* API Endpoints */}
                <div className="space-y-2">
                  <h3 className="font-medium text-slate-800 text-sm">Referans Veriler</h3>
                  {API_ENDPOINTS.map((endpoint) => (
                    <div
                      key={endpoint.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedApi?.id === endpoint.id
                          ? "border-blue-300 bg-blue-50"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                      onClick={() => {
                        setSelectedApi(endpoint);
                        setResponse(null);
                        setError(null);
                        // API seçildiğinde uygun request body'yi ayarla
                        if (endpoint.method === 'POST' || endpoint.method === 'PUT') {
                          setRequestBody(getDefaultRequestBody(endpoint.id));
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-800 text-sm">
                            {endpoint.name}
                          </h4>
                          <p className="text-xs text-slate-600 mt-1">
                            {endpoint.description}
                          </p>
                          {endpoint.dataCount && (
                            <p className="text-xs text-blue-600 mt-1 font-medium">
                              {endpoint.dataCount}
                            </p>
                          )}
                          
                          {/* Filtreleme Parametreleri GET API'leri için */}
                          {endpoint.method === 'GET' && endpoint.filterParams && endpoint.filterParams.length > 0 && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                              <div className="font-medium text-green-800 mb-1">🔍 Filtreleme:</div>
                              <div className="flex flex-wrap gap-1">
                                {endpoint.filterParams.slice(0, 4).map((param, index) => (
                                  <span key={index} className="bg-green-100 text-green-700 px-1 py-0.5 rounded text-xs">
                                    {param}
                                  </span>
                                ))}
                                {endpoint.filterParams.length > 4 && (
                                  <span className="text-green-600">+{endpoint.filterParams.length - 4} daha</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs ml-2">
                          {endpoint.method}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Test Panel */}
          <div className="lg:col-span-2">
            {selectedApi ? (
              <div className="space-y-6">
                {/* API Details */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        {selectedApi.name}
                        <Badge className="ml-2">{selectedApi.method}</Badge>
                      </CardTitle>
                      <Button
                        onClick={() => testApi(selectedApi)}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {loading ? "Test Ediliyor..." : "Test Et"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Endpoint
                        </label>
                        <div className="flex items-center space-x-2">
                          <Input
                            value={buildFilteredUrl(selectedApi)}
                            readOnly
                            className="font-mono text-sm"
                          />
                          <Button
                            variant="outline" 
                            size="sm"
                            onClick={() => copyToClipboard(buildFilteredUrl(selectedApi))}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Açıklama
                        </label>
                        <p className="text-slate-600 text-sm">
                          {selectedApi.description}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          API Anahtarı
                        </label>
                        <Input
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="API anahtarınızı giriniz"
                          className="font-mono text-sm"
                        />
                      </div>

                      {/* Filtreleme Parametreleri Detay - GET API'leri için */}
                      {selectedApi.method === 'GET' && selectedApi.filterParams && selectedApi.filterParams.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                            🔍 Filtreleme Parametreleri
                          </h4>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                            {selectedApi.filterParams.map((param, index) => (
                              <div key={index} className="bg-white border border-blue-200 rounded px-2 py-1">
                                <code className="text-blue-700 text-xs font-medium">{param}</code>
                              </div>
                            ))}
                          </div>

                          {selectedApi.filterExamples && (
                            <div>
                              <h5 className="font-medium text-blue-900 mb-2 text-sm">Örnek Kullanım:</h5>
                              <div className="space-y-2">
                                {selectedApi.filterExamples.map((example, index) => (
                                  <div key={index} className="bg-white border border-blue-200 rounded p-2">
                                    <code className="text-blue-700 text-xs block break-all">
                                      {window.location.origin}{selectedApi.endpoint}{example}
                                    </code>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="mt-3 p-3 bg-blue-100 rounded text-xs">
                                <p className="text-blue-800">
                                  <strong>💡 Kullanım İpucu:</strong> Bu parametreleri endpoint URL'ine ekleyerek 
                                  veri filtreleme, sıralama ve sayfalama işlemleri yapabilirsiniz.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Interaktif Filtreleme Formu - GET API'leri için */}
                      {selectedApi.method === 'GET' && selectedApi.filterParams && selectedApi.filterParams.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-medium text-green-900 mb-3 flex items-center">
                            ⚙️ Filtreleme Parametreleri
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Search */}
                            {selectedApi.filterParams.includes('search') && (
                              <div>
                                <label className="block text-sm font-medium text-green-800 mb-1">
                                  Arama Metni
                                </label>
                                <Input
                                  value={filterParams.search}
                                  onChange={(e) => setFilterParams(prev => ({...prev, search: e.target.value}))}
                                  placeholder="Aranacak metin..."
                                  className="text-sm"
                                />
                              </div>
                            )}

                            {/* Limit */}
                            {selectedApi.filterParams.includes('limit') && (
                              <div>
                                <label className="block text-sm font-medium text-green-800 mb-1">
                                  Kayıt Sayısı (Limit)
                                </label>
                                <Input
                                  type="number"
                                  value={filterParams.limit}
                                  onChange={(e) => setFilterParams(prev => ({...prev, limit: e.target.value}))}
                                  placeholder="10"
                                  className="text-sm"
                                />
                              </div>
                            )}

                            {/* Offset */}
                            {selectedApi.filterParams.includes('offset') && (
                              <div>
                                <label className="block text-sm font-medium text-green-800 mb-1">
                                  Başlangıç Noktası (Offset)
                                </label>
                                <Input
                                  type="number"
                                  value={filterParams.offset}
                                  onChange={(e) => setFilterParams(prev => ({...prev, offset: e.target.value}))}
                                  placeholder="0"
                                  className="text-sm"
                                />
                              </div>
                            )}

                            {/* Sort By */}
                            {selectedApi.filterParams.includes('sortBy') && (
                              <div>
                                <label className="block text-sm font-medium text-green-800 mb-1">
                                  Sıralama Alanı
                                </label>
                                <Input
                                  value={filterParams.sortBy}
                                  onChange={(e) => setFilterParams(prev => ({...prev, sortBy: e.target.value}))}
                                  placeholder="name, id, amountCents..."
                                  className="text-sm"
                                />
                              </div>
                            )}

                            {/* Sort Order */}
                            {selectedApi.filterParams.includes('sortOrder') && (
                              <div>
                                <label className="block text-sm font-medium text-green-800 mb-1">
                                  Sıralama Yönü
                                </label>
                                <select
                                  value={filterParams.sortOrder}
                                  onChange={(e) => setFilterParams(prev => ({...prev, sortOrder: e.target.value}))}
                                  className="w-full p-2 border border-green-300 rounded text-sm"
                                >
                                  <option value="asc">Artan (A-Z)</option>
                                  <option value="desc">Azalan (Z-A)</option>
                                </select>
                              </div>
                            )}

                            {/* Active Only */}
                            {selectedApi.filterParams.includes('activeOnly') && (
                              <div>
                                <label className="block text-sm font-medium text-green-800 mb-1">
                                  Sadece Aktif Kayıtlar
                                </label>
                                <select
                                  value={filterParams.activeOnly}
                                  onChange={(e) => setFilterParams(prev => ({...prev, activeOnly: e.target.value}))}
                                  className="w-full p-2 border border-green-300 rounded text-sm"
                                >
                                  <option value="">Hepsi</option>
                                  <option value="true">Sadece Aktif</option>
                                  <option value="false">Sadece Pasif</option>
                                </select>
                              </div>
                            )}

                            {/* Min Amount */}
                            {selectedApi.filterParams.includes('minAmount') && (
                              <div>
                                <label className="block text-sm font-medium text-green-800 mb-1">
                                  Minimum Tutar (Kuruş)
                                </label>
                                <Input
                                  type="number"
                                  value={filterParams.minAmount}
                                  onChange={(e) => setFilterParams(prev => ({...prev, minAmount: e.target.value}))}
                                  placeholder="50000"
                                  className="text-sm"
                                />
                              </div>
                            )}

                            {/* Max Amount */}
                            {selectedApi.filterParams.includes('maxAmount') && (
                              <div>
                                <label className="block text-sm font-medium text-green-800 mb-1">
                                  Maksimum Tutar (Kuruş)
                                </label>
                                <Input
                                  type="number"
                                  value={filterParams.maxAmount}
                                  onChange={(e) => setFilterParams(prev => ({...prev, maxAmount: e.target.value}))}
                                  placeholder="100000"
                                  className="text-sm"
                                />
                              </div>
                            )}

                            {/* Phone Code */}
                            {selectedApi.filterParams.includes('phoneCode') && (
                              <div>
                                <label className="block text-sm font-medium text-green-800 mb-1">
                                  Telefon Kodu
                                </label>
                                <Input
                                  value={filterParams.phoneCode}
                                  onChange={(e) => setFilterParams(prev => ({...prev, phoneCode: e.target.value}))}
                                  placeholder="+90"
                                  className="text-sm"
                                />
                              </div>
                            )}
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setFilterParams({
                                search: "", limit: "", offset: "", sortBy: "", sortOrder: "asc",
                                activeOnly: "", minAmount: "", maxAmount: "", phoneCode: ""
                              })}
                              className="text-green-700 border-green-300 hover:bg-green-100"
                            >
                              Filtreleri Temizle
                            </Button>
                            
                            <div className="bg-white border border-green-300 rounded px-3 py-2">
                              <code className="text-green-700 text-xs">
                                {buildFilteredUrl(selectedApi).replace(window.location.origin, '')}
                              </code>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* POST/PUT Request Body */}
                      {(selectedApi?.method === 'POST' || selectedApi?.method === 'PUT') && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Request Body (JSON)
                          </label>
                          <Textarea
                            value={requestBody}
                            onChange={(e) => setRequestBody(e.target.value)}
                            placeholder='{"name": "Yeni Veri", "isActive": true}'
                            className="min-h-[120px] font-mono text-sm"
                            rows={8}
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Geçerli JSON formatında veri giriniz. {selectedApi?.method === 'PUT' && 'URL\'deki ID parametresini endpoint\'te değiştirebilirsiniz.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Response */}
                {(response || error || loading) && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Yanıt</CardTitle>
                        {loading && getStatusBadge("loading")}
                        {response && getStatusBadge("success")}
                        {error && getStatusBadge("error")}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loading && (
                        <div className="flex items-center space-x-2 text-slate-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span>API testi yapılıyor...</span>
                        </div>
                      )}
                      
                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 text-red-800 mb-2">
                            <XCircle className="w-4 h-4" />
                            <span className="font-medium">Test Başarısız</span>
                          </div>
                          <p className="text-red-700 text-sm">{error}</p>
                        </div>
                      )}

                      {response && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">JSON Yanıt</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(JSON.stringify(response, null, 2))}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Kopyala
                            </Button>
                          </div>
                          <Textarea
                            value={JSON.stringify(response, null, 2)}
                            readOnly
                            className="font-mono text-xs h-96 resize-none"
                          />
                          
                          {Array.isArray(response?.data) && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-green-800 text-sm">
                                <strong>Toplam Kayıt:</strong> {response.data.length}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Play className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">
                    API Seç ve Test Et
                  </h3>
                  <p className="text-slate-500">
                    Sol panelden bir API endpoint'i seçin ve test etmeye başlayın.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}