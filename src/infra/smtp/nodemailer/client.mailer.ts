import nodemailer from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js'
import type { Mailer } from '../mailer.interface.js'

export class Nodemailer implements Mailer {
  private transporter: nodemailer.Transporter

  private constructor() {
    const options: SMTPTransport.Options = {
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    }

    this.transporter = nodemailer.createTransport(options)
    console.log(`✉️  Mailer SMTP configurado`)
  }

  public static create() {
    return new Nodemailer()
  }

  public async sendMail({ to, subject, html, text }: any): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject,
      html,
      text,
    })
  }
}
