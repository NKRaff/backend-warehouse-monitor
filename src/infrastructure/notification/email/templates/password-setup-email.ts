import type { NotificationMessage } from "@application/types/notification-message.js";
import { env } from "@infrastructure/config/env.js";
import { renderBaseEmailLayout } from "../layouts/base-email-layout.js";
import { renderActionButton } from "../layouts/components/action-button.js";
import {
	escapeHtml,
	renderParagraphs,
} from "../layouts/components/html-utils.js";

export function renderPasswordSetupEmail(
	notification: NotificationMessage,
): string {
	const name = escapeHtml(notification.recipient.name);
	const url = `${env.app.url}?token=${notification.metadata?.token}`;

	const content = `
		<h1 style="
			margin: 0 0 20px;
			color: #0f172a;
			font-size: 24px;
		">
			Defina sua senha
		</h1>

		<p>Olá, <strong>${name}</strong>.</p>

		${renderParagraphs(
			notification.message ||
				"Use o botão abaixo para definir a senha da sua conta. " +
					"Este link é válido por 15 minutos.",
		)}

		${
			typeof url === "string"
				? renderActionButton({
						url,
						label: "Criar minha senha",
					})
				: ""
		}

		<p style="
			margin-top: 24px;
			color: #64748b;
			font-size: 13px;
			line-height: 1.6;
		">
			Por segurança, não compartilhe este link. Se ele expirar,
			solicite um novo.
		</p>
	`;

	return renderBaseEmailLayout({
		title: notification.title,
		subtitle: "Configuração de acesso",
		content,
		footerNote:
			"Se você não esperava este convite, entre em contato com o administrador.",
	});
}
