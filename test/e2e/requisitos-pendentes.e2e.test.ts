import { describe, it } from "vitest";

/**
 * Mapa vivo dos requisitos de backend (Requisitos TCC) que a refatoração ainda
 * não entrega. Cada `it.todo` aparece como "pendente" no relatório do Vitest e
 * deve virar um teste E2E real quando o requisito for implementado.
 *
 * Decisão do projeto: usuário removido (soft delete) recebe 403 — login e rotas
 * protegidas — mesmo o documento citando mensagem genérica/401 (não é pendência).
 */
describe("Requisitos de backend pendentes", () => {
	describe("Autenticação e usuários", () => {
		it.todo("RF-BE-001: login emite também um refresh token além do JWT");
		it.todo("RF-BE-003: reenviar credenciais gera nova senha temporária e invalida a anterior");
		it.todo("RF-BE-004: rejeita definir como senha definitiva a própria senha temporária");
		it.todo("RF-BE-005: redefinição de senha por token de curta duração enviado por e-mail");
		it.todo("Bootstrap: considerar apenas administradores ativos (findByRole hoje inclui removidos)");
		it.todo("RF-BE-010: bloqueio temporário após 5 logins malsucedidos em 10 min (por IP e por usuário)");
	});

	describe("Ambientes (Warehouse)", () => {
		it.todo("RF-BE-011: cadastrar ambiente");
		it.todo("RF-BE-012: requisitos restantes de atualizacao (ator operator e armazem removido)");
		it.todo("RF-BE-013: excluir ambiente desvincula dispositivos e cancela inscrições MQTT");
		it.todo("RF-BE-014: listar ambientes ativos com paginação");
	});

	describe("Dispositivos e MQTT", () => {
		it.todo("RF-BE-015: cadastrar dispositivo valida MAC e inscreve nos tópicos MQTT");
		it.todo("RF-BE-016: vincular/desvincular ambiente sincroniza as inscrições MQTT");
		it.todo("RF-BE-017: excluir dispositivo (soft delete) cancela as inscrições");
		it.todo("RF-BE-019: unicidade do MAC entre dispositivos ativos");
		it.todo("RF-BE-020: restaurar inscrições MQTT na inicialização");
	});

	describe("Medições, alertas e notificações", () => {
		it.todo("RF-BE-021: persistir medição recebida via MQTT ignorando valores repetidos");
		it.todo("RF-BE-022: buscar medições com filtros e limite de registros");
		it.todo("RF-BE-023: publicar medição em tempo real via WebSocket");
		it.todo("RF-BE-024: configurar limites de temperatura e umidade");
		it.todo("RF-BE-025: gerar alerta por violação de limite sem duplicar alerta ativo");
		it.todo("RF-BE-026: usuário ativa/desativa notificações por e-mail");
		it.todo("RF-BE-027: alerta de dispositivo offline após 5 minutos sem medições");
		it.todo("RF-BE-028: notificar falha de hardware reportada pelo dispositivo");
		it.todo("RF-BE-029: resolver alerta registrando quem e quando");
		it.todo("RF-BE-031: administrador consulta o log de auditoria com filtros e paginação");
	});
});
