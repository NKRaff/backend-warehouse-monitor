import { escapeHtml } from "./html-utils.js";

type EmailFooterProps = {
	appName: string;
	issuedAt?: Date | undefined;
	note?: string | undefined;
};

export function renderEmailFooter({
	appName,
	issuedAt = new Date(),
	note,
}: EmailFooterProps): string {
	const formattedDate = new Intl.DateTimeFormat("pt-BR", {
		dateStyle: "short",
		timeStyle: "short",
	}).format(issuedAt);

	return `
		<tr>
			<td style="
				background-color: #f8fafc;
				border-top: 1px solid #e2e8f0;
				padding: 24px 32px;
				text-align: center;
			">
				${
					note
						? `
							<p style="
								margin: 0 0 12px;
								color: #64748b;
								font-size: 12px;
								line-height: 1.6;
							">${escapeHtml(note)}</p>
						`
						: ""
				}

				<p style="
					margin: 0;
					color: #94a3b8;
					font-size: 12px;
					line-height: 1.6;
				">
					Mensagem automática de
					<strong>${escapeHtml(appName)}</strong>.<br>
					Enviada em ${escapeHtml(formattedDate)}.
				</p>
			</td>
		</tr>
	`;
}
