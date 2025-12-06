export type LLMParams = {
    model?: string;
    system?: string;
    user: string;
    jsonSchema?: any;
    temperature?: number;
    maxRetries?: number;
};
export interface LLMClient {
    completeJSON(p: LLMParams): Promise<any>;
    completeText(p: LLMParams): Promise<string>;
    embed(input: string[]): Promise<number[][]>;
}

export function buildPrompt(jsonSchema?: any) {
    return jsonSchema
        ? `You must ONLY output JSON matching this JSON Schema:\n${JSON.stringify(jsonSchema)}`
        : '';
}
