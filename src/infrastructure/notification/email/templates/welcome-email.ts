import type { NotificationMessage } from "@application/types/notification-message.js";
import { env } from "@infrastructure/config/env.js";
import { renderBaseEmailLayout } from "../layouts/base-email-layout.js";
import { renderActionButton } from "../layouts/components/action-button.js";
import {
	escapeHtml,
	renderParagraphs,
} from "../layouts/components/html-utils.js";

export function renderWelcomeEmail(notification: NotificationMessage): string {
	const name = escapeHtml(notification.recipient.name);
	const url = notification.metadata?.actionUrl;

	const content = `
		<h1 style="
			margin: 0 0 20px;
			color: #0f172a;
			font-size: 24px;
			line-height: 1.3;
		">
			Bem-vindo ao ${escapeHtml(env.app.name)}!
		</h1>

		<p>Olá, <strong>${name}</strong>.</p>

		${renderParagraphs(
			notification.message ||
				"Sua conta foi criada por um administrador. " +
					"Para começar, defina sua senha de acesso.",
		)}

		${
			typeof url === "string"
				? renderActionButton({
						url,
						label: "Definir minha senha",
					})
				: ""
		}

		<p style="
			margin-top: 24px;
			color: #64748b;
			font-size: 13px;
		">
			Se você não esperava receber este e-mail,
			entre em contato com o administrador do sistema.
		</p>
	`;

	return renderBaseEmailLayout({
		title: notification.title,
		subtitle: "Sua conta está pronta para configuração",
		content,
	});
}
