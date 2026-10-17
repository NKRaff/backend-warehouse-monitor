import type { NotificationMessage } from "@application/types/notification-message.js";
import type { AlertSeverity } from "@domain/types/alert-severity.js";
import { renderBaseEmailLayout } from "../layouts/base-email-layout.js";
import { renderActionButton } from "../layouts/components/action-button.js";
import {
	type DetailRow,
	renderDetailsTable,
} from "../layouts/components/details-table.js";
import {
	escapeHtml,
	renderGreeting,
	renderHeading,
	renderParagraphs,
} from "../layouts/components/html-utils.js";

const severityConfig: Record<AlertSeverity, { label: string; color: string }> =
	{
		info: { label: "Informativo", color: "#2563eb" },
		warning: { label: "Atenção", color: "#d97706" },
		critical: { label: "Crítico", color: "#991b1b" },
	};

const detailLabels: Record<string, string> = {
	deviceName: "Dispositivo",
	deviceMac: "Endereço MAC",
	warehouseName: "Ambiente",
	measurementType: "Grandeza",
	measuredValue: "Valor medido",
	limits: "Limites configurados",
	occurredAt: "Ocorrido em",
};

const hiddenKeys = new Set(["actionUrl", "actionLabel"]);

export function renderAlertEmail(notification: NotificationMessage): string {
	const severity = severityConfig[notification.severity];
	const metadata = notification.metadata ?? {};

	const rows: DetailRow[] = Object.entries(metadata)
		.filter(
			([key, value]) =>
				!hiddenKeys.has(key) &&
				(typeof value === "string" || typeof value === "number"),
		)
		.map(([key, value]) => ({
			label: detailLabels[key] ?? key,
			value: String(value),
		}));

	const url = metadata.actionUrl;
	const actionLabel = metadata.actionLabel;

	const content = `
		<div style="margin-bottom: 20px; padding: 12px 16px; border-left: 4px solid ${severity.color}; background-color: #f8fafc;">
			<strong style="color: ${severity.color};">${escapeHtml(severity.label)}</strong>
		</div>
		${renderHeading(notification.title)}
		${renderGreeting(notification.recipient.name)}
		${renderParagraphs(notification.message)}
		${rows.length > 0 ? `<h2 style="margin: 28px 0 0; color: #334155; font-size: 16px;">Detalhes</h2>${renderDetailsTable(rows)}` : ""}
		${
			typeof url === "string"
				? renderActionButton({
						url,
						label: typeof actionLabel === "string" ? actionLabel : "Ver alerta",
						color: severity.color,
					})
				: ""
		}
	`;

	return renderBaseEmailLayout({
		title: notification.title,
		subtitle: "Alerta do sistema",
		preheader: `${severity.label}: ${notification.title}`,
		content,
		footerNote:
			"Este alerta permanece ativo até ser resolvido manualmente na central de alertas.",
	});
}
