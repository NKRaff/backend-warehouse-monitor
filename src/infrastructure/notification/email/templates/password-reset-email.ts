import type { NotificationMessage } from "@application/types/notification-message.js";
import { renderBaseEmailLayout } from "../layouts/base-email-layout.js";
import { renderActionButton } from "../layouts/components/action-button.js";
import {
	escapeHtml,
	renderParagraphs,
} from "../layouts/components/html-utils.js";

export function renderPasswordResetEmail(
	notification: NotificationMessage,
): string {
	const name = escapeHtml(notification.recipient.name);
	const url = notification.metadata?.actionUrl;

	const content = `
		<h1 style="
			margin: 0 0 20px;
			color: #0f172a;
			font-size: 24px;
		">
			Redefinição de senha
		</h1>

		<p>Olá, <strong>${name}</strong>.</p>

		${renderParagraphs(
			notification.message ||
				"Recebemos uma solicitação para redefinir a senha da sua conta. " +
					"Se foi você, utilize o botão abaixo. " +
					"O link expira em 15 minutos.",
		)}

		${
			typeof url === "string"
				? renderActionButton({
						url,
						label: "Redefinir minha senha",
					})
				: ""
		}

		<p style="
			margin-top: 24px;
			color: #64748b;
			font-size: 13px;
			line-height: 1.6;
		">
			Se você não solicitou a redefinição, ignore este e-mail.
			Sua senha atual não deve ser alterada por esta solicitação.
		</p>
	`;

	return renderBaseEmailLayout({
		appName: "Warehouse Monitor",
		title: notification.title,
		subtitle: "Segurança da conta",
		content,
		footerNote:
			"Por segurança, nunca compartilhe links de redefinição de senha.",
	});
}
