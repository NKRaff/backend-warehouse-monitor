import { EmailNotificationChannel } from "@infrastructure/notification/email/email-channel.js";
import { beforeEach, describe, expect, it } from "vitest";
import { makeNotificationMessage, makeUser } from "../../helpers/factories.js";
import { FakeSmtpClient } from "../../helpers/fake-smtp.js";
import { resetSingleton } from "../../helpers/singleton.js";

describe("EmailNotificationChannel + templates de e-mail — RF-BE-003 / RF-BE-005 / RF-BE-025", () => {
	const smtp = new FakeSmtpClient();
	let channel: EmailNotificationChannel;

	beforeEach(() => {
		smtp.reset();
		resetSingleton(EmailNotificationChannel);
		channel = EmailNotificationChannel.instance(smtp);
	});

	it("identifica-se como canal 'email'", () => {
		expect(channel.channelType).toBe("email");
	});

	describe("mensagem de boas-vindas (type = register_user)", () => {
		const welcome = () =>
			makeNotificationMessage({
				type: "register_user",
				severity: "info",
				title: "Acesso ao sistema disponibilizado",
				message: "Primeiro parágrafo.\n\nSegunda linha\ncontinua aqui.",
				recipient: makeUser({
					name: "Carlos Operador",
					email: "carlos@empresa.com",
				}),
			});

		it("envia ao destinatário com assunto e corpo HTML", async () => {
			const message = welcome();

			await channel.send(message);

			const mail = smtp.lastMail();
			expect(smtp.outbox).toHaveLength(1);
			expect(mail?.to).toBe("carlos@empresa.com");
			expect(mail?.subject).toBe("Acesso ao sistema disponibilizado");
			expect(mail?.html).toContain("Primeiro parágrafo.");
			expect(mail?.html).toContain("Segunda linha<br>continua aqui.");
		});

		it("usa o template genérico, com o nome do usuário e parágrafos", async () => {
			await channel.send(welcome());

			const html = smtp.lastMail()?.html ?? "";
			expect(html).toContain("Acesso ao sistema disponibilizado");
			expect(html).toContain("<strong>Carlos Operador</strong>");
			expect(html).toContain("Primeiro parágrafo.</p>");
			expect(html).toContain("Segunda linha<br>continua aqui.</p>");
			expect(html).not.toContain("Tipo de Alerta");
		});
	});

	it("inclui no e-mail de redefinição um link com o token recebido", async () => {
		const plainToken = "a".repeat(64);
		await channel.send(
			makeNotificationMessage({
				type: "password_reset",
				title: "Link para recuperar o acesso à sua conta",
				message: "Utilize o link em até 15 minutos.",
				metadata: { token: plainToken },
			}),
		);

		const html = smtp.lastMail()?.html ?? "";
		expect(html).toContain("Redefinição de senha");
		expect(html).toContain(`?token=${plainToken}`);
	});

	describe("mensagem de alerta (demais tipos)", () => {
		it("usa o template de alerta com tipo, status e severidade", async () => {
			await channel.send(
				makeNotificationMessage({
					type: "measurement_out_of_limits",
					severity: "critical",
					status: "active",
					title: "Temperatura acima do limite",
				}),
			);

			const html = smtp.lastMail()?.html ?? "";
			expect(html).toContain("Crítico");
			expect(html).toContain("Temperatura acima do limite");
			expect(html).not.toContain("Tipo de Alerta");
		});

		it.each([
			["critical", "Crítico"],
			["warning", "Atenção"],
			["info", "Notificação"],
		] as const)("severidade %s exibe '%s'", async (severity, label) => {
			await channel.send(makeNotificationMessage({ severity }));

			expect(smtp.lastMail()?.html).toContain(label);
		});

		it.each(["device_offline", "device_error"] as const)(
			"tipo %s mantém título e mensagem na notificação de alerta",
			async (type) => {
				await channel.send(
					makeNotificationMessage({ type, title: "Falha do sensor" }),
				);

				expect(smtp.lastMail()?.html).toContain("Falha do sensor");
				expect(smtp.lastMail()?.html).toContain("Mensagem da notificação");
			},
		);

		it("alerta resolvido exibe o selo RESOLVIDO", async () => {
			await channel.send(makeNotificationMessage({ status: "resolved" }));

			const html = smtp.lastMail()?.html ?? "";
			expect(html).not.toContain("RESOLVIDO");
			expect(html).not.toContain("ATIVO");
		});
	});

	it("propaga a falha do SMTP para o chamador", async () => {
		smtp.failNextWith(new Error("SMTP indisponível"));

		await expect(channel.send(makeNotificationMessage())).rejects.toThrow(
			"SMTP indisponível",
		);
	});
});
