import { escapeHtml } from "./html-utils.js";

type EmailHeaderProps = {
	appName: string;
	subtitle?: string | undefined;
};

export function renderEmailHeader({
	appName,
	subtitle,
}: EmailHeaderProps): string {
	return `
		<tr>
			<td style="
				background-color: #1e293b;
				padding: 24px 32px;
			">
				<div style="
					color: #ffffff;
					font-size: 20px;
					font-weight: 700;
					letter-spacing: 0.2px;
				">
					${escapeHtml(appName)}
				</div>

				${
					subtitle
						? `
							<div style="
								margin-top: 6px;
								color: #cbd5e1;
								font-size: 13px;
							">
								${escapeHtml(subtitle)}
							</div>
						`
						: ""
				}
			</td>
		</tr>
	`;
}
