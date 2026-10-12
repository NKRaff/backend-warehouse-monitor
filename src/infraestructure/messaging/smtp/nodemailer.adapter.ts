import type { SmtpClient } from "@application/ports/smtp-client.interface.js";
import { createTransport, type Transporter } from "nodemailer";
import { env } from "../../config/env.js";

export class NodemailerAdapter implements SmtpClient {
	private static _instance: NodemailerAdapter;
	private _mailer: Transporter;

	private constructor() {
		this._mailer = createTransport({
			host: env.smtp.host,
			port: env.smtp.port,
			secure: env.smtp.secure,
			auth: {
				user: env.smtp.user,
				pass: env.smtp.password,
			},
		});

		console.log(`✉️  Mailer SMTP configurado`);
	}

	static instance(): NodemailerAdapter {
		if (!NodemailerAdapter._instance) {
			NodemailerAdapter._instance = new NodemailerAdapter();
		}
		return NodemailerAdapter._instance;
	}

	async sendMail(options: {
		to: string;
		subject: string;
		html?: string;
		text?: string;
	}): Promise<void> {
		await this._mailer.sendMail({
			from: env.smtp.from,
			to: options.to,
			subject: options.subject,
			html: options.html,
			text: options.text,
		});
	}
}
