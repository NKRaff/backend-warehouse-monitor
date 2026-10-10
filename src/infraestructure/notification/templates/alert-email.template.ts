import type { NotificationMessage } from "@application/types/notification-message.js";
import type { AlertSeverity } from "@domain/types/alert-severity.js";

export function renderAlertEmailHtml(message: NotificationMessage): string {
	const style = getSeverityStyles(message.severity);
	const alertTypeText = formatAlertType(message.type);
	const formattedDate = new Intl.DateTimeFormat("pt-BR", {
		dateStyle: "full",
		timeStyle: "medium",
	}).format(new Date());

	const isResolved = message.status === "resolved";
	const statusBadge = isResolved
		? `<span style="background-color: #22c55e; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">RESOLVIDO</span>`
		: `<span style="background-color: #ef4444; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">ATIVO</span>`;

	return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${message.title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f4f6f9; padding: 40px 0;">
        <tr>
          <td align="center">
            <!-- Container Principal -->
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              
              <!-- Cabeçalho -->
              <tr>
                <td style="background-color: #1e293b; padding: 24px 32px; text-align: left;">
                  <span style="font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 0.5px;">
                    🏭 Warehouse Monitor
                  </span>
                </td>
              </tr>

              <!-- Barra Dinâmica por Severidade -->
              <tr>
                <td style="background-color: ${style.bannerBg}; padding: 12px 32px; color: #ffffff; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                  ${style.label}
                </td>
              </tr>

              <!-- Conteúdo -->
              <tr>
                <td style="padding: 32px;">
                  <h1 style="margin: 0 0 16px 0; font-size: 22px; color: #0f172a; font-weight: 700;">
                    ${message.title}
                  </h1>
                  
                  <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                    Olá, <strong>${message.recipient.name}</strong>.<br><br>
                    ${message.message}
                  </p>

                  <!-- Caixa de Metadados Contextuais -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-left: 4px solid ${style.borderLeft}; border-radius: 4px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 16px;">
                        <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;">
                          <strong>Tipo de Alerta:</strong> ${alertTypeText}
                        </p>
                        <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;">
                          <strong>Status Atual:</strong> ${statusBadge}
                        </p>
                        <p style="margin: 0; font-size: 13px; color: #64748b;">
                          <strong>Horário:</strong> ${formattedDate}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Botão de Ação -->
                  <table border="0" cellpadding="0" cellspacing="0" style="margin-top: 8px;">
                    <tr>
                      <td align="center" style="border-radius: 6px; background-color: #2563eb;">
                        <a href="https://seu-painel-warehouse.com/alerts" target="_blank" style="font-size: 14px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; border: 1px solid #2563eb; display: inline-block; font-weight: 600;">
                          Ver Detalhes no Painel
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
                    Por favor, não responda a este e-mail.
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

function getSeverityStyles(severity: AlertSeverity) {
	switch (severity) {
		case "critical":
			return {
				bannerBg: "#ef4444", // Vermelho
				borderLeft: "#ef4444",
				label: "⚠️ Alerta Crítico",
			};
		case "warning":
			return {
				bannerBg: "#f59e0b", // Amarelo/Laranja
				borderLeft: "#f59e0b",
				label: "⚡ Atenção / Warning",
			};
		default:
			return {
				bannerBg: "#3b82f6", // Azul
				borderLeft: "#3b82f6",
				label: "ℹ️ Informação do Sistema",
			};
	}
}

function formatAlertType(
	type: "device_offline" | "device_error" | "measurement_out_of_limits",
): string {
	switch (type) {
		case "device_offline":
			return "Dispositivo Offline";
		case "device_error":
			return "Erro no Dispositivo IoT";
		case "measurement_out_of_limits":
			return "Medição Fora dos Limites (Temp/Umidade)";
	}
}
