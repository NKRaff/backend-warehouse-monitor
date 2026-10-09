import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";

export class PasswordPolicyService {
	private static _instance: PasswordPolicyService;

	private constructor() {}

	static instance(): PasswordPolicyService {
		if (!PasswordPolicyService._instance) {
			PasswordPolicyService._instance = new PasswordPolicyService();
		}
		return PasswordPolicyService._instance;
	}

	isValid(password: string): boolean {
		const errors = [];

		if (password.length < 8) {
			errors.push("A senha deve ter no minimo 8 caracteres");
		}

		if (!/[A-Z]/.test(password)) {
			errors.push("A senha deve ter caractere maiusculo");
		}

		if (!/[a-z]/.test(password)) {
			errors.push("A senha deve ter caractere minusculo");
		}

		if (!/[0-9]/.test(password)) {
			errors.push("A senha deve ter caractere numerico");
		}

		if (!/[^A-Za-z0-9\s]/.test(password)) {
			errors.push("A senha deve ter caractere especiais");
		}

		if (errors.length > 0) {
			throw new UnprocessableEntityError(
				`Senha invalida: ${errors.join(", ")}`,
			);
		}

		return true;
	}
}
