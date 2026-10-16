import { renderEmailFooter } from "./components/email-footer.js";
import { renderEmailHeader } from "./components/email-header.js";

type BaseEmailLayoutProps = {
	appName: string;
	title: string;
	content: string;
	subtitle?: string | undefined;
	footerNote?: string | undefined;
	issuedAt?: Date | undefined;
};

export function renderBaseEmailLayout({
	appName,
	title,
	content,
	subtitle,
	footerNote,
	issuedAt,
}: BaseEmailLayoutProps): string {
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
			<title>${title}</title>
		</head>

		<body style="
			margin: 0;
			padding: 0;
			background-color: #f1f5f9;
			font-family: Arial, Helvetica, sans-serif;
		">
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
