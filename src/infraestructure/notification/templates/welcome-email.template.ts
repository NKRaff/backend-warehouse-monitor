import type { NotificationMessage } from "@application/types/notification-message.js";

export function renderWelcomeEmailHtml(
	notification: NotificationMessage,
): string {
	const formattedDate = new Intl.DateTimeFormat("pt-BR", {
		dateStyle: "full",
		timeStyle: "medium",
	}).format(new Date());

	const formattedMessage = notification.message
		.split("\n\n")
		.map(
			(paragraph) =>
				`<p style="margin: 0 0 16px 0; font-size: 15px; color: #475569; line-height: 1.6;">${paragraph.replace(/\n/g, "<br>")}</p>`,
		)
		.join("");

	return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${notification.title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f4f6f9; padding: 40px 0;">
        <tr>
          <td align="center">
            <!-- Container Principal -->
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              
              <!-- Cabeçalho Institucional -->
              <tr>
                <td style="background-color: #1e293b; padding: 24px 32px; text-align: left;">
                  <span style="font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 0.5px;">
                    🏭 Warehouse Monitor
                  </span>
                </td>
              </tr>

              <!-- Barra de Boas-Vindas (Azul Profissional) -->
              <tr>
                <td style="background-color: #2563eb; padding: 12px 32px; color: #ffffff; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                  ✨ Bem-vindo ao Sistema
                </td>
              </tr>

              <!-- Conteúdo -->
              <tr>
                <td style="padding: 32px;">
                  <h1 style="margin: 0 0 16px 0; font-size: 22px; color: #0f172a; font-weight: 700;">
                    ${notification.title}
                  </h1>
                  
                  <p style="margin: 0 0 16px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                    Olá, <strong>${notification.recipient.name}</strong>.
                  </p>

                  <!-- Mensagem dinâmica vinda do Caso de Uso renderizada em parágrafos limpos -->
                  ${formattedMessage}

                  <!-- Botão de Ação Direto -->
                  <table border="0" cellpadding="0" cellspacing="0" style="margin-top: 24px; margin-bottom: 8px;">
                    <tr>
                      <td align="center" style="border-radius: 6px; background-color: #2563eb;">
                        <a href="https://seu-painel-warehouse.com/login" target="_blank" style="font-size: 14px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; border: 1px solid #2563eb; display: inline-block; font-weight: 600;">
                          Acessar o Sistema Agora
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Rodapé -->
              <tr>
                <td style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.4;">
                    Esta é uma mensagem automática enviada pelo sistema <strong>backend-warehouse-monitor</strong>.<br>
                    Data de emissão: ${formattedDate}
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
