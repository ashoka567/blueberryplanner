import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

export async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export async function sendVerificationEmail(
  toEmail: string, 
  userName: string, 
  verificationToken: string,
  baseUrl: string
) {
  try {
    const { client, fromEmail } = await getResendClient();
    const verificationLink = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;
    
    const { data, error } = await client.emails.send({
      from: fromEmail || 'Blueberry Planner <noreply@resend.dev>',
      to: toEmail,
      subject: 'Verify your Blueberry Planner account',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; width: 60px; height: 60px; background: #4F46E5; border-radius: 12px; line-height: 60px; font-size: 30px;">🫐</div>
                <h1 style="color: #4F46E5; margin: 16px 0 0; font-size: 24px;">Blueberry Planner</h1>
              </div>
              
              <h2 style="color: #1a1a1a; margin: 0 0 16px;">Welcome, ${userName}!</h2>
              <p style="color: #666; line-height: 1.6; margin: 0 0 24px;">
                Thank you for joining Blueberry Planner. Please verify your email address to complete your registration.
              </p>
              
              <a href="${verificationLink}" style="display: inline-block; background: #4F46E5; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
                Verify Email Address
              </a>
              
              <p style="color: #999; font-size: 14px; margin-top: 32px; line-height: 1.5;">
                If you didn't create an account, you can safely ignore this email.
              </p>
              <p style="color: #999; font-size: 12px; margin-top: 16px;">
                This link expires in 24 hours.
              </p>
            </div>
          </body>
        </html>
      `
    });

    if (error) {
      console.error('Error sending verification email:', error);
      return { success: false, error };
    }

    console.log('Verification email sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return { success: false, error };
  }
}
