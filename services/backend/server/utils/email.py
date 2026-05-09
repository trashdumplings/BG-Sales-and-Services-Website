import smtplib
from email.message import EmailMessage
from fastapi import BackgroundTasks
from ..config import get_settings

settings = get_settings()

def _can_send_email() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_PORT and settings.EMAIL_FROM)

def send_email(subject: str, body: str, to_email: str):
    """Low-level email sender. Meant to be called in background tasks."""
    if not _can_send_email():
        print("Email not sent - SMTP not configured")
        return
    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to_email
        msg.set_content(body)

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
        print(f"Email sent to {to_email}: {subject}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")

def schedule_email(background_tasks: BackgroundTasks, subject: str, body: str, to_email: str):
    if not _can_send_email():
        return
    background_tasks.add_task(send_email, subject, body, to_email)
