const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  // Initialize email transporter
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify transporter configuration
      if (process.env.NODE_ENV === 'development') {
        this.transporter.verify((error, success) => {
          if (error) {
            console.warn('Email service not configured properly:', error.message);
          } else {
            console.log('✅ Email service is ready');
          }
        });
      }
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
    }
  }

  // Send verification email
  async sendVerificationEmail(email, token) {
    if (!this.transporter) {
      console.warn('Email service not configured. Verification email not sent.');
      return;
    }

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@cinematch.com',
      to: email,
      subject: 'CineMatch - Email Doğrulama',
      html: `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Doğrulama</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 300;
            }
            .content {
              padding: 40px 30px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              padding: 15px 30px;
              border-radius: 25px;
              font-weight: bold;
              margin: 20px 0;
              transition: transform 0.2s;
            }
            .button:hover {
              transform: translateY(-2px);
            }
            .footer {
              background: #f8f9fa;
              padding: 20px 30px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              color: #856404;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎬 CineMatch</h1>
              <p>Hoş geldiniz! Email adresinizi doğrulayın</p>
            </div>
            
            <div class="content">
              <h2>Merhaba!</h2>
              <p>CineMatch hesabınıza hoş geldiniz! Email adresinizi doğrulamak için aşağıdaki butona tıklayın:</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Email Adresimi Doğrula</a>
              </div>
              
              <div class="warning">
                <strong>⚠️ Güvenlik Uyarısı:</strong><br>
                Bu linki sadece siz istediyseniz tıklayın. Link 24 saat içinde geçersiz olacaktır.
              </div>
              
              <p>Eğer buton çalışmıyorsa, aşağıdaki linki tarayıcınıza kopyalayabilirsiniz:</p>
              <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px;">
                ${verificationUrl}
              </p>
              
              <p>Bu işlemi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.</p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} CineMatch. Tüm hakları saklıdır.</p>
              <p>Bu otomatik bir emaildir, lütfen yanıtlamayın.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Verification email sent to ${email}`);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw error;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email, token) {
    if (!this.transporter) {
      console.warn('Email service not configured. Password reset email not sent.');
      return;
    }

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@cinematch.com',
      to: email,
      subject: 'CineMatch - Şifre Sıfırlama',
      html: `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Şifre Sıfırlama</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 300;
            }
            .content {
              padding: 40px 30px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%);
              color: white;
              text-decoration: none;
              padding: 15px 30px;
              border-radius: 25px;
              font-weight: bold;
              margin: 20px 0;
              transition: transform 0.2s;
            }
            .button:hover {
              transform: translateY(-2px);
            }
            .footer {
              background: #f8f9fa;
              padding: 20px 30px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            .warning {
              background: #f8d7da;
              border: 1px solid #f5c6cb;
              color: #721c24;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .timer {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              color: #856404;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 CineMatch</h1>
              <p>Şifre Sıfırlama Talebi</p>
            </div>
            
            <div class="content">
              <h2>Şifrenizi sıfırlayın</h2>
              <p>Hesabınız için şifre sıfırlama talebinde bulundunuz. Yeni şifre oluşturmak için aşağıdaki butona tıklayın:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Şifremi Sıfırla</a>
              </div>
              
              <div class="timer">
                <strong>⏰ Dikkat:</strong><br>
                Bu link sadece <strong>1 saat</strong> boyunca geçerlidir.
              </div>
              
              <div class="warning">
                <strong>🚨 Güvenlik Uyarısı:</strong><br>
                Bu talebi siz yapmadıysanız, hesabınız güvende. Bu emaili görmezden gelebilirsiniz.
                Eğer şüpheli bir durum varsa, hemen bizimle iletişime geçin.
              </div>
              
              <p>Eğer buton çalışmıyorsa, aşağıdaki linki tarayıcınıza kopyalayabilirsiniz:</p>
              <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px;">
                ${resetUrl}
              </p>
              
              <h3>Güvenlik İpuçları:</h3>
              <ul>
                <li>Güçlü bir şifre seçin (en az 8 karakter)</li>
                <li>Büyük/küçük harf, rakam ve özel karakter kullanın</li>
                <li>Şifrenizi kimseyle paylaşmayın</li>
                <li>Düzenli olarak şifrenizi değiştirin</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} CineMatch. Tüm hakları saklıdır.</p>
              <p>Bu otomatik bir emaildir, lütfen yanıtlamayın.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${email}`);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw error;
    }
  }

  // Send welcome email
  async sendWelcomeEmail(email, firstName) {
    if (!this.transporter) {
      console.warn('Email service not configured. Welcome email not sent.');
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@cinematch.com',
      to: email,
      subject: 'CineMatch\'e Hoş Geldiniz! 🎬',
      html: `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Hoş Geldiniz</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 300;
            }
            .content {
              padding: 40px 30px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
              color: white;
              text-decoration: none;
              padding: 15px 30px;
              border-radius: 25px;
              font-weight: bold;
              margin: 20px 0;
              transition: transform 0.2s;
            }
            .button:hover {
              transform: translateY(-2px);
            }
            .footer {
              background: #f8f9fa;
              padding: 20px 30px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            .feature {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎬 CineMatch</h1>
              <p>Hoş geldiniz ${firstName}!</p>
            </div>
            
            <div class="content">
              <h2>Sinema dünyasına yolculuğunuz başlıyor! 🍿</h2>
              
              <p>CineMatch ailesine katıldığınız için çok mutluyuz! Artık kişiselleştirilmiş film önerilerimizden yararlanabilirsiniz.</p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}" class="button">Keşfetmeye Başla</a>
              </div>
              
              <h3>Neler yapabilirsiniz?</h3>
              
              <div class="feature">
                <strong>🤖 AI Film Önerileri</strong><br>
                Beğenilerinizi öğrenen yapay zeka sistemiyle kişiselleştirilmiş öneriler alın.
              </div>
              
              <div class="feature">
                <strong>⭐ Film Puanlama</strong><br>
                İzlediğiniz filmleri puanlayın ve sistemin sizi daha iyi tanımasını sağlayın.
              </div>
              
              <div class="feature">
                <strong>📝 İzleme Listesi</strong><br>
                İzlemek istediğiniz filmleri listenize ekleyin ve takip edin.
              </div>
              
              <div class="feature">
                <strong>🎭 Filmografi Keşfi</strong><br>
                Favori oyuncularınızın tüm filmografisini keşfedin.
              </div>
              
              <h3>İlk adımlar:</h3>
              <ol>
                <li>En az 5 filmi puanlayarak başlayın</li>
                <li>İlk AI önerilerinizi alın</li>
                <li>İzleme listenizi oluşturun</li>
                <li>Profilinizi kişiselleştirin</li>
              </ol>
              
              <p>Herhangi bir sorunuz varsa bize ulaşmaktan çekinmeyin. İyi seyirler! 🎊</p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} CineMatch. Tüm hakları saklıdır.</p>
              <p>Bu otomatik bir emaildir, lütfen yanıtlamayın.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${email}`);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't throw error for welcome email
    }
  }

  // Test email configuration
  async testEmailConfig() {
    if (!this.transporter) {
      throw new Error('Email transporter not configured');
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'Email configuration is valid' };
    } catch (error) {
      throw new Error(`Email configuration error: ${error.message}`);
    }
  }
}

module.exports = new EmailService();