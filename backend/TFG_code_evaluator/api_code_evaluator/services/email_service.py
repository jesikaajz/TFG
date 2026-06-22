import os
import ssl
import secrets
import string
import smtplib
from email.message import EmailMessage

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
EMAIL_FROM = os.getenv("EMAIL_FROM", SMTP_USER)
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")


def generate_random_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def send_temporary_password(recipient_email: str, temporary_password: str, user_name: str | None = None) -> None:
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASSWORD or not EMAIL_FROM:
        raise RuntimeError("SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD and EMAIL_FROM.")

    name = user_name or recipient_email
    subject = "Your temporary password for the system"
    body = (
        f"Hello {name},\n\n"
        "An account has been created for you. Please use the temporary password below to log in, then change your password immediately.\n\n"
        f"Temporary password: {temporary_password}\n\n"
        "For security reasons, this password can only be used once and must be changed after your first login.\n"
        "If you did not expect this email, please contact your administrator.\n\n"
        "Regards,\n"
        "The Team"
    )

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = EMAIL_FROM
    message["To"] = recipient_email
    message.set_content(body)

    if SMTP_USE_TLS:
        context = ssl.create_default_context()
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls(context=context)
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(message)
    else:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(message)

def send_reset_password_email(recipient_email: str, reset_link: str, user_name: str | None = None) -> None:
    """
    Envía un email con el enlace para restablecer la contraseña.
    """
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASSWORD or not EMAIL_FROM:
        raise RuntimeError("SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD and EMAIL_FROM.")

    name = user_name or recipient_email
    subject = "Restablece tu contraseña"
    
    body = f"""
Hola {name},

Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:

{reset_link}

Este enlace es válido por 1 hora.

Si no solicitaste este cambio, ignora este mensaje.

Saludos,
El equipo de Code Evaluator
"""
    
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = EMAIL_FROM
    message["To"] = recipient_email
    message.set_content(body)

    if SMTP_USE_TLS:
        context = ssl.create_default_context()
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls(context=context)
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(message)
    else:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(message)