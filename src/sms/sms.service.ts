import { Injectable } from '@nestjs/common';
import * as Twilio from 'twilio';

@Injectable()
export class SmsService {
  private twilioClient: Twilio.Twilio;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID; // Your Account SID from www.twilio.com/console
    const authToken = process.env.TWILIO_AUTH_TOKEN; // Your Auth Token from www.twilio.com/console
    const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER; // Your Twilio phone number

    this.twilioClient = Twilio(accountSid, authToken);
  }

  async sendSms({ to, body }: { to: string; body: string }) {
    try {
      await this.twilioClient.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER, // Twilio phone number
        to, // Destination phone number
      });
      return { success: 1 };
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw new Error('Could not send SMS');
    }
  }
}
