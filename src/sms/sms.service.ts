import { BadRequestException, Injectable } from '@nestjs/common';
import * as Twilio from 'twilio';

@Injectable()
export class SmsService {
  private twilioClient: Twilio.Twilio;
  private otpRequestLog = new Map<string, number[]>();
  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID; // Your Account SID from www.twilio.com/console
    const authToken = process.env.TWILIO_AUTH_TOKEN; // Your Auth Token from www.twilio.com/console
    const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER; // Your Twilio phone number

    this.twilioClient = Twilio(accountSid, authToken);
  }
  // rate limiting by phone no
  // IMPORTENT UPDATE :
  /*
   using in memory storate is not good , 
   for that we can use redis to temp store the data ,
  */

  private isRateLimited(phoneNumber: string): boolean {
    const allRequestTimes = this.otpRequestLog.get(phoneNumber) || [];
    const now = Date.now();
    const Time_Range_For_rate_limiting = 6 * 1000; // 6 seconds
    const No_of_requests = 3;

    // Filter out timestamps outside the rate limit window
    /* this filter will find the request in the time span . 
        if the requests are within the time frame then it will add them to the recentRequests array
        if the recentRequests array length is grater then then (No_of_requests) then it will give error 
     */
    const recentRequests = allRequestTimes.filter((time, i) => {
      return now - time < Time_Range_For_rate_limiting;
    });

    recentRequests.push(now);

    this.otpRequestLog.set(phoneNumber, recentRequests);

    return recentRequests.length > No_of_requests;
  }

  async sendSms({ to, body }: { to: string; body: string }) {
    if (this.isRateLimited(to)) {
      throw new BadRequestException('Rate limit exceeded. Try again later.');
    }

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
