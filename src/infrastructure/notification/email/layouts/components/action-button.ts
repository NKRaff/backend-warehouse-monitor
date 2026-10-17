import { escapeHtml, getSafeHttpUrl } from "./html-utils.js";

type ActionButtonProps = {
	url: string;
	label: string;
	color?: string;
	showFallbackLink?: boolean;
};

export function renderActionButton({
	url,
	label,
	color = "#2563eb",
	showFallbackLink = true,
}: ActionButtonProps): string {
	const safeUrl = getSafeHttpUrl(url);

	if (!safeUrl) {
		return "";
	}

	const fallback = showFallbackLink
		? `
		<p style="margin: 12px 0 0; color: #64748b; font-size: 12px; line-height: 1.6;">
			Se o botão não funcionar, copie e cole este endereço no navegador:<br>
			<a href="${escapeHtml(safeUrl)}" style="color: ${escapeHtml(color)}; word-break: break-all;">${escapeHtml(safeUrl)}</a>
		</p>`
		: "";

	return `
		<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0 8px;">
			<tr>
				<td align="center" bgcolor="${escapeHtml(color)}" style="border-radius: 6px;">
					<a href="${escapeHtml(safeUrl)}" style="
						display: inline-block;
						padding: 13px 28px;
						border: 1px solid ${escapeHtml(color)};
						border-radius: 6px;
						color: #ffffff;
						font-family: Arial, sans-serif;
						font-size: 14px;
						font-weight: 700;
						text-decoration: none;
					">${escapeHtml(label)}</a>
				</td>
			</tr>
		</table>
		${fallback}
	`;
}
