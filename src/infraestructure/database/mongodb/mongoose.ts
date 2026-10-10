import { connect } from "mongoose";
import { env } from "../../config/env.js";

export class Mongoose {
	private static _instance: Mongoose;

	private constructor() {}

	static instance(): Mongoose {
		if (!Mongoose._instance) {
			Mongoose._instance = new Mongoose();
		}
		return Mongoose._instance;
	}

	async connect(): Promise<void> {
		await connect(env.database.URI)
			.catch((error) =>
				console.error(`Erro ao se conecta ao MongoDB: ${error}`),
			)
			.then(() => console.log(`💾 MongoDB esta conectando`));
	}
}
