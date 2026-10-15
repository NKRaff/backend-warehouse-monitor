import type { SmtpClient } from "@application/ports/smtp-client.interface.js";

export type SentMail = Parameters<SmtpClient["sendMail"]>[0];

/**
 * SMTP em memória: guarda os e-mails enviados em `outbox` e permite simular
 * falhas pontuais com `failNextWith`.
 */
export class FakeSmtpClient implements SmtpClient {
	readonly outbox: SentMail[] = [];
	private nextFailure: Error | undefined;

	async sendMail(options: SentMail): Promise<void> {
		if (this.nextFailure) {
			const error = this.nextFailure;
			this.nextFailure = undefined;
			throw error;
		}
		this.outbox.push(options);
	}

	failNextWith(error: Error): void {
		this.nextFailure = error;
	}

	lastMail(): SentMail | undefined {
		return this.outbox.at(-1);
	}

	reset(): void {
		this.outbox.length = 0;
		this.nextFailure = undefined;
	}
}

/** Extrai a senha temporária do texto do e-mail de boas-vindas. */
export function extractTemporaryPassword(
	mail: SentMail | undefined,
): string | undefined {
	return /Senha temporária:\s*(\S+)/.exec(mail?.text ?? "")?.[1];
}
