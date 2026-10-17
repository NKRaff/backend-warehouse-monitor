export function escapeHtml(value: string): string {
	const entities: Record<string, string> = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;",
	};

	return value.replace(/[&<>"']/g, (character) => {
		return entities[character] ?? character;
	});
}

export function renderParagraphs(message: string): string {
	return message
		.split(/\n{2,}/)
		.map((paragraph) => {
			const content = escapeHtml(paragraph).replace(/\n/g, "<br>");

			return `
				<p style="
					margin: 0 0 16px;
					color: #475569;
					font-size: 15px;
					line-height: 1.7;
				">${content}</p>
			`;
		})
		.join("");
}

export function getSafeHttpUrl(value: unknown): string | undefined {
	if (typeof value !== "string" || value.length === 0) {
		return undefined;
	}

	try {
		const url = new URL(value);

		if (url.protocol !== "https:" && url.protocol !== "http:") {
			return undefined;
		}

		if (url.username || url.password) {
			return undefined;
		}

		return url.toString();
	} catch {
		return undefined;
	}
}

export function renderHeading(text: string): string {
	return `
		<h1 style="margin: 0 0 20px; color: #0f172a; font-size: 24px; line-height: 1.3;">
			${escapeHtml(text)}
		</h1>
	`;
}

export function renderGreeting(name: string): string {
	return `
		<p style="margin: 0 0 16px; color: #475569; font-size: 15px;">
			Olá, <strong>${escapeHtml(name)}</strong>.
		</p>
	`;
}

export function formatDateTime(date: Date): string {
	return new Intl.DateTimeFormat("pt-BR", {
		dateStyle: "short",
		timeStyle: "short",
	}).format(date);
}
