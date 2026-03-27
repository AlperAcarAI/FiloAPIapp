import Anthropic from '@anthropic-ai/sdk';
import type { UserContext } from './hierarchical-auth';
import * as dataService from './bot-data-service';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

/** Claude API istemcisi (lazy init — key yoksa null) */
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

/** Konuşma geçmişi (in-memory, platform user ID bazlı) */
interface ConversationEntry {
  role: 'user' | 'assistant';
  content: string;
}

const conversationHistory = new Map<string, {
  messages: ConversationEntry[];
  lastActivity: number;
}>();

/** Kullanıcı başına günlük istek sayacı */
const dailyRequestCounts = new Map<string, { count: number; date: string }>();

const MAX_HISTORY = 10;
const HISTORY_TIMEOUT_MS = 30 * 60 * 1000; // 30 dakika
const MAX_DAILY_REQUESTS = 100;
const MAX_TOOL_DEPTH = 3;

/** Claude'a tanımlanan tool'lar */
const TOOLS: Anthropic.Tool[] = [
  {
    name: 'list_vehicles',
    description: 'Araç listesini getirir. Plaka, marka, model ve yıl bilgilerini gösterir.',
    input_schema: {
      type: 'object' as const,
      properties: {
        search: { type: 'string', description: 'Arama metni (opsiyonel)' },
        limit: { type: 'number', description: 'Maksimum sonuç sayısı (varsayılan 10)' },
      },
      required: [],
    },
  },
  {
    name: 'get_vehicle_detail',
    description: 'Belirli bir aracın detay bilgilerini getirir. Plaka numarası ile arama yapar. Sürücü ataması ve son bakım bilgisini de gösterir.',
    input_schema: {
      type: 'object' as const,
      properties: {
        plate: { type: 'string', description: 'Araç plaka numarası (örn: 34ABC123 veya 34 ABC 123)' },
      },
      required: ['plate'],
    },
  },
  {
    name: 'list_expiring_policies',
    description: 'Süresi dolmak üzere olan sigorta poliçelerini listeler. Aciliyete göre renkli gösterir.',
    input_schema: {
      type: 'object' as const,
      properties: {
        days_ahead: { type: 'number', description: 'Kaç gün ileriye bakılsın (varsayılan 30)' },
      },
      required: [],
    },
  },
  {
    name: 'search_personnel',
    description: 'Personel arar veya listeler. İsim veya soyisim ile arama yapabilir.',
    input_schema: {
      type: 'object' as const,
      properties: {
        search: { type: 'string', description: 'İsim veya soyisim araması (opsiyonel)' },
        limit: { type: 'number', description: 'Maksimum sonuç sayısı (varsayılan 10)' },
      },
      required: [],
    },
  },
  {
    name: 'get_fuel_records',
    description: 'Yakıt alım kayıtlarını getirir. Belirli bir araca ait veya tüm kayıtları gösterir.',
    input_schema: {
      type: 'object' as const,
      properties: {
        plate: { type: 'string', description: 'Araç plakası (opsiyonel, belirtilmezse tüm kayıtlar)' },
        limit: { type: 'number', description: 'Maksimum sonuç sayısı (varsayılan 10)' },
      },
      required: [],
    },
  },
  {
    name: 'get_maintenance_records',
    description: 'Bakım kayıtlarını getirir. Tarih, tip, tutar ve servis bilgilerini gösterir.',
    input_schema: {
      type: 'object' as const,
      properties: {
        plate: { type: 'string', description: 'Araç plakası (opsiyonel)' },
        limit: { type: 'number', description: 'Maksimum sonuç sayısı (varsayılan 10)' },
      },
      required: [],
    },
  },
  {
    name: 'get_dashboard_summary',
    description: 'Genel dashboard özeti. Araç sayısı, personel sayısı, aktif şantiye ve süresi dolacak poliçe sayılarını gösterir.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_current_accounts',
    description: 'Cari hesap özetini getirir. Son işlemleri borç/alacak olarak gösterir.',
    input_schema: {
      type: 'object' as const,
      properties: {
        company_name: { type: 'string', description: 'Firma adı filtresi (opsiyonel)' },
      },
      required: [],
    },
  },
];

/**
 * Tool çağrısını çalıştırır
 */
async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  userCtx: UserContext
): Promise<string> {
  switch (toolName) {
    case 'list_vehicles':
      return dataService.listVehicles(userCtx, input.search as string, input.limit as number);
    case 'get_vehicle_detail':
      return dataService.getVehicleDetail(userCtx, input.plate as string);
    case 'list_expiring_policies':
      return dataService.listExpiringPolicies(userCtx, input.days_ahead as number);
    case 'search_personnel':
      return dataService.searchPersonnel(userCtx, input.search as string, input.limit as number);
    case 'get_fuel_records':
      return dataService.getFuelRecords(userCtx, input.plate as string, input.limit as number);
    case 'get_maintenance_records':
      return dataService.getMaintenanceRecords(userCtx, input.plate as string, input.limit as number);
    case 'get_dashboard_summary':
      return dataService.getDashboardSummary(userCtx);
    case 'get_current_accounts':
      return dataService.getCurrentAccounts(userCtx, input.company_name as string);
    default:
      return `Bilinmeyen tool: ${toolName}`;
  }
}

/**
 * Günlük istek limiti kontrolü
 */
function checkDailyLimit(platformUserId: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  const entry = dailyRequestCounts.get(platformUserId);

  if (!entry || entry.date !== today) {
    dailyRequestCounts.set(platformUserId, { count: 1, date: today });
    return true;
  }

  if (entry.count >= MAX_DAILY_REQUESTS) return false;

  entry.count++;
  return true;
}

/**
 * Konuşma geçmişini getirir (timeout kontrolü ile)
 */
function getHistory(platformUserId: string): ConversationEntry[] {
  const entry = conversationHistory.get(platformUserId);
  if (!entry) return [];

  // Timeout kontrolü
  if (Date.now() - entry.lastActivity > HISTORY_TIMEOUT_MS) {
    conversationHistory.delete(platformUserId);
    return [];
  }

  return entry.messages;
}

/**
 * Konuşma geçmişine mesaj ekler
 */
function addToHistory(platformUserId: string, role: 'user' | 'assistant', content: string): void {
  let entry = conversationHistory.get(platformUserId);

  if (!entry) {
    entry = { messages: [], lastActivity: Date.now() };
    conversationHistory.set(platformUserId, entry);
  }

  entry.messages.push({ role, content });
  entry.lastActivity = Date.now();

  // Limit aşımı kontrolü
  if (entry.messages.length > MAX_HISTORY * 2) {
    entry.messages = entry.messages.slice(-MAX_HISTORY * 2);
  }
}

/**
 * Konuşma geçmişini temizler
 */
export function clearHistory(platformUserId: string): void {
  conversationHistory.delete(platformUserId);
}

/**
 * Claude API ile mesaj işleme — function calling destekli
 */
export async function processMessage(
  platformUserId: string,
  message: string,
  userCtx: UserContext
): Promise<string> {
  // Günlük limit kontrolü
  if (!checkDailyLimit(platformUserId)) {
    return 'Günlük mesaj limitinize ulaştınız (100/gün). Yarın tekrar deneyebilirsiniz.';
  }

  const systemPrompt = `Sen Sahacı filo yönetim sisteminin akıllı asistanısın.
Kullanıcılara araç, personel, poliçe, yakıt, bakım ve finansal veriler hakkında yardım ediyorsun.

Kurallar:
- Türkçe yanıt ver
- Kısa ve net ol
- Verileri düzenli formatta göster
- Kullanıcının erişim seviyesi: ${userCtx.accessLevel}
- Kullanıcının izinleri: ${userCtx.permissions.join(', ')}
- Kullanıcı adı: ${userCtx.personnelName || 'Bilinmiyor'} ${userCtx.personnelSurname || ''}
- Sadece kullanıcının yetkisi dahilindeki verilere erişebilirsin
- Tool sonuçlarını doğrudan kopyalama, doğal dilde özetle
- Para birimleri TL olarak gösterilir
- Tarihler DD.MM.YYYY formatında gösterilir`;

  // Geçmiş mesajları al
  const history = getHistory(platformUserId);
  addToHistory(platformUserId, 'user', message);

  const messages: Anthropic.MessageParam[] = [
    ...history.map(h => ({
      role: h.role as 'user' | 'assistant',
      content: h.content,
    })),
    { role: 'user', content: message },
  ];

  try {
    let currentMessages = messages;
    let depth = 0;

    // Tool calling loop
    while (depth < MAX_TOOL_DEPTH) {
      const response = await getClient().messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        tools: TOOLS,
        messages: currentMessages,
      });

      // Yanıttan metin ve tool çağrılarını ayır
      const textParts: string[] = [];
      const toolUses: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          textParts.push(block.text);
        } else if (block.type === 'tool_use') {
          toolUses.push({
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          });
        }
      }

      // Tool çağrısı yoksa yanıtı döndür
      if (toolUses.length === 0) {
        const finalText = textParts.join('\n');
        addToHistory(platformUserId, 'assistant', finalText);
        return finalText;
      }

      // Tool çağrılarını çalıştır
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const tool of toolUses) {
        const result = await executeTool(tool.name, tool.input, userCtx);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tool.id,
          content: result,
        });
      }

      // Claude'a tool sonuçlarını gönder
      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults },
      ];

      depth++;
    }

    // Max depth'e ulaşıldı
    const fallbackText = 'İsteğinizi işlerken çok fazla adım gerekti. Lütfen daha spesifik bir soru sorun.';
    addToHistory(platformUserId, 'assistant', fallbackText);
    return fallbackText;

  } catch (error) {
    console.error('[BOT-AI] Claude API hatası:', error);

    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        return 'Şu anda çok fazla istek var, lütfen birkaç saniye bekleyip tekrar deneyin.';
      }
      if (error.status === 401) {
        return 'AI servisi yapılandırma hatası. Lütfen sistem yöneticisine başvurun.';
      }
    }

    return 'Bir hata oluştu. Lütfen tekrar deneyin.';
  }
}
