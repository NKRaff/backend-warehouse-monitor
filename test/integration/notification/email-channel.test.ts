import { EmailChannel } from "@infrastructure/notification/email-channel.js";
import { beforeEach, describe, expect, it } from "vitest";
import { makeNotificationMessage, makeUser } from "../../helpers/factories.js";
import { FakeSmtpClient } from "../../helpers/fake-smtp.js";
import { resetSingleton } from "../../helpers/singleton.js";

describe("EmailChannel + templates de e-mail — RF-BE-003 / RF-BE-025", () => {
	const smtp = new FakeSmtpClient();
	let channel: EmailChannel;

	beforeEach(() => {
		smtp.reset();
		resetSingleton(EmailChannel);
		channel = EmailChannel.instance(smtp);
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

		it("envia ao destinatário com assunto e versão em texto puro", async () => {
			const message = welcome();

			await channel.send(message);

			const mail = smtp.lastMail();
			expect(smtp.outbox).toHaveLength(1);
			expect(mail?.to).toBe("carlos@empresa.com");
			expect(mail?.subject).toBe("Acesso ao sistema disponibilizado");
			expect(mail?.text).toBe(message.message);
		});

		it("usa o template de boas-vindas, com o nome do usuário e parágrafos", async () => {
			await channel.send(welcome());

			const html = smtp.lastMail()?.html ?? "";
			expect(html).toContain("Bem-vindo ao Sistema");
			expect(html).toContain("<strong>Carlos Operador</strong>");
			expect(html).toContain("Primeiro parágrafo.</p>");
			expect(html).toContain("Segunda linha<br>continua aqui.</p>");
			expect(html).not.toContain("Tipo de Alerta");
		});
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
			expect(html).toContain("Alerta Crítico");
			expect(html).toContain("Medição Fora dos Limites");
			expect(html).toContain("ATIVO");
			expect(html).toContain("Tipo de Alerta");
		});

		it.each([
			["critical", "Alerta Crítico"],
			["warning", "Atenção / Warning"],
			["info", "Informação do Sistema"],
		] as const)("severidade %s exibe '%s'", async (severity, label) => {
			await channel.send(makeNotificationMessage({ severity }));

			expect(smtp.lastMail()?.html).toContain(label);
		});

		it.each([
			["device_offline", "Dispositivo Offline"],
			["device_error", "Erro no Dispositivo IoT"],
		] as const)("tipo %s exibe '%s'", async (type, label) => {
			await channel.send(makeNotificationMessage({ type }));

			expect(smtp.lastMail()?.html).toContain(label);
		});

		it("alerta resolvido exibe o selo RESOLVIDO", async () => {
			await channel.send(makeNotificationMessage({ status: "resolved" }));

			const html = smtp.lastMail()?.html ?? "";
			expect(html).toContain("RESOLVIDO");
			expect(html).not.toContain(">ATIVO<");
		});
	});

	it("propaga a falha do SMTP para o chamador", async () => {
		smtp.failNextWith(new Error("SMTP indisponível"));

		await expect(channel.send(makeNotificationMessage())).rejects.toThrow(
			"SMTP indisponível",
		);
	});
});
