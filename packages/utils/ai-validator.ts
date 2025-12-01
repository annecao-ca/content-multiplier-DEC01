/**
 * AI RESPONSE VALIDATOR
 * 
 * Module để validate response từ AI và retry nếu sai format
 * 
 * Features:
 * - Schema validation
 * - Auto retry với feedback
 * - Custom validation rules
 * - Detailed error messages
 */

import Ajv, { ValidateFunction, ErrorObject } from 'ajv';

// ============================================
// TYPES
// ============================================

export interface ValidationRule<T = any> {
    field: string;
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any, item: T) => boolean | string; // true = valid, string = error message
}

export interface ValidationSchema<T = any> {
    rules: ValidationRule<T>[];
    errorMessage?: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: Array<{
        field: string;
        message: string;
        value?: any;
    }>;
    data?: any;
}

export interface ValidatorConfig {
    maxRetries: number;
    retryDelay: number;
    generateFeedback: boolean; // Có tạo feedback cho AI không
}

// ============================================
// DEFAULT CONFIG
// ============================================

const DEFAULT_CONFIG: ValidatorConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    generateFeedback: true
};

// ============================================
// VALIDATOR CLASS
// ============================================

export class AIValidator {
    private ajv: Ajv;
    private config: ValidatorConfig;
    
    constructor(config: Partial<ValidatorConfig> = {}) {
        this.ajv = new Ajv({ allErrors: true, strict: false });
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    
    /**
     * Validate một item theo custom rules
     */
    validateItem<T>(item: any, rules: ValidationRule<T>[]): ValidationResult {
        const errors: ValidationResult['errors'] = [];
        
        for (const rule of rules) {
            const value = item[rule.field];
            
            // Check required
            if (rule.required && (value === undefined || value === null || value === '')) {
                errors.push({
                    field: rule.field,
                    message: `Field '${rule.field}' is required`,
                    value
                });
                continue;
            }
            
            // Skip validation if field is optional and empty
            if (!rule.required && (value === undefined || value === null)) {
                continue;
            }
            
            // Check type
            if (rule.type) {
                const actualType = Array.isArray(value) ? 'array' : typeof value;
                if (actualType !== rule.type) {
                    errors.push({
                        field: rule.field,
                        message: `Field '${rule.field}' must be ${rule.type}, got ${actualType}`,
                        value
                    });
                    continue;
                }
            }
            
            // Check string length
            if (rule.type === 'string' && typeof value === 'string') {
                if (rule.minLength && value.length < rule.minLength) {
                    errors.push({
                        field: rule.field,
                        message: `Field '${rule.field}' must be at least ${rule.minLength} characters`,
                        value
                    });
                }
                if (rule.maxLength && value.length > rule.maxLength) {
                    errors.push({
                        field: rule.field,
                        message: `Field '${rule.field}' must be at most ${rule.maxLength} characters`,
                        value
                    });
                }
            }
            
            // Check pattern
            if (rule.pattern && typeof value === 'string') {
                if (!rule.pattern.test(value)) {
                    errors.push({
                        field: rule.field,
                        message: `Field '${rule.field}' does not match required pattern`,
                        value
                    });
                }
            }
            
            // Check array length
            if (rule.type === 'array' && Array.isArray(value)) {
                if (rule.minLength && value.length < rule.minLength) {
                    errors.push({
                        field: rule.field,
                        message: `Field '${rule.field}' must have at least ${rule.minLength} items`,
                        value
                    });
                }
            }
            
            // Custom validation
            if (rule.custom) {
                const result = rule.custom(value, item);
                if (result !== true) {
                    errors.push({
                        field: rule.field,
                        message: typeof result === 'string' ? result : `Field '${rule.field}' failed custom validation`,
                        value
                    });
                }
            }
        }
        
        return {
            valid: errors.length === 0,
            errors,
            data: errors.length === 0 ? item : undefined
        };
    }
    
    /**
     * Validate array of items
     */
    validateArray<T>(items: any[], rules: ValidationRule<T>[]): ValidationResult {
        if (!Array.isArray(items)) {
            return {
                valid: false,
                errors: [{
                    field: 'root',
                    message: 'Expected array, got ' + typeof items
                }]
            };
        }
        
        const allErrors: ValidationResult['errors'] = [];
        const validItems: T[] = [];
        
        items.forEach((item, index) => {
            const result = this.validateItem(item, rules);
            
            if (result.valid) {
                validItems.push(item);
            } else {
                result.errors.forEach(error => {
                    allErrors.push({
                        ...error,
                        field: `[${index}].${error.field}`
                    });
                });
            }
        });
        
        return {
            valid: allErrors.length === 0,
            errors: allErrors,
            data: validItems
        };
    }
    
    /**
     * Validate với JSON Schema (AJV)
     */
    validateWithSchema(data: any, schema: object): ValidationResult {
        const validate = this.ajv.compile(schema);
        const valid = validate(data);
        
        if (valid) {
            return { valid: true, errors: [], data };
        }
        
        const errors = (validate.errors || []).map(err => ({
            field: err.instancePath || err.schemaPath,
            message: err.message || 'Validation error',
            value: err.data
        }));
        
        return { valid: false, errors };
    }
    
    /**
     * Generate feedback message cho AI để fix errors
     */
    generateFeedback(errors: ValidationResult['errors']): string {
        if (errors.length === 0) return '';
        
        const feedback = ['The response has validation errors. Please fix:'];
        
        errors.forEach((error, index) => {
            feedback.push(`${index + 1}. ${error.field}: ${error.message}`);
        });
        
        feedback.push('\nPlease regenerate with correct format.');
        
        return feedback.join('\n');
    }
}

// ============================================
// RETRY WITH VALIDATION
// ============================================

export interface RetryValidateOptions<T> {
    validator: AIValidator;
    rules?: ValidationRule<T>[];
    schema?: object;
    maxRetries?: number;
    onRetry?: (attempt: number, errors: ValidationResult['errors']) => void;
    generatePrompt: (feedback?: string) => Promise<any>;
}

/**
 * Retry validation với feedback loop
 */
export async function retryWithValidation<T>(
    options: RetryValidateOptions<T>
): Promise<ValidationResult> {
    const {
        validator,
        rules,
        schema,
        maxRetries = 3,
        onRetry,
        generatePrompt
    } = options;
    
    let lastErrors: ValidationResult['errors'] = [];
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`[Validator] Attempt ${attempt}/${maxRetries}`);
        
        // Generate feedback từ lần thử trước
        const feedback = attempt > 1 
            ? validator.generateFeedback(lastErrors)
            : undefined;
        
        // Call AI với feedback
        const response = await generatePrompt(feedback);
        
        // Validate response
        let result: ValidationResult;
        
        if (schema) {
            result = validator.validateWithSchema(response, schema);
        } else if (rules) {
            result = Array.isArray(response)
                ? validator.validateArray(response, rules)
                : validator.validateItem(response, rules);
        } else {
            throw new Error('Either rules or schema must be provided');
        }
        
        // Success!
        if (result.valid) {
            console.log(`[Validator] ✅ Valid after ${attempt} attempt(s)`);
            return result;
        }
        
        // Log errors
        console.warn(`[Validator] ❌ Validation failed (attempt ${attempt}):`, result.errors);
        lastErrors = result.errors;
        
        // Callback
        if (onRetry) {
            onRetry(attempt, result.errors);
        }
        
        // Nếu còn attempts, đợi một chút
        if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // All attempts failed
    throw new Error(
        `Validation failed after ${maxRetries} attempts. Last errors:\n` +
        lastErrors.map(e => `- ${e.field}: ${e.message}`).join('\n')
    );
}

// ============================================
// PRESET VALIDATORS
// ============================================

/**
 * Validator cho Content Ideas
 */
export const IdeaValidator = {
    // Basic fields (title, description, rationale)
    basicRules: [
        {
            field: 'title',
            required: true,
            type: 'string' as const,
            minLength: 10,
            maxLength: 200
        },
        {
            field: 'description',
            required: true,
            type: 'string' as const,
            minLength: 20,
            maxLength: 1000
        },
        {
            field: 'rationale',
            required: true,
            type: 'string' as const,
            minLength: 20,
            maxLength: 500
        }
    ],
    
    // Extended fields
    extendedRules: [
        {
            field: 'title',
            required: true,
            type: 'string' as const,
            minLength: 10,
            maxLength: 200
        },
        {
            field: 'description',
            required: true,
            type: 'string' as const,
            minLength: 20,
            maxLength: 1000
        },
        {
            field: 'rationale',
            required: true,
            type: 'string' as const,
            minLength: 20,
            maxLength: 500
        },
        {
            field: 'target_audience',
            required: false,
            type: 'array' as const,
            minLength: 1
        },
        {
            field: 'tags',
            required: false,
            type: 'array' as const
        },
        {
            field: 'score',
            required: false,
            type: 'number' as const,
            custom: (value: any) => {
                if (typeof value !== 'number') return true; // Optional
                return value >= 0 && value <= 5 ? true : 'Score must be between 0 and 5';
            }
        }
    ],
    
    // Schema cho JSON validation
    schema: {
        type: 'object',
        required: ['ideas'],
        properties: {
            ideas: {
                type: 'array',
                minItems: 1,
                items: {
                    type: 'object',
                    required: ['title', 'description', 'rationale'],
                    properties: {
                        title: {
                            type: 'string',
                            minLength: 10,
                            maxLength: 200
                        },
                        description: {
                            type: 'string',
                            minLength: 20,
                            maxLength: 1000
                        },
                        rationale: {
                            type: 'string',
                            minLength: 20,
                            maxLength: 500
                        },
                        target_audience: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        tags: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        score: {
                            type: 'number',
                            minimum: 0,
                            maximum: 5
                        }
                    }
                }
            }
        }
    }
};

// Export singleton
export const aiValidator = new AIValidator();

