import https from 'https';

interface PersonnelEmailData {
  name: string;
  surname: string;
  tcNo?: string | null;
  birthdate?: string | null;
  nationName?: string | null;
  birthplaceName?: string | null;
  address?: string | null;
  phoneNo?: string | null;
  iban?: string | null;
  status?: string | null;
  isActive: boolean;
  companyId?: number | null;
}

class SendPulseService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    console.log('✅ SendPulse Service initialized (REST API)');
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

  private generateEmailHTML(data: PersonnelEmailData): string {
    const fullName = `${data.name} ${data.surname}`;
    const statusText = data.isActive ? '✅ Aktif' : '❌ Pasif';
    const statusColor = data.isActive ? '#10b981' : '#ef4444';

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Yeni Personel Kaydı</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                                🎉 Yeni Personel Kaydı
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                                Filoki Personel Yönetim Sistemi
                            </p>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                Sisteme yeni bir personel kaydı eklenmiştir. Detaylar aşağıda yer almaktadır:
                            </p>

                            <!-- Personnel Info Cards -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                                <!-- Name -->
                                <tr>
                                    <td style="padding: 15px; background-color: #f9fafb; border-left: 4px solid #667eea; margin-bottom: 12px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="width: 30px; vertical-align: top;">
                                                    <span style="font-size: 20px;">👤</span>
                                                </td>
                                                <td>
                                                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                                                        Ad Soyad
                                                    </p>
                                                    <p style="margin: 5px 0 0 0; color: #1f2937; font-size: 16px; font-weight: 600;">
                                                        ${fullName}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Spacing -->
                                <tr><td style="height: 12px;"></td></tr>

                                ${data.tcNo ? `
                                <!-- TC No -->
                                <tr>
                                    <td style="padding: 15px; background-color: #f9fafb; border-left: 4px solid #8b5cf6;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="width: 30px; vertical-align: top;">
                                                    <span style="font-size: 20px;">🆔</span>
                                                </td>
                                                <td>
                                                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                                                        TC Kimlik No
                                                    </p>
                                                    <p style="margin: 5px 0 0 0; color: #1f2937; font-size: 16px; font-weight: 600;">
                                                        ${data.tcNo}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td style="height: 12px;"></td></tr>
                                ` : ''}

                                ${data.birthdate ? `
                                <!-- Birthdate -->
                                <tr>
                                    <td style="padding: 15px; background-color: #f9fafb; border-left: 4px solid #06b6d4;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="width: 30px; vertical-align: top;">
                                                    <span style="font-size: 20px;">📅</span>
                                                </td>
                                                <td>
                                                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                                                        Doğum Tarihi
                                                    </p>
                                                    <p style="margin: 5px 0 0 0; color: #1f2937; font-size: 16px; font-weight: 600;">
                                                        ${new Date(data.birthdate).toLocaleDateString('tr-TR')}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td style="height: 12px;"></td></tr>
                                ` : ''}

                                ${data.nationName ? `
                                <!-- Nation -->
                                <tr>
                                    <td style="padding: 15px; background-color: #f9fafb; border-left: 4px solid #10b981;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="width: 30px; vertical-align: top;">
                                                    <span style="font-size: 20px;">🌍</span>
                                                </td>
                                                <td>
                                                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                                                        Uyruk
                                                    </p>
                                                    <p style="margin: 5px 0 0 0; color: #1f2937; font-size: 16px; font-weight: 600;">
                                                        ${data.nationName}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td style="height: 12px;"></td></tr>
                                ` : ''}

                                ${data.birthplaceName ? `
                                <!-- Birthplace -->
                                <tr>
                                    <td style="padding: 15px; background-color: #f9fafb; border-left: 4px solid #f59e0b;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="width: 30px; vertical-align: top;">
                                                    <span style="font-size: 20px;">🏙️</span>
                                                </td>
                                                <td>
                                                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                                                        Doğum Yeri
                                                    </p>
                                                    <p style="margin: 5px 0 0 0; color: #1f2937; font-size: 16px; font-weight: 600;">
                                                        ${data.birthplaceName}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td style="height: 12px;"></td></tr>
                                ` : ''}

                                ${data.phoneNo ? `
                                <!-- Phone -->
                                <tr>
                                    <td style="padding: 15px; background-color: #f9fafb; border-left: 4px solid #3b82f6;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="width: 30px; vertical-align: top;">
                                                    <span style="font-size: 20px;">📞</span>
                                                </td>
                                                <td>
                                                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                                                        Telefon
                                                    </p>
                                                    <p style="margin: 5px 0 0 0; color: #1f2937; font-size: 16px; font-weight: 600;">
                                                        ${data.phoneNo}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td style="height: 12px;"></td></tr>
                                ` : ''}

                                ${data.address ? `
                                <!-- Address -->
                                <tr>
                                    <td style="padding: 15px; background-color: #f9fafb; border-left: 4px solid #ec4899;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="width: 30px; vertical-align: top;">
                                                    <span style="font-size: 20px;">📍</span>
                                                </td>
                                                <td>
                                                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                                                        Adres
                                                    </p>
                                                    <p style="margin: 5px 0 0 0; color: #1f2937; font-size: 16px; font-weight: 600;">
                                                        ${data.address}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td style="height: 12px;"></td></tr>
                                ` : ''}

                                ${data.iban ? `
                                <!-- IBAN -->
                                <tr>
                                    <td style="padding: 15px; background-color: #f9fafb; border-left: 4px solid #14b8a6;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="width: 30px; vertical-align: top;">
                                                    <span style="font-size: 20px;">💳</span>
                                                </td>
                                                <td>
                                                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                                                        IBAN
                                                    </p>
                                                    <p style="margin: 5px 0 0 0; color: #1f2937; font-size: 16px; font-weight: 600;">
                                                        ${data.iban}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td style="height: 12px;"></td></tr>
                                ` : ''}

                                <!-- Status -->
                                <tr>
                                    <td style="padding: 15px; background-color: #f9fafb; border-left: 4px solid ${statusColor};">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="width: 30px; vertical-align: top;">
                                                    <span style="font-size: 20px;">${data.isActive ? '✅' : '❌'}</span>
                                                </td>
                                                <td>
                                                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                                                        Durum
                                                    </p>
                                                    <p style="margin: 5px 0 0 0; color: ${statusColor}; font-size: 16px; font-weight: 600;">
                                                        ${statusText}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Info Box -->
                            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin-top: 30px;">
                                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                                    <strong>ℹ️ Bilgi:</strong> Bu e-posta otomatik olarak Filoki Personel Yönetim Sistemi tarafından gönderilmiştir.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                                © ${new Date().getFullYear()} Filoki Personel Yönetim Sistemi<br>
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

  private generatePasswordResetEmailHTML(resetUrl: string, userName?: string): string {
    const greeting = userName ? `Merhaba ${userName},` : 'Merhaba,';

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Parola Sıfırlama</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                                Parola Sıfırlama
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                                Filoki Filo Yönetim Sistemi
                            </p>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                ${greeting}
                            </p>
                            <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                Hesabınız için bir parola sıfırlama talebi aldık. Parolanızı sıfırlamak için aşağıdaki butona tıklayın:
                            </p>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                                <tr>
                                    <td align="center">
                                        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: 600;">
                                            Parolamı Sıfırla
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Warning Box -->
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
                                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                                    <strong>Dikkat:</strong> Bu bağlantı 30 dakika içinde geçerliliğini yitirecektir.
                                </p>
                            </div>

                            <!-- Security Notice -->
                            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px;">
                                <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                                    <strong>Güvenlik Uyarısı:</strong> Bu talebi siz yapmadıysanız, bu e-postayı görmezden gelin. Parolanız değişmeyecektir.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                                &copy; ${new Date().getFullYear()} Filoki Filo Yönetim Sistemi<br>
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
   * Şifre sıfırlama e-postası gönderir
   */
  public async sendPasswordResetEmail(
    recipientEmail: string,
    resetUrl: string,
    userName?: string
  ): Promise<boolean> {
    try {
      const senderEmail = process.env.SENDPULSE_SENDER_EMAIL || 'info@ersaulasim.com';
      const senderName = process.env.SENDPULSE_SENDER_NAME || 'ERSA Ulaşım';

      console.log('📧 Preparing to send password reset email to:', recipientEmail);
      const accessToken = await this.getAccessToken();

      const htmlContent = this.generatePasswordResetEmailHTML(resetUrl, userName);
      const htmlBase64 = Buffer.from(htmlContent).toString('base64');

      const emailData = {
        email: {
          html: htmlBase64,
          text: `Parola sıfırlama bağlantınız: ${resetUrl} - Bu bağlantı 30 dakika geçerlidir.`,
          subject: 'Parola Sıfırlama Talebi - Filoki',
          from: {
            name: senderName,
            email: senderEmail
          },
          to: [
            {
              name: recipientEmail,
              email: recipientEmail
            }
          ]
        }
      };

      return new Promise((resolve) => {
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
                console.log('✅ Password reset email sent successfully to:', recipientEmail);
                resolve(true);
              } else {
                console.error('❌ Failed to send password reset email:', data);
                resolve(false);
              }
            } catch (error) {
              console.error('❌ Failed to parse SendPulse response:', error);
              resolve(false);
            }
          });
        });

        req.on('error', (error) => {
          console.error('❌ Network error while sending password reset email:', error.message);
          resolve(false);
        });

        req.write(postData);
        req.end();
      });
    } catch (error) {
      console.error('❌ Error in sendPasswordResetEmail:', error);
      return false;
    }
  }

  /**
   * Yeni personel kaydı oluşturulduğunda email gönderir
   */
  public async sendPersonnelCreatedEmail(personnelData: PersonnelEmailData): Promise<boolean> {
    try {
      const recipientEmail = process.env.SENDPULSE_RECIPIENT_EMAIL || 'info@ersaulasim.com';
      const senderEmail = process.env.SENDPULSE_SENDER_EMAIL || 'info@ersaulasim.com';
      const senderName = process.env.SENDPULSE_SENDER_NAME || 'ERSA Ulaşım';

      // Get access token
      console.log('📧 Preparing to send personnel creation email...');
      const accessToken = await this.getAccessToken();

      // Generate HTML and encode to Base64
      const htmlContent = this.generateEmailHTML(personnelData);
      const htmlBase64 = Buffer.from(htmlContent).toString('base64');

      const emailData = {
        email: {
          html: htmlBase64,
          text: `Yeni Personel Kaydı: ${personnelData.name} ${personnelData.surname}`,
          subject: `🎉 Yeni Personel Kaydı: ${personnelData.name} ${personnelData.surname}`,
          from: {
            name: senderName,
            email: senderEmail
          },
          to: [
            {
              name: 'Personel Yönetimi',
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
                console.log('✅ Personnel creation email sent successfully:', personnelData.name, personnelData.surname);
                console.log('📧 Email ID:', response.id);
                resolve(true);
              } else {
                console.error('❌ Failed to send personnel creation email:', data);
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
      console.error('❌ Error in sendPersonnelCreatedEmail:', error);
      return false;
    }
  }
}

// Singleton instance
export const sendPulseService = new SendPulseService();
