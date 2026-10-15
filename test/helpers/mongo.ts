import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongod: MongoMemoryServer | undefined;

/** Timeout generoso: na 1ª execução o binário do MongoDB é baixado. */
export const MONGO_STARTUP_TIMEOUT = 120_000;

/**
 * Sobe um MongoDB em memória e conecta o Mongoose (conexão default, a mesma
 * usada pelos models da aplicação). Chame em `beforeAll`.
 */
export async function startMongo(): Promise<void> {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri(), { dbName: "warehouse-monitor-test" });

	// Garante que índices únicos (ex.: e-mail do usuário) existam antes dos testes.
	await Promise.all(
		mongoose.modelNames().map((name) => mongoose.model(name).init()),
	);
}

/** Apaga os documentos mantendo os índices. Chame em `beforeEach`. */
export async function clearMongo(): Promise<void> {
	await Promise.all(
		Object.values(mongoose.connection.collections).map((collection) =>
			collection.deleteMany({}),
		),
	);
}

/** Chame em `afterAll`. */
export async function stopMongo(): Promise<void> {
	await mongoose.disconnect();
	await mongod?.stop();
	mongod = undefined;
}
