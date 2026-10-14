import type { IUuidProvider } from "@application/ports/uuid-provider.interface.js";
import { v7 } from "uuid";

export class UuidAdapter implements IUuidProvider {
	private static _instance: UuidAdapter;

	private constructor() {}

	static instance(): IUuidProvider {
		if (!UuidAdapter._instance) {
			UuidAdapter._instance = new UuidAdapter();
		}

		return UuidAdapter._instance;
	}

	generate(): string {
		return v7();
	}
}
