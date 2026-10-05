import type { User } from "./user.js";

type RefreshTokenProps = {
	readonly id: string;
	readonly user: User;
	tokenHash: string;
	//createdAt: Date;
	expiresAt: Date;
};

export class RefreshToken {
	private constructor(private props: RefreshTokenProps) {}

	static create(props: RefreshTokenProps): RefreshToken {
		return new RefreshToken(props);
	}

	static restore(props: RefreshTokenProps) {
		return new RefreshToken(props);
	}

	isExpired(): boolean {
		return this.props.expiresAt.getTime() <= Date.now();
	}

	refresh(props: Omit<RefreshTokenProps, "id" | "user">): RefreshToken {
		this.props.tokenHash = props.tokenHash;
		this.props.expiresAt = props.expiresAt;

		return this;
	}
}
