import { env } from "@infrastructure/config/env.js";
import { renderEmailFooter } from "./components/email-footer.js";
import { renderEmailHeader } from "./components/email-header.js";
import { escapeHtml } from "./components/html-utils.js";

type BaseEmailLayoutProps = {
	title: string;
	content: string;
	subtitle?: string | undefined;
	footerNote?: string | undefined;
	issuedAt?: Date | undefined;
	preheader?: string | undefined;
};

export function renderBaseEmailLayout({
	title,
	content,
	subtitle,
	footerNote,
	issuedAt,
	preheader,
}: BaseEmailLayoutProps): string {
	const appName = env.app.name;
	return `
		<!DOCTYPE html>
		<html lang="pt-BR">
		<head>
			<meta charset="UTF-8">
			<meta
				name="viewport"
				content="width=device-width, initial-scale=1.0"
			>
			<meta name="color-scheme" content="light">
			<title>${escapeHtml(title)}</title>
		</head>

		<body style="
			margin: 0;
			padding: 0;
			background-color: #f1f5f9;
			font-family: Arial, Helvetica, sans-serif;
		">
		${
			preheader
				? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>`
				: ""
		}
			<table
				role="presentation"
				width="100%"
				border="0"
				cellpadding="0"
				cellspacing="0"
				style="background-color: #f1f5f9;"
			>
				<tr>
					<td align="center" style="padding: 32px 12px;">
						<table
							role="presentation"
							width="600"
							border="0"
							cellpadding="0"
							cellspacing="0"
							style="
								width: 100%;
								max-width: 600px;
								background-color: #ffffff;
								border-radius: 8px;
								overflow: hidden;
							"
						>
							${renderEmailHeader({ appName, subtitle })}

							<tr>
								<td style="
									padding: 32px;
									color: #475569;
									font-size: 15px;
									line-height: 1.7;
								">
									${content}
								</td>
							</tr>

							${renderEmailFooter({
								appName,
								issuedAt,
								note: footerNote,
							})}
						</table>
					</td>
				</tr>
			</table>
		</body>
		</html>
	`;
}
