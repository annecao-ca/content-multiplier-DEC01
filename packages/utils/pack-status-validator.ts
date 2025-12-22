/**
 * PACK STATUS VALIDATOR
 * 
 * Validates status transitions for content packs
 * Ensures only valid state transitions are allowed
 */

export type PackStatus = 'draft' | 'review' | 'approved' | 'published';

export interface StatusTransitionResult {
    passed: boolean;
    error?: string;
}

/**
 * Valid status transitions map
 * Each status can only transition to specific next statuses
 */
const VALID_TRANSITIONS: Record<PackStatus, PackStatus[]> = {
    draft: ['review'],
    review: ['approved', 'draft'], // Can send back to draft for revisions
    approved: ['published', 'review'], // Can send back to review if issues found
    published: [] // Published is final state, no transitions allowed
};

/**
 * Validates if a status transition is allowed
 * 
 * @param current - Current status
 * @param next - Desired next status
 * @returns Object with passed boolean and optional error message
 * 
 * @example
 * validatePackStatusTransition('draft', 'review') // { passed: true }
 * validatePackStatusTransition('draft', 'published') // { passed: false, error: '...' }
 */
export function validatePackStatusTransition(
    current: string,
    next: string
): StatusTransitionResult {
    // Validate input types
    if (typeof current !== 'string' || typeof next !== 'string') {
        return {
            passed: false,
            error: 'Invalid status type: current and next must be strings'
        };
    }

    // Normalize to lowercase
    const currentStatus = current.toLowerCase() as PackStatus;
    const nextStatus = next.toLowerCase() as PackStatus;

    // Check if current status is valid
    if (!VALID_TRANSITIONS[currentStatus]) {
        return {
            passed: false,
            error: `Invalid current status: '${current}'. Must be one of: draft, review, approved, published`
        };
    }

    // Check if next status is valid
    const validStatuses: PackStatus[] = ['draft', 'review', 'approved', 'published'];
    if (!validStatuses.includes(nextStatus)) {
        return {
            passed: false,
            error: `Invalid next status: '${next}'. Must be one of: draft, review, approved, published`
        };
    }

    // Check if transition is same status (no-op, but valid)
    if (currentStatus === nextStatus) {
        return {
            passed: true // Same status is allowed (no-op)
        };
    }

    // Check if transition is allowed
    const allowedTransitions = VALID_TRANSITIONS[currentStatus];
    if (!allowedTransitions.includes(nextStatus)) {
        return {
            passed: false,
            error: `Invalid transition: '${current}' → '${next}'. Allowed transitions from '${current}': ${allowedTransitions.join(', ') || 'none (final state)'}`
        };
    }

    // Transition is valid
    return {
        passed: true
    };
}

/**
 * Get all valid next statuses for a given current status
 */
export function getValidNextStatuses(current: string): PackStatus[] {
    const currentStatus = current.toLowerCase() as PackStatus;
    return VALID_TRANSITIONS[currentStatus] || [];
}

/**
 * Check if a status is a final state (no further transitions)
 */
export function isFinalStatus(status: string): boolean {
    const currentStatus = status.toLowerCase() as PackStatus;
    return VALID_TRANSITIONS[currentStatus]?.length === 0;
}

/**
 * Get human-readable transition workflow
 */
export function getStatusWorkflow(): string {
    return `
Status Transition Workflow:
  
  draft ──→ review ──→ approved ──→ published
    ↑         ↓           ↓
    └─────────┴───────────┘
    
  - draft → review: Submit for review
  - review → approved: Approve content
  - review → draft: Send back for revisions
  - approved → published: Publish content
  - approved → review: Send back for re-review
  - published: Final state (no transitions)
`;
}





























