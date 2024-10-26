import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SendOtpMailDto } from './dto/send-otp-mail.dto';
const nodemailer = require('nodemailer');

@Injectable()
export class EmailService {
  async sendEmail(sendOtpMailDto: SendOtpMailDto) {
    try {
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
          user: process.env.USER_EMAIL,
          pass: process.env.USER_EMAIL_KEY,
        },
      });
      await transporter.sendMail({
        from: process.env.USER_EMAIL, // sender address
        ...sendOtpMailDto,
      });

      return { status: true, message: ' Email sent successfully' };
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new InternalServerErrorException('Failed to send email');
    }
  }
}
