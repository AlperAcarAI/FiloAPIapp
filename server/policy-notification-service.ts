import https from 'https';
import { db } from './db';
import { assetsPolicies, policyTypes, companies, assets } from '../shared/schema';
import { eq, and, sql } from 'drizzle-orm';

interface PolicyNotificationData {
  id: number;
  policyNumber: string;
  endDate: string;
  amountCents: number;
  plateNumber: string;
  policyTypeName: string;
  insuranceCompanyName: string;
  remainingDays: number;
}

type NotificationInterval = '30_days' | '15_days' | '7_days' | 'expired';

class PolicyNotificationService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    console.log('✅ Policy Notification Service initialized');
  }

  /**
   * Get access token from SendPulse API
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const apiUserId = process.env.SENDPULSE_API_ID;
    const apiSecret = process.env.SENDPULSE_API_SECRET;

    if (!apiUserId || !apiSecret) {
      throw new Error('SendPulse API credentials not found in environment variables');
    }

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        grant_type: 'client_credentials',
        client_id: apiUserId,
        client_secret: apiSecret
      });

      const options = {
        hostname: 'api.sendpulse.com',
        port: 443,
        path: '/oauth/access_token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.access_token) {
              this.accessToken = response.access_token;
              // Token expires in 1 hour, we'll refresh 5 minutes before
              this.tokenExpiry = Date.now() + ((response.expires_in - 300) * 1000);
              console.log('🔑 SendPulse access token obtained');
              resolve(this.accessToken);
            } else {
              reject(new Error('Failed to obtain access token'));
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  /**
   * Check database for expiring policies and group them by notification interval
   */
  async checkExpiringPolicies(): Promise<Record<NotificationInterval, PolicyNotificationData[]>> {
    console.log('🔍 Checking for expiring policies...');

    try {
      // Fetch policies expiring within next 30 days or already expired
      const policiesData = await db
        .select({
          id: assetsPolicies.id,
          policyNumber: assetsPolicies.policyNumber,
          endDate: assetsPolicies.endDate,
          amountCents: assetsPolicies.amountCents,
          plateNumber: assets.plateNumber,
          policyTypeName: policyTypes.name,
          insuranceCompanyName: companies.name
        })
        .from(assetsPolicies)
        .innerJoin(assets, eq(assetsPolicies.assetId, assets.id))
        .innerJoin(policyTypes, eq(assetsPolicies.policyTypeId, policyTypes.id))
        .innerJoin(companies, eq(assetsPolicies.insuranceCompanyId, companies.id))
        .where(
          and(
            eq(assetsPolicies.isActive, true),
            sql`${assetsPolicies.endDate} <= CURRENT_DATE + INTERVAL '30 days'`
          )
        )
        .orderBy(assetsPolicies.endDate);

      console.log(`📊 Found ${policiesData.length} policies within 30-day window`);

      // Group policies by notification interval
      const policiesByInterval: Record<NotificationInterval, PolicyNotificationData[]> = {
        '30_days': [],
        '15_days': [],
        '7_days': [],
        'expired': []
      };

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const policy of policiesData) {
        const endDate = new Date(policy.endDate!);
        endDate.setHours(0, 0, 0, 0);

        const diffTime = endDate.getTime() - today.getTime();
        const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const interval = this.determineNotificationInterval(remainingDays);

        if (interval) {
          policiesByInterval[interval].push({
            id: policy.id,
            policyNumber: policy.policyNumber,
            endDate: policy.endDate!,
            amountCents: policy.amountCents,
            plateNumber: policy.plateNumber || 'N/A',
            policyTypeName: policy.policyTypeName,
            insuranceCompanyName: policy.insuranceCompanyName,
            remainingDays
          });
        }
      }

      console.log(`📋 Grouped policies:
        - 30 gün önce: ${policiesByInterval['30_days'].length}
        - 15 gün önce: ${policiesByInterval['15_days'].length}
        - 7 gün önce: ${policiesByInterval['7_days'].length}
        - Süresi dolmuş: ${policiesByInterval['expired'].length}
      `);

      return policiesByInterval;
    } catch (error) {
      console.error('❌ Error checking expiring policies:', error);
      throw error;
    }
  }

  /**
   * Determine which notification interval applies based on remaining days
   */
  private determineNotificationInterval(remainingDays: number): NotificationInterval | null {
    if (remainingDays < 0) return 'expired';
    if (remainingDays === 7) return '7_days';
    if (remainingDays === 15) return '15_days';
    if (remainingDays === 30) return '30_days';
    return null; // No notification needed today
  }

  /**
   * Generate HTML email template for policy expiration notifications
   */
  private generateExpirationEmailHTML(
    policies: PolicyNotificationData[],
    interval: NotificationInterval
  ): string {
    const intervalConfig = {
      '30_days': {
        title: '30 Gün İçinde Süresi Dolacak Poliçeler',
        color: '#3b82f6',
        emoji: '🔵',
        urgency: 'Orta'
      },
      '15_days': {
        title: '15 Gün İçinde Süresi Dolacak Poliçeler',
        color: '#eab308',
        emoji: '🟡',
        urgency: 'Yüksek'
      },
      '7_days': {
        title: '7 Gün İçinde Süresi Dolacak Poliçeler',
        color: '#f97316',
        emoji: '🟠',
        urgency: 'Çok Yüksek'
      },
      'expired': {
        title: 'Süresi Dolmuş Poliçeler',
        color: '#ef4444',
        emoji: '🔴',
        urgency: 'ACİL'
      }
    };

    const config = intervalConfig[interval];

    const policyCards = policies.map(policy => {
      const formattedAmount = (policy.amountCents / 100).toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      const endDateFormatted = new Date(policy.endDate).toLocaleDateString('tr-TR');

      const statusText = policy.remainingDays < 0
        ? `${Math.abs(policy.remainingDays)} gün önce doldu`
        : `${policy.remainingDays} gün kaldı`;

      return `
        <tr>
          <td style="padding: 20px; background-color: #ffffff; border-left: 4px solid ${config.color}; margin-bottom: 16px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                          ${config.emoji} ACİLİYET: ${config.urgency}
                        </p>
                      </td>
                      <td align="right">
                        <p style="margin: 0; color: ${config.color}; font-size: 14px; font-weight: 600;">
                          ${statusText}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr><td style="height: 12px;"></td></tr>
              <tr>
                <td>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width: 50%; padding: 8px 0;">
                        <p style="margin: 0; color: #6b7280; font-size: 12px;">Plaka</p>
                        <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 16px; font-weight: 600;">
                          ${policy.plateNumber}
                        </p>
                      </td>
                      <td style="width: 50%; padding: 8px 0;">
                        <p style="margin: 0; color: #6b7280; font-size: 12px;">Poliçe No</p>
                        <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 16px; font-weight: 600;">
                          ${policy.policyNumber}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="width: 50%; padding: 8px 0;">
                        <p style="margin: 0; color: #6b7280; font-size: 12px;">Poliçe Tipi</p>
                        <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 14px;">
                          ${policy.policyTypeName}
                        </p>
                      </td>
                      <td style="width: 50%; padding: 8px 0;">
                        <p style="margin: 0; color: #6b7280; font-size: 12px;">Sigorta Şirketi</p>
                        <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 14px;">
                          ${policy.insuranceCompanyName}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="width: 50%; padding: 8px 0;">
                        <p style="margin: 0; color: #6b7280; font-size: 12px;">Bitiş Tarihi</p>
                        <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 14px;">
                          ${endDateFormatted}
                        </p>
                      </td>
                      <td style="width: 50%; padding: 8px 0;">
                        <p style="margin: 0; color: #6b7280; font-size: 12px;">Tutar</p>
                        <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 14px; font-weight: 600;">
                          ₺${formattedAmount}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="height: 16px;"></td></tr>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Poliçe Süre Uyarısı</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="700" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                                ⚠️ ${config.title}
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">
                                Sahacı Poliçe Yönetim Sistemi
                            </p>
                        </td>
                    </tr>

                    <!-- Summary -->
                    <tr>
                        <td style="padding: 30px; background-color: #fefce8; border-bottom: 1px solid #e5e7eb;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="vertical-align: middle;">
                                        <p style="margin: 0; color: #854d0e; font-size: 16px; font-weight: 600;">
                                            📊 Toplam ${policies.length} poliçe dikkat gerektiriyor
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 30px; background-color: #f9fafb;">
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                Aşağıdaki poliçeler ${config.title.toLowerCase()} durumundadır. Lütfen gerekli işlemleri yapınız.
                            </p>

                            <!-- Policy Cards -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                                ${policyCards}
                            </table>
                        </td>
                    </tr>

                    <!-- Info Box -->
                    <tr>
                        <td style="padding: 30px; background-color: #eff6ff; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                                <strong>ℹ️ Bilgi:</strong> Bu e-posta otomatik olarak Sahacı Poliçe Yönetim Sistemi tarafından gönderilmiştir.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                                © ${new Date().getFullYear()} Sahacı Poliçe Yönetim Sistemi<br>
                                Bu e-posta ${new Date().toLocaleString('tr-TR')} tarihinde gönderilmiştir.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
  }

  /**
   * Send expiration notification email via SendPulse
   */
  private async sendExpirationNotification(
    policies: PolicyNotificationData[],
    interval: NotificationInterval
  ): Promise<boolean> {
    try {
      const recipientEmail = process.env.SENDPULSE_RECIPIENT_EMAIL || 'info@ersaulasim.com';
      const senderEmail = process.env.SENDPULSE_SENDER_EMAIL || 'info@ersaulasim.com';
      const senderName = process.env.SENDPULSE_SENDER_NAME || 'ERSA Ulaşım';

      const intervalText = {
        '30_days': '30 Gün İçinde Bitiyor',
        '15_days': '15 Gün İçinde Bitiyor',
        '7_days': '7 Gün İçinde Bitiyor',
        'expired': 'Süresi Doldu'
      };

      console.log(`📧 Preparing to send ${interval} notification for ${policies.length} policies...`);

      // Get access token
      const accessToken = await this.getAccessToken();

      // Generate HTML and encode to Base64
      const htmlContent = this.generateExpirationEmailHTML(policies, interval);
      const htmlBase64 = Buffer.from(htmlContent).toString('base64');

      const emailData = {
        email: {
          html: htmlBase64,
          text: `Poliçe Süre Uyarısı: ${policies.length} poliçe ${intervalText[interval]}`,
          subject: `⚠️ Poliçe Süre Uyarısı: ${policies.length} Poliçe ${intervalText[interval]}`,
          from: {
            name: senderName,
            email: senderEmail
          },
          to: [
            {
              name: 'Sistem Yöneticisi',
              email: recipientEmail
            }
          ]
        }
      };

      return new Promise((resolve, reject) => {
        const postData = JSON.stringify(emailData);

        const options = {
          hostname: 'api.sendpulse.com',
          port: 443,
          path: '/smtp/emails',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const req = https.request(options, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              const response = JSON.parse(data);

              if (response.result === true || response.id) {
                console.log(`✅ Sent ${interval} notification email successfully`);
                console.log(`📧 Email ID: ${response.id}`);
                resolve(true);
              } else {
                console.error(`❌ Failed to send ${interval} notification email:`, data);
                resolve(false);
              }
            } catch (error) {
              console.error('❌ Failed to parse SendPulse response:', error);
              resolve(false);
            }
          });
        });

        req.on('error', (error) => {
          console.error('❌ Network error while sending email:', error.message);
          resolve(false);
        });

        req.write(postData);
        req.end();
      });
    } catch (error) {
      console.error(`❌ Error in sendExpirationNotification for ${interval}:`, error);
      return false;
    }
  }

  /**
   * Main orchestration method - runs daily notification check
   */
  async runDailyNotificationCheck(): Promise<void> {
    console.log('🔔 Starting daily policy expiration notification check...');
    console.log(`📅 Current date: ${new Date().toLocaleString('tr-TR')}`);

    try {
      // Step 1: Check for expiring policies
      const policiesByInterval = await this.checkExpiringPolicies();

      // Step 2: Send notifications for each interval that has policies
      const intervals: NotificationInterval[] = ['expired', '7_days', '15_days', '30_days'];
      let totalNotificationsSent = 0;

      for (const interval of intervals) {
        const policies = policiesByInterval[interval];

        if (policies.length > 0) {
          console.log(`📬 Sending notification for ${interval}: ${policies.length} policies`);

          try {
            const emailSent = await this.sendExpirationNotification(policies, interval);

            if (emailSent) {
              totalNotificationsSent++;
              console.log(`✅ Successfully sent ${interval} notification`);
            } else {
              console.error(`❌ Failed to send ${interval} notification email`);
            }
          } catch (error) {
            console.error(`❌ Error sending ${interval} notifications:`, error);
            // Continue with next interval even if this one fails
          }
        } else {
          console.log(`ℹ️  No policies for ${interval} interval`);
        }
      }

      console.log(`✅ Daily notification check completed. Sent ${totalNotificationsSent} email(s)`);
    } catch (error) {
      console.error('❌ Error in daily notification check:', error);
      throw error;
    }
  }
}

// Singleton instance
export const policyNotificationService = new PolicyNotificationService();
