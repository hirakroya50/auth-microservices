import { Injectable } from '@nestjs/common';
import { GenerateOtpDto } from './dto/genarate-otp.dto';

@Injectable()
export class AuthService {
  constructor() {}

  async generateOtp({ generateOtpDto }: { generateOtpDto: GenerateOtpDto }) {
    const xxx = 'working....';
    //take the email
    // check its already exist in the mail or not
    // valid email or not
    // if only if all thing are oke then send the email to "otpsend" function that will have
    // tle logic for otp genaration and there will have a "emailSend" function that will only send the email:
    // that will have tow argument one is email type: "otp-gen", and necessery data to send the email
    // that emailsend function will sed the work in a messegeque that will handel the email send process
    // then send the response
    return { status: xxx };
  }
}
