import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";

export class Email {
	private _isVerified: boolean;

	constructor(private _value: string) {
		const email = _value.toLocaleLowerCase().trim();
		if (!this.isValid(email)) {
			throw new UnprocessableEntityError("Endereço de e-mail inválido");
		}
		this._value = email;
		this._isVerified = false;
	}

	private isValid(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	get value(): string {
		return this._value;
	}

	get isVerified(): boolean {
		return this._isVerified;
	}

	verify(): void {
		this._isVerified = true;
	}
}
