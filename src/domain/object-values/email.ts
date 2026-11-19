import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";

export class Email {
	private _isVerified: boolean;
	private _enableNotification: boolean;

	constructor(private _value: string) {
		const email = _value.toLocaleLowerCase().trim();
		if (!this.isValid(email)) {
			throw new UnprocessableEntityError("Endereço de e-mail inválido");
		}
		this._value = email;
		this._isVerified = false;
		this._enableNotification = false;
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

	get enableNotification(): boolean {
		return this._enableNotification;
	}

	verify(): void {
		this._isVerified = true;
	}

	changeNotification(): void {
		if (!this._isVerified) {
			this._enableNotification = false;
			return;
		}

		this._enableNotification = !this._enableNotification;
	}
}
