import crypto from "node:crypto";
import type { TokenType } from "@domain/types/token-type.js";

type TokenProps = {
	readonly id: string;
	readonly userId: string;
	readonly type: TokenType;
	value: string;
	expiresAt: Date;
};

export class Token {
	private constructor(private props: TokenProps) {}

	static createPasswordReset(id: string, userId: string): Token {
		const value = crypto.randomBytes(32).toString("hex");
		const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
		return new Token({
			id,
			userId,
			type: "password_reset",
			value,
			expiresAt,
		});
	}

	static createRefreshToken(id: string, userId: string): Token {
		const value = crypto.randomBytes(32).toString("hex");
		const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
		return new Token({
			id,
			userId,
			type: "refresh",
			value,
			expiresAt,
		});
	}

	isExpired(): boolean {
		return new Date() > this.props.expiresAt;
	}

	get value(): string {
		return this.props.value;
	}

	get type(): string {
		return this.props.type;
	}
}
