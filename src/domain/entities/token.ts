import { createHash, randomBytes } from "node:crypto";
import { TokenType } from "@domain/types/token-type.js";

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
		const value = randomBytes(32).toString("hex");
		const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
		return new Token({
			id,
			userId,
			type: TokenType.PASSWORD_RESET,
			value,
			expiresAt,
		});
	}

	static createRefreshToken(id: string, userId: string): Token {
		const value = randomBytes(32).toString("hex");
		const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
		return new Token({
			id,
			userId,
			type: TokenType.REFRESH,
			value,
			expiresAt,
		});
	}

	static restore(props: TokenProps): Token {
		return new Token(props);
	}

	isExpired(): boolean {
		return new Date() > this.props.expiresAt;
	}

	hash(): string {
		return createHash("sha256").update(this.props.value).digest("hex");
	}

	refresh() {
		this.props.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
		this.props.value = randomBytes(32).toString("hex");
	}

	verify(token: string): boolean {
		token = createHash("sha256").update(token).digest("hex");
		return this.props.value === token;
	}

	get id(): string {
		return this.props.id;
	}

	get userId(): string {
		return this.props.userId;
	}

	get type(): TokenType {
		return this.props.type;
	}

	get value(): string {
		return this.props.value;
	}

	get expiresAt(): Date {
		return this.props.expiresAt;
	}

	set value(newValue: string) {
		this.props.value = newValue;
	}
}
