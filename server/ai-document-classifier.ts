import Anthropic from '@anthropic-ai/sdk';
import type { DocMainType, DocSubType } from '@shared/schema';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY env değişkeni ayarlanmamış');
    }
    client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  }
  return client;
}

/** Kategori ağacı yapısı (prompt'a gönderilecek) */
interface CategoryTree {
  mainTypeId: number;
  mainTypeName: string;
  subTypes: Array<{ subTypeId: number; subTypeName: string }>;
}

/** AI sınıflandırma sonucu */
export interface ClassificationResult {
  fileName: string;
  mainTypeId: number;
  mainTypeName: string;
  subTypeId: number;
  subTypeName: string;
  suggestedTitle: string;
  confidence: number;
  reasoning: string;
}

/** Dosya bilgisi (sınıflandırmaya gönderilecek) */
export interface FileInfo {
  fileName: string;
  mimeType: string;
  fileSize: number;
  buffer?: Buffer;
}

/**
 * Kategori listesini ağaç yapısına dönüştürür
 */
export function buildCategoryTree(
  mainTypes: DocMainType[],
  subTypes: DocSubType[]
): CategoryTree[] {
  return mainTypes
    .filter(mt => mt.isActive)
    .map(mt => ({
      mainTypeId: mt.id,
      mainTypeName: mt.name,
      subTypes: subTypes
        .filter(st => st.mainTypeId === mt.id && st.isActive)
        .map(st => ({ subTypeId: st.id, subTypeName: st.name })),
    }));
}

/** Ortak sınıflandırma prompt metni */
function getClassificationPrompt(categories: CategoryTree[], entityType: string): string {
  return `Sen bir filo yönetim sistemi için döküman sınıflandırma asistanısın.
Dosyanın İÇERİĞİNİ analiz ederek en uygun döküman kategorisine sınıflandır.

Entity tipi: ${entityType}

Mevcut kategoriler:
${JSON.stringify(categories, null, 2)}

SADECE JSON formatında yanıt ver, başka metin olmasın:
{
  "mainTypeId": <number>,
  "mainTypeName": "<string>",
  "subTypeId": <number>,
  "subTypeName": "<string>",
  "suggestedTitle": "<Türkçe açıklayıcı başlık>",
  "confidence": <0-1 arası>,
  "reasoning": "<kısa Türkçe açıklama>"
}

Kurallar:
- Dosya içeriğine göre sınıflandır, sadece dosya adına güvenme
- suggestedTitle Türkçe ve açıklayıcı olsun
- mainTypeId ve subTypeId yukarıdaki kategori listesinden seçilmeli
- İçerikten kategori belirlenemiyorsa confidence 0.3 altında ver`;
}

/**
 * Tek bir dosyayı içeriğine göre sınıflandır (resim, PDF veya metin)
 */
async function classifyFileByContent(
  file: FileInfo,
  categories: CategoryTree[],
  entityType: string
): Promise<ClassificationResult> {
  const ai = getClient();
  const prompt = getClassificationPrompt(categories, entityType);

  // İçerik bloklarını oluştur
  const contentBlocks: Anthropic.MessageCreateParams['messages'][0]['content'] = [];

  if (file.buffer) {
    if (isImageFile(file.mimeType)) {
      // Resim dosyaları: Vision API
      contentBlocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: getImageMediaType(file.mimeType),
          data: file.buffer.toString('base64'),
        },
      });
    } else if (file.mimeType === 'application/pdf') {
      // PDF dosyaları: Document API
      contentBlocks.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: file.buffer.toString('base64'),
        },
      } as any);
    } else if (file.mimeType === 'text/plain') {
      // Text dosyaları: içeriği direkt metin olarak gönder
      const textContent = file.buffer.toString('utf-8').slice(0, 5000); // Max 5000 karakter
      contentBlocks.push({
        type: 'text',
        text: `--- Dosya İçeriği (${file.fileName}) ---\n${textContent}\n--- Dosya Sonu ---`,
      });
    }
  }

  // Her durumda dosya adını ve prompt'u ekle
  contentBlocks.push({
    type: 'text',
    text: `Dosya adı: "${file.fileName}" (${file.mimeType}, ${formatFileSize(file.fileSize)})\n\n${prompt}`,
  });

  const response = await ai.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: contentBlocks }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('AI yanıtı beklenmedik formatta');
  }

  const parsed = parseJsonResponse(content.text);
  const result = Array.isArray(parsed) ? parsed[0] : parsed;

  return {
    fileName: file.fileName,
    mainTypeId: result.mainTypeId,
    mainTypeName: result.mainTypeName,
    subTypeId: result.subTypeId,
    subTypeName: result.subTypeName,
    suggestedTitle: result.suggestedTitle,
    confidence: Math.min(1, Math.max(0, result.confidence)),
    reasoning: result.reasoning,
  };
}

/**
 * Tüm dosyaları içeriklerine göre sınıflandır
 * Her dosya ayrı API çağrısı ile analiz edilir (içerik gönderimi gerektiği için)
 * Paralel çalışır (max 5 eşzamanlı)
 */
export async function classifyDocuments(
  files: FileInfo[],
  categories: CategoryTree[],
  entityType: string
): Promise<ClassificationResult[]> {
  const results: ClassificationResult[] = new Array(files.length);
  const BATCH_SIZE = 5;

  // Dosyaları 5'erli gruplar halinde paralel işle
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map(file => classifyFileByContent(file, categories, entityType))
    );

    batchResults.forEach((result, batchIndex) => {
      const fileIndex = i + batchIndex;
      if (result.status === 'fulfilled') {
        results[fileIndex] = result.value;
      } else {
        console.error(`Dosya sınıflandırma hatası (${files[fileIndex].fileName}):`, result.reason);
        results[fileIndex] = createUnknownResult(files[fileIndex].fileName, categories);
      }
    });
  }

  return results;
}

/** JSON yanıtını parse et (markdown code block olabilir) */
function parseJsonResponse(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  return JSON.parse(cleaned);
}

/** Resim dosyası mı? */
function isImageFile(mimeType: string): boolean {
  return ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType);
}

/** MIME type'ı Anthropic image formatına dönüştür */
function getImageMediaType(mimeType: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  const mapping: Record<string, 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'> = {
    'image/jpeg': 'image/jpeg',
    'image/jpg': 'image/jpeg',
    'image/png': 'image/png',
    'image/gif': 'image/gif',
    'image/webp': 'image/webp',
  };
  return mapping[mimeType] || 'image/jpeg';
}

/** Dosya boyutunu okunabilir formata çevir */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Sınıflandırılamayan dosyalar için fallback sonuç */
function createUnknownResult(fileName: string, categories: CategoryTree[]): ClassificationResult {
  const firstCategory = categories[0];
  const firstSubType = firstCategory?.subTypes[0];
  return {
    fileName,
    mainTypeId: firstCategory?.mainTypeId ?? 0,
    mainTypeName: firstCategory?.mainTypeName ?? 'Bilinmeyen',
    subTypeId: firstSubType?.subTypeId ?? 0,
    subTypeName: firstSubType?.subTypeName ?? 'Bilinmeyen',
    suggestedTitle: fileName.replace(/\.[^.]+$/, ''),
    confidence: 0.1,
    reasoning: 'Dosya içeriği analiz edilemedi',
  };
}
