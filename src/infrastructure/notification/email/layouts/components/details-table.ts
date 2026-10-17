import { escapeHtml } from "./html-utils.js";

export type DetailRow = { label: string; value: string };

export function renderDetailsTable(rows: DetailRow[]): string {
	if (rows.length === 0) {
		return "";
	}

	const body = rows
		.map(
			({ label, value }) => `
			<tr>
				<td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; width: 38%;">
					${escapeHtml(label)}
				</td>
				<td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 600; word-break: break-word;">
					${escapeHtml(value)}
				</td>
			</tr>`,
		)
		.join("");

	return `
		<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
			style="border-collapse: collapse; margin: 20px 0; background-color: #f8fafc; border-radius: 6px;">
			${body}
		</table>
	`;
}
