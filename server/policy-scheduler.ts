import cron from 'node-cron';
import { policyNotificationService } from './policy-notification-service';

/**
 * Initialize the policy expiration notification scheduler
 * Runs daily at 09:00 Turkish time
 */
export function initializePolicyScheduler() {
  // Schedule: Every day at 09:00 (Turkish time)
  const cronExpression = '0 9 * * *';

  const scheduledTask = cron.schedule(cronExpression, async () => {
    console.log('🔔 Günlük poliçe süre dolum kontrolü çalışıyor...');
    console.log(`⏰ Zaman: ${new Date().toLocaleString('tr-TR')}`);

    try {
      await policyNotificationService.runDailyNotificationCheck();
      console.log('✅ Poliçe süre dolum kontrolü başarıyla tamamlandı');
    } catch (error) {
      console.error('❌ Poliçe süre dolum kontrolü sırasında hata oluştu:', error);
      // Error is logged but doesn't crash the application
      // Scheduler will try again at next scheduled time
    }
  }, {
    scheduled: true,
    timezone: 'Europe/Istanbul'
  });

  console.log('📅 Poliçe bildirim scheduler başlatıldı');
  console.log(`⏰ Schedule: Her gün saat 09:00 (Türkiye saati)`);
  console.log(`🌍 Timezone: Europe/Istanbul`);

  return scheduledTask;
}
