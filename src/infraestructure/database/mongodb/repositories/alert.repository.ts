import type { IAlertRepository } from "@application/repositories/alert.interface.js";
import type { Alert } from "@domain/entities/alert.js";
import { alertToPersistence } from "../mappers/alert.mapper.js";
import { AlertModel } from "../models/alert.model.js";

export class AlertRepository implements IAlertRepository {
	private static _instance: AlertRepository;

	private constructor() {}

	static instance(): AlertRepository {
		if (!AlertRepository._instance) {
			AlertRepository._instance = new AlertRepository();
		}
		return AlertRepository._instance;
	}

	async save(alert: Alert): Promise<void> {
		const model = alertToPersistence(alert);
		await AlertModel.create(model);
	}
}
