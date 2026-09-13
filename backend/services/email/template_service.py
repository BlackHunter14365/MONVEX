"""
MONVEX Transactional Email Template System
Centralized, branded email templates for OTP verification and transactional notifications.
Strictly separates email presentation from transport logic.
"""
from typing import Dict


class EmailTemplateService:
    """
    Renders standardized, branded MONVEX transactional email messages with
    responsive dark-theme HTML and plain-text fallbacks.
    """

    @classmethod
    def render_otp_email(
        cls,
        purpose: str,
        raw_otp: str,
        username: str = "",
        expiry_minutes: int = 10,
        sender_email: str = "security@monvex.ai",
    ) -> Dict[str, str]:
        """
        Renders an OTP verification email for the specified purpose.

        Returns:
            {
                "subject": str,
                "plain_text": str,
                "html_content": str
            }
        """
        purpose_normalized = purpose.strip().upper() if purpose else "REGISTRATION"
        is_login = purpose_normalized == "LOGIN"
        is_reset = purpose_normalized in ["PASSWORD_RESET", "RESET_PASSWORD"]

        if is_login:
            subject = "MONVEX Login Verification Code"
            badge_text = "Login Verification"
            headline = "Authorize Your Sign-In"
            subhead = "Use the following single-use verification code to complete your MONVEX login:"
        elif is_reset:
            subject = "MONVEX Password Reset Code"
            badge_text = "Password Reset"
            headline = "Reset Your Password"
            subhead = "Use the following verification code to proceed with resetting your MONVEX password:"
        else:
            subject = "Verify your MONVEX account"
            badge_text = "Email Verification"
            headline = "Verify Your Email Address"
            subhead = "Use the following verification code to complete your MONVEX registration:"

        greeting = f"Hello {username.strip()}," if username else "Hello,"

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0B0F19;
      color: #E2E8F0;
      margin: 0;
      padding: 32px 16px;
      -webkit-font-smoothing: antialiased;
    }}
    .container {{
      max-width: 480px;
      margin: 0 auto;
      background-color: #111827;
      border: 1px solid #1F2937;
      border-radius: 20px;
      padding: 36px 28px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    }}
    .brand-header {{
      text-align: center;
      margin-bottom: 28px;
    }}
    .brand-title {{
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 2px;
      color: #FFFFFF;
      margin: 0;
    }}
    .brand-subtitle {{
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #94A3B8;
      margin-top: 4px;
    }}
    .badge {{
      display: inline-block;
      background-color: #1E293B;
      border: 1px solid #334155;
      color: #38BDF8;
      border-radius: 9999px;
      padding: 4px 12px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
    }}
    .headline {{
      font-size: 20px;
      font-weight: 700;
      color: #F8FAFC;
      margin: 0 0 12px 0;
      text-align: center;
    }}
    .greeting {{
      font-size: 14px;
      font-weight: 600;
      color: #CBD5E1;
      margin: 0 0 8px 0;
    }}
    .info-text {{
      font-size: 13px;
      line-height: 1.6;
      color: #94A3B8;
      margin: 0 0 24px 0;
    }}
    .otp-card {{
      background: linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%);
      border: 1px solid #3730A3;
      border-radius: 16px;
      padding: 24px 16px;
      text-align: center;
      margin: 24px 0;
    }}
    .otp-code {{
      font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
      font-size: 38px;
      font-weight: 900;
      letter-spacing: 10px;
      color: #38BDF8;
      text-shadow: 0 0 24px rgba(56, 189, 248, 0.35);
      margin: 0;
    }}
    .otp-caption {{
      font-size: 11px;
      color: #94A3B8;
      margin-top: 8px;
      font-weight: 500;
    }}
    .warning-box {{
      background-color: #181E2E;
      border-left: 3px solid #F59E0B;
      padding: 12px 14px;
      border-radius: 8px;
      font-size: 12px;
      line-height: 1.5;
      color: #FDE68A;
      margin: 20px 0;
    }}
    .footer {{
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #1F2937;
      font-size: 11px;
      line-height: 1.5;
      color: #64748B;
      text-align: center;
    }}
    .footer a {{
      color: #38BDF8;
      text-decoration: none;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="brand-header">
      <h1 class="brand-title">MONVEX</h1>
      <div class="brand-subtitle">Financial Intelligence Platform</div>
    </div>

    <div style="text-align: center;">
      <span class="badge">{badge_text}</span>
    </div>

    <h2 class="headline">{headline}</h2>
    <p class="greeting">{greeting}</p>
    <p class="info-text">{subhead}</p>

    <div class="otp-card">
      <div class="otp-code">{raw_otp}</div>
      <div class="otp-caption">One-Time Verification Passcode</div>
    </div>

    <div class="warning-box">
      <strong>Security Notice:</strong> This code expires in <strong>{expiry_minutes} minutes</strong>. For your protection, never share this code with anyone. MONVEX staff will never ask for your verification code.
    </div>

    <div class="footer">
      This is an automated security transmission from <strong>MONVEX</strong>.<br>
      Sent from <a href="mailto:{sender_email}">{sender_email}</a> &bull; Please do not reply directly to this email.
    </div>
  </div>
</body>
</html>"""

        plain_text = (
            f"MONVEX — {headline}\n\n"
            f"{greeting}\n\n"
            f"{subhead}\n\n"
            f"VERIFICATION CODE: {raw_otp}\n\n"
            f"This code will expire in {expiry_minutes} minutes.\n"
            f"For your protection, never share this code with anyone.\n"
            f"MONVEX staff will never ask for your verification code.\n\n"
            f"MONVEX Security Team\n"
            f"Sent from: {sender_email}\n"
        )

        return {
            "subject": subject,
            "plain_text": plain_text,
            "html_content": html_content,
        }
