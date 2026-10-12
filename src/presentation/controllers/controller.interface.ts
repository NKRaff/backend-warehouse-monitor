import type { RequestContext } from "../types/request-context.js";

export interface IController<Output> {
	handle(input: unknown, context: RequestContext): Promise<Output>;
}
