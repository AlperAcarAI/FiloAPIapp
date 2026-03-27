import { Router, type Request, type Response } from 'express';
import { Telegraf, Markup } from 'telegraf';
import type { Update } from 'telegraf/types';
import {
  findUserByPhone,
  getSession,
  createOrUpdateSession,
  deactivateSession,
  loadBotUserContext,
  resolveTenantDomain,
} from './bot-auth-service';
import { processMessage, clearHistory } from './bot-ai-service';
import { splitMessage } from './bot-message-formatter';
import { runWithTenant } from './tenant-context';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL;

let bot: Telegraf | null = null;

/**
 * Telegraf bot instance'ını oluşturur ve komutları kaydeder.
 */
function createBot(): Telegraf | null {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('[TELEGRAM-BOT] TELEGRAM_BOT_TOKEN ayarlanmamış, bot devre dışı.');
    return null;
  }

  const telegrafBot = new Telegraf(TELEGRAM_BOT_TOKEN);

  // /start komutu — kimlik doğrulama akışı
  telegrafBot.start(async (ctx) => {
    try {
      const chatId = ctx.chat.id.toString();
      const existingSession = await getSessionSafe('telegram', chatId);

      if (existingSession) {
        await ctx.reply(
          `Zaten giriş yapmışsınız. Bana istediğinizi sorabilirsiniz!\n\nÇıkış yapmak için /cikis yazın.`
        );
        return;
      }

      await ctx.reply(
        'Sahacı Filo Yönetim Botu\'na hoş geldiniz! 🚛\n\n' +
        'Sisteme erişmek için telefon numaranızı paylaşmanız gerekiyor.\n' +
        'Aşağıdaki butona basarak numaranızı güvenle paylaşabilirsiniz.',
        Markup.keyboard([
          [Markup.button.contactRequest('📱 Telefon Numaramı Paylaş')]
        ]).oneTime().resize()
      );
    } catch (error) {
      console.error('[TELEGRAM-BOT] /start hatası:', error);
      await ctx.reply('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  });

  // Telefon numarası paylaşımı — kimlik doğrulama
  telegrafBot.on('contact', async (ctx) => {
    try {
      const contact = ctx.message.contact;
      const chatId = ctx.chat.id.toString();

      // Telegram sadece kendi numaranızı paylaşmanıza izin verir
      if (contact.user_id !== ctx.from.id) {
        await ctx.reply('Lütfen kendi telefon numaranızı paylaşın.');
        return;
      }

      const phone = contact.phone_number;

      // İlk tenant ile kullanıcıyı ara (varsayılan tenant)
      // Multi-tenant ortamda tüm tenantlar taranabilir
      const user = await findUserByPhoneAcrossTenants(phone);

      if (!user) {
        await ctx.reply(
          'Bu telefon numarası sistemde kayıtlı değil.\n' +
          'Lütfen sistem yöneticinize başvurun.',
          Markup.removeKeyboard()
        );
        return;
      }

      // Oturum oluştur
      await createOrUpdateSession(
        'telegram',
        chatId,
        user.userId,
        user.personnelId,
        user.companyId,
        user.tenantDomain
      );

      await ctx.reply(
        `Hoş geldiniz, ${user.personnelName} ${user.personnelSurname}! ✅\n\n` +
        'Bana doğal dilde sorularınızı sorabilirsiniz. Örneğin:\n' +
        '• "Kaç aracımız var?"\n' +
        '• "Süresi dolacak poliçeler neler?"\n' +
        '• "34 ABC 123 plakalı aracın detayları"\n' +
        '• "Ali isimli personeli bul"\n' +
        '• "Son yakıt kayıtlarını göster"\n\n' +
        'Komutlar: /yardim | /cikis',
        Markup.removeKeyboard()
      );
    } catch (error) {
      console.error('[TELEGRAM-BOT] Contact handler hatası:', error);
      await ctx.reply('Doğrulama sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    }
  });

  // /yardim komutu
  telegrafBot.command('yardim', async (ctx) => {
    await ctx.reply(
      'Sahacı Bot Yardım\n\n' +
      'Bana doğal dilde sorularınızı sorabilirsiniz:\n\n' +
      '🚛 Araçlar: "Araçları listele", "34 ABC 123 detayı"\n' +
      '📋 Poliçeler: "Süresi dolacak poliçeler", "7 gün içinde dolacaklar"\n' +
      '👷 Personel: "Personel listesi", "Ali adlı personel"\n' +
      '⛽ Yakıt: "Son yakıt kayıtları", "34 ABC 123 yakıt geçmişi"\n' +
      '🔧 Bakım: "Bakım kayıtları", "34 ABC 123 bakım geçmişi"\n' +
      '📊 Özet: "Dashboard özeti", "Genel durum"\n' +
      '💰 Cari: "Cari hesap özeti"\n\n' +
      'Komutlar:\n' +
      '/start — Yeniden giriş yap\n' +
      '/yardim — Bu mesajı göster\n' +
      '/cikis — Oturumu kapat'
    );
  });

  // /cikis komutu
  telegrafBot.command('cikis', async (ctx) => {
    try {
      const chatId = ctx.chat.id.toString();
      await deactivateSession('telegram', chatId);
      clearHistory(chatId);
      await ctx.reply(
        'Oturumunuz kapatıldı. Tekrar giriş yapmak için /start yazın.',
        Markup.removeKeyboard()
      );
    } catch (error) {
      console.error('[TELEGRAM-BOT] /cikis hatası:', error);
      await ctx.reply('Çıkış sırasında bir hata oluştu.');
    }
  });

  // Metin mesajları — AI ile işleme
  telegrafBot.on('text', async (ctx) => {
    try {
      const chatId = ctx.chat.id.toString();
      const message = ctx.message.text;

      // Komutları atla (zaten yukarıda işleniyor)
      if (message.startsWith('/')) return;

      const session = await getSessionSafe('telegram', chatId);

      if (!session) {
        await ctx.reply(
          'Lütfen önce giriş yapın. /start yazarak başlayabilirsiniz.'
        );
        return;
      }

      // "Yazıyor..." göstergesi
      await ctx.sendChatAction('typing');

      // Tenant context içinde çalıştır
      const response = await runWithTenant(session.tenantDomain, async () => {
        const userCtx = await loadBotUserContext(session.userId);
        if (!userCtx) {
          return 'Kullanıcı bilgilerinize erişilemiyor. Hesabınız pasif olabilir.';
        }

        return processMessage(chatId, message, userCtx);
      });

      // Uzun yanıtları böl ve gönder
      const parts = splitMessage(response);
      for (const part of parts) {
        await ctx.reply(part);
      }
    } catch (error) {
      console.error('[TELEGRAM-BOT] Mesaj işleme hatası:', error);
      await ctx.reply('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  });

  return telegrafBot;
}

/**
 * Tüm tenantlarda telefon numarası araması yapar.
 */
async function findUserByPhoneAcrossTenants(phone: string): Promise<{
  userId: number;
  personnelId: number;
  personnelName: string;
  personnelSurname: string;
  companyId: number;
  tenantDomain: string;
} | null> {
  const { getTenantConfigs } = await import('./tenant-context');
  const configs = getTenantConfigs();

  for (const config of configs) {
    try {
      const result = await runWithTenant(config.domain, async () => {
        return findUserByPhone(phone);
      });

      if (result) {
        return {
          ...result,
          tenantDomain: config.domain,
        };
      }
    } catch (error) {
      console.error(`[TELEGRAM-BOT] Tenant ${config.name} aramasında hata:`, error);
    }
  }

  return null;
}

/**
 * Session getirme (hata yutarak null döner)
 */
async function getSessionSafe(platform: string, platformUserId: string) {
  try {
    return await getSession(platform, platformUserId);
  } catch {
    return null;
  }
}

/**
 * Bot webhook route'larını ve başlatma işlemlerini içeren router.
 */
export function createBotRouter(): Router {
  const router = Router();

  bot = createBot();

  if (!bot) {
    console.log('[TELEGRAM-BOT] Bot oluşturulamadı, webhook route\'ları devre dışı.');
    return router;
  }

  // Telegram webhook endpoint
  router.post('/telegram/webhook', (req: Request, res: Response) => {
    if (!bot) {
      return res.status(503).json({ success: false, message: 'Bot aktif değil' });
    }

    // Telegraf handleUpdate
    bot.handleUpdate(req.body as Update, res);
  });

  // Bot durumu endpoint
  router.get('/status', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        telegram: {
          active: !!bot,
          webhookConfigured: !!TELEGRAM_WEBHOOK_URL,
        },
      },
    });
  });

  return router;
}

/**
 * Telegram webhook'unu ayarlar. Uygulama başlangıcında çağrılır.
 */
export async function setupTelegramWebhook(): Promise<void> {
  if (!bot || !TELEGRAM_WEBHOOK_URL) {
    if (!TELEGRAM_BOT_TOKEN) {
      console.log('[TELEGRAM-BOT] Token ayarlanmamış, webhook kurulumu atlandı.');
    } else if (!TELEGRAM_WEBHOOK_URL) {
      console.log('[TELEGRAM-BOT] TELEGRAM_WEBHOOK_URL ayarlanmamış, webhook kurulumu atlandı.');
    }
    return;
  }

  try {
    await bot.telegram.setWebhook(TELEGRAM_WEBHOOK_URL);
    console.log(`[TELEGRAM-BOT] Webhook ayarlandı: ${TELEGRAM_WEBHOOK_URL}`);
  } catch (error) {
    console.error('[TELEGRAM-BOT] Webhook ayarlama hatası:', error);
  }
}
