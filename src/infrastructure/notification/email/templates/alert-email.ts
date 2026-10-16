import type { NotificationMessage } from "@application/types/notification-message.js";
import { renderBaseEmailLayout } from "../layouts/base-email-layout.js";
import { renderActionButton } from "../layouts/components/action-button.js";
import {
	escapeHtml,
	renderParagraphs,
} from "../layouts/components/html-utils.js";

const severityConfig: Record<string, { label: string; color: string }> = {
	info: { label: "Informativo", color: "#2563eb" },
	warning: { label: "Atenção", color: "#d97706" },
	error: { label: "Erro", color: "#dc2626" },
	critical: { label: "Crítico", color: "#991b1b" },
};

export function renderAlertEmail(notification: NotificationMessage): string {
	const severity = severityConfig[notification.severity] ?? {
		label: "Notificação",
		color: "#475569",
	};

	const url = notification.metadata?.actionUrl;
	const metadata = notification.metadata ?? {};

	const details = Object.entries(metadata)
		.filter(
			([key, value]) =>
				key !== "actionUrl" &&
				key !== "actionLabel" &&
				typeof value === "string",
		)
		.map(
			([key, value]) => `
			<tr>
				<td style="
					padding: 10px;
					border-bottom: 1px solid #e2e8f0;
					color: #64748b;
					font-size: 13px;
				">${escapeHtml(key)}</td>
				<td style="
					padding: 10px;
					border-bottom: 1px solid #e2e8f0;
					color: #334155;
					font-size: 13px;
					word-break: break-word;
				">${escapeHtml(value as string)}</td>
			</tr>
		`,
		)
		.join("");

	const content = `
		<div style="
			margin-bottom: 20px;
			padding: 12px 16px;
			border-left: 4px solid ${severity.color};
			background-color: #f8fafc;
		">
			<strong style="color: ${severity.color};">
				${escapeHtml(severity.label)}
			</strong>
		</div>

		<h1 style="
			margin: 0 0 20px;
			color: #0f172a;
			font-size: 24px;
		">
			${escapeHtml(notification.title)}
		</h1>

		${renderParagraphs(notification.message)}

		${
			details
				? `
				<h2 style="
					margin-top: 28px;
					color: #334155;
					font-size: 16px;
				">Detalhes</h2>

				<table
					role="presentation"
					width="100%"
					cellpadding="0"
					cellspacing="0"
					style="border-collapse: collapse;"
				>
					${details}
				</table>
			`
				: ""
		}

		${
			typeof url === "string"
				? renderActionButton({
						url,
						label:
							typeof metadata.actionLabel === "string"
								? metadata.actionLabel
								: "Ver detalhes",
						color: severity.color,
					})
				: ""
		}
	`;

	return renderBaseEmailLayout({
		appName: "Warehouse Monitor",
		title: notification.title,
		subtitle: "Alerta do sistema",
		content,
	});
}
