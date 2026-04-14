import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Blueprint, request, jsonify
import os
from dotenv import load_dotenv

load_dotenv()

sos_bp = Blueprint('sos', __name__)

@sos_bp.route('/api/sos/email', methods=['POST'])
def send_sos_email():
    """
    Sends emergency SOS emails to a list of contacts using Python's smtplib.
    Requires SMTP_EMAIL and SMTP_PASSWORD in backend/.env
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    emails = data.get('emails', [])
    location_url = data.get('location_url', 'Location unavailable')
    time = data.get('time', 'Unknown time')
    sender_name = data.get('sender_name', 'A SafeHer User')

    sender_email = os.environ.get('SMTP_EMAIL')
    sender_password = os.environ.get('SMTP_PASSWORD')

    if not sender_email or not sender_password:
        return jsonify({'error': 'SMTP credentials not configured in backend/.env'}), 500

    if not emails:
        return jsonify({'message': 'No email contacts to send to'}), 200

    try:
        # Setup Gmail SMTP Server
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)

        for to_email in emails:
            msg = MIMEMultipart()
            msg['From'] = f"SafeHer Emergency <{sender_email}>"
            msg['To'] = to_email
            msg['Subject'] = f"🚨 EMERGENCY ALERT from {sender_name}"

            html_body = f"""
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #FF3366; border-radius: 10px; max-width: 600px;">
                <h2 style="color: #FF3366; margin-top: 0;">🚨 EMERGENCY ALERT</h2>
                <p><strong>{sender_name}</strong> has triggered an SOS alert and needs immediate help!</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #FF3366; margin: 20px 0;">
                    <p style="margin: 0 0 10px 0;"><strong>📍 Location:</strong> <br>
                    <a href="{location_url}" style="color: #6C63FF; text-decoration: none;">View on Google Maps</a></p>
                    <p style="margin: 0;"><strong>⏰ Time of Alert:</strong> <br>{time}</p>
                </div>
                <p style="color: #666; font-size: 12px; margin-bottom: 0;">
                    This is an automated message sent via the SafeHer Women Safety System.
                </p>
            </div>
            """
            msg.attach(MIMEText(html_body, 'html'))
            server.send_message(msg)

        server.quit()
        return jsonify({'message': f'SOS emails sent successfully to {len(emails)} contacts'}), 200

    except Exception as e:
        print("SMTP Error:", str(e))
        return jsonify({'error': str(e)}), 500
