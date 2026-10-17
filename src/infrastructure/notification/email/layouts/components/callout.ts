import { escapeHtml } from "./html-utils.js";

type CalloutTone = "info" | "success" | "warning" | "danger";

const tones: Record<CalloutTone, { border: string; bg: string; text: string }> =
	{
		info: { border: "#2563eb", bg: "#eff6ff", text: "#1e3a8a" },
		success: { border: "#16a34a", bg: "#f0fdf4", text: "#14532d" },
		warning: { border: "#d97706", bg: "#fffbeb", text: "#78350f" },
		danger: { border: "#dc2626", bg: "#fef2f2", text: "#7f1d1d" },
	};

type CalloutProps = {
	content: string;
	tone?: CalloutTone;
	title?: string | undefined;
};

export function renderCallout({
	content,
	tone = "info",
	title,
}: CalloutProps): string {
	const t = tones[tone];
	return `
		<div style="
			margin: 24px 0 0;
			padding: 14px 16px;
			border-left: 4px solid ${t.border};
			background-color: ${t.bg};
			color: ${t.text};
			font-size: 13px;
			line-height: 1.6;
		">
			${title ? `<strong style="display:block;margin-bottom:4px;">${escapeHtml(title)}</strong>` : ""}
			${escapeHtml(content)}
		</div>
	`;
}
