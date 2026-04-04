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

/**
 * Tier 1: Dosya adlarına göre toplu sınıflandırma (tek API çağrısı)
 */
export async function classifyByFileNames(
  files: FileInfo[],
  categories: CategoryTree[],
  entityType: string
): Promise<ClassificationResult[]> {
  const ai = getClient();

  const fileList = files.map((f, i) => `${i + 1}. "${f.fileName}" (${f.mimeType}, ${formatFileSize(f.fileSize)})`).join('\n');

  const response = await ai.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Sen bir filo yönetim sistemi için döküman sınıflandırma asistanısın.
Aşağıdaki dosya adlarını analiz ederek her birini en uygun döküman kategorisine sınıflandır.

Entity tipi: ${entityType}

Mevcut kategoriler:
${JSON.stringify(categories, null, 2)}

Dosyalar:
${fileList}

Her dosya için aşağıdaki JSON formatında yanıt ver. Yanıtın SADECE JSON array olsun, başka metin olmasın:
[
  {
    "index": 1,
    "mainTypeId": <number>,
    "mainTypeName": "<string>",
    "subTypeId": <number>,
    "subTypeName": "<string>",
    "suggestedTitle": "<Türkçe açıklayıcı başlık>",
    "confidence": <0-1 arası>,
    "reasoning": "<kısa Türkçe açıklama>"
  }
]

Kurallar:
- Dosya adından kategori belirlenemiyorsa confidence 0.3 altında ver
- suggestedTitle Türkçe ve açıklayıcı olsun
- mainTypeId ve subTypeId yukarıdaki kategori listesinden seçilmeli
- Eğer hiçbir alt kategori uymuyorsa, en yakın ana kategorinin ilk alt kategorisini seç ve düşük confidence ver`
      }
    ]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('AI yanıtı beklenmedik formatta');
  }

  const parsed = parseJsonResponse(content.text);

  return files.map((file, index) => {
    const match = parsed.find((p: { index: number }) => p.index === index + 1);
    if (match) {
      return {
        fileName: file.fileName,
        mainTypeId: match.mainTypeId,
        mainTypeName: match.mainTypeName,
        subTypeId: match.subTypeId,
        subTypeName: match.subTypeName,
        suggestedTitle: match.suggestedTitle,
        confidence: Math.min(1, Math.max(0, match.confidence)),
        reasoning: match.reasoning,
      };
    }
    // Fallback: AI bu dosyayı yanıtlamadıysa
    return createUnknownResult(file.fileName, categories);
  });
}

/**
 * Tier 2: Resim/PDF dosyaları için Vision API ile sınıflandırma
 */
export async function classifyByVision(
  file: FileInfo,
  categories: CategoryTree[],
  entityType: string
): Promise<ClassificationResult> {
  const ai = getClient();

  if (!file.buffer) {
    throw new Error('Vision sınıflandırma için dosya buffer gerekli');
  }

  const base64Data = file.buffer.toString('base64');
  const mediaType = getMediaType(file.mimeType);

  const categorySummary = categories
    .map(c => `${c.mainTypeName}: ${c.subTypes.map(s => s.subTypeName).join(', ')}`)
    .join('\n');

  const response = await ai.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Data }
          },
          {
            type: 'text',
            text: `Bu dökümanı sınıflandır. Dosya adı: "${file.fileName}". Entity tipi: ${entityType}.

Kategoriler:
${categorySummary}

Mevcut kategori detayları:
${JSON.stringify(categories, null, 2)}

SADECE JSON formatında yanıt ver:
{
  "mainTypeId": <number>,
  "mainTypeName": "<string>",
  "subTypeId": <number>,
  "subTypeName": "<string>",
  "suggestedTitle": "<Türkçe başlık>",
  "confidence": <0-1>,
  "reasoning": "<kısa Türkçe açıklama>"
}`
          }
        ]
      }
    ]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('AI Vision yanıtı beklenmedik formatta');
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
 * Tam sınıflandırma akışı: Tier 1 + düşük confidence olanlar için Tier 2
 */
export async function classifyDocuments(
  files: FileInfo[],
  categories: CategoryTree[],
  entityType: string
): Promise<ClassificationResult[]> {
  // Tier 1: Dosya adlarına göre toplu sınıflandırma
  const results = await classifyByFileNames(files, categories, entityType);

  // Tier 2: Düşük confidence + görsel analiz yapılabilir dosyalar
  const visionCandidates = results
    .map((r, i) => ({ result: r, index: i, file: files[i] }))
    .filter(({ result, file }) =>
      result.confidence < 0.6 &&
      file.buffer &&
      isVisionCompatible(file.mimeType)
    );

  // Vision çağrılarını paralel yap (max 5 adet)
  const visionBatch = visionCandidates.slice(0, 5);
  const visionResults = await Promise.allSettled(
    visionBatch.map(({ file }) => classifyByVision(file, categories, entityType))
  );

  // Vision sonuçlarını güncelle (sadece daha yüksek confidence ise)
  visionResults.forEach((visionResult, i) => {
    if (visionResult.status === 'fulfilled') {
      const originalIndex = visionBatch[i].index;
      if (visionResult.value.confidence > results[originalIndex].confidence) {
        results[originalIndex] = visionResult.value;
      }
    }
  });

  return results;
}

/** JSON yanıtını parse et (markdown code block olabilir) */
function parseJsonResponse(text: string): any {
  let cleaned = text.trim();
  // Markdown code block varsa çıkar
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  return JSON.parse(cleaned);
}

/** Vision API için uygun MIME type kontrolü */
function isVisionCompatible(mimeType: string): boolean {
  return ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType);
}

/** MIME type'ı Anthropic'in beklediği formata dönüştür */
function getMediaType(mimeType: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
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
    reasoning: 'Dosya adından kategori belirlenemedi',
  };
}
