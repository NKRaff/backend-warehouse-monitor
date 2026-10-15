/**
 * Serviços, repositórios, use cases e controllers do projeto seguem o padrão
 * Singleton (`static instance()`), então o estado "vaza" entre testes do mesmo
 * arquivo. Este helper zera a instância guardada para que cada teste monte a
 * classe com os seus próprios mocks.
 *
 * Uso: `beforeEach(() => resetSingleton(LoginUseCase))`
 */
export function resetSingleton(...targets: unknown[]): void {
	for (const target of targets) {
		(target as { _instance?: unknown })._instance = undefined;
	}
}
