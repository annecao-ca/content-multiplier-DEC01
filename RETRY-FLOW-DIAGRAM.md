# 🔄 Retry Flow Diagram

## Exponential Backoff - Visual Guide

---

## 📊 Retry Timeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                     RETRY WITH EXPONENTIAL BACKOFF                  │
└─────────────────────────────────────────────────────────────────────┘

Time: 0s                1s              3s              7s
      │                │               │               │
      ▼                ▼               ▼               ▼
   ┌──────┐         ┌──────┐        ┌──────┐        ┌──────┐
   │ Try 1│  FAIL   │ Try 2│  FAIL  │ Try 3│  FAIL  │ Try 4│
   │  ⚡  │ ──────► │  ⚡  │ ─────► │  ⚡  │ ─────► │  ⚡  │
   └──────┘         └──────┘        └──────┘        └──────┘
      │                │               │               │
      │                │               │               │
      │ Wait 0s        │ Wait 1s       │ Wait 2s       │ Wait 4s
      │                │               │               │
      │                │               │               └─► SUCCESS ✅
      │                │               │                   or
      │                │               │                   FAIL ❌
      │                │               │
      │                │               └─► Continue or Fail
      │                │
      │                └─► Continue or Fail
      │
      └─► Immediate call

Config:
- maxRetries: 3
- initialDelay: 1000ms (1s)
- backoffMultiplier: 2 (x2)
- maxDelay: 10000ms (10s)
```

---

## 🔢 Delay Calculation

```
Formula: delay = initialDelay × (backoffMultiplier ^ attempt)

Attempt 0: 1000ms × (2 ^ 0) = 1000ms × 1 = 1000ms = 1s
Attempt 1: 1000ms × (2 ^ 1) = 1000ms × 2 = 2000ms = 2s
Attempt 2: 1000ms × (2 ^ 2) = 1000ms × 4 = 4000ms = 4s
Attempt 3: 1000ms × (2 ^ 3) = 1000ms × 8 = 8000ms = 8s
```

---

## 📈 Visual Timeline

```
Seconds:  0    1    2    3    4    5    6    7    8
          │    │    │    │    │    │    │    │    │
Call 1:   ●
          │
          ├─── Wait 1s ───┤
          │              │
Call 2:                  ●
                         │
                         ├────── Wait 2s ──────┤
                         │                     │
Call 3:                                        ●
                                               │
                                               ├──────── Wait 4s ────────┤
                                               │                         │
Call 4:                                                                  ●
                                                                         │
                                                                         ▼
                                                                    SUCCESS/FAIL

Total maximum time: 1s + 2s + 4s = 7s (chưa tính thời gian gọi API)
```

---

## 🎯 Flow Chart

```
┌─────────────────────────────────────────────────────────────────┐
│                        START: API CALL                          │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │  Attempt = 0  │
                        └───────┬───────┘
                                │
                                ▼
                        ┌───────────────┐
                        │  Call AI API  │
                        └───────┬───────┘
                                │
                                ▼
                        ┌───────────────┐
                        │   Success?    │
                        └───────┬───────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                   YES                     NO
                    │                       │
                    ▼                       ▼
            ┌───────────────┐       ┌─────────────────┐
            │ Return Result │       │ Retryable Error?│
            │      ✅       │       └────────┬────────┘
            └───────────────┘                │
                    │               ┌────────┴────────┐
                    │              YES               NO
                    │               │                 │
                    │               ▼                 ▼
                    │       ┌───────────────┐  ┌──────────────┐
                    │       │ Max Retries?  │  │ Throw Error  │
                    │       └───────┬───────┘  │      ❌      │
                    │               │          └──────────────┘
                    │       ┌───────┴───────┐
                    │      YES             NO
                    │       │               │
                    │       ▼               ▼
                    │  ┌──────────────┐  ┌────────────────────┐
                    │  │ Throw Error  │  │ Calculate Delay    │
                    │  │      ❌      │  │ (Exponential)      │
                    │  └──────────────┘  └─────────┬──────────┘
                    │                              │
                    │                              ▼
                    │                      ┌───────────────┐
                    │                      │  Sleep(delay) │
                    │                      └───────┬───────┘
                    │                              │
                    │                              ▼
                    │                      ┌───────────────┐
                    │                      │ Attempt += 1  │
                    │                      └───────┬───────┘
                    │                              │
                    │                              │
                    └──────────────────────────────┘
                                                   │
                                                   ▼
                                           (Loop back to Call AI API)
```

---

## 🔍 Error Classification

```
┌─────────────────────────────────────────────────────────────────┐
│                         ERROR TYPE                              │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ▼                               ▼
    ┌───────────────────┐           ┌──────────────────┐
    │ RETRYABLE ERRORS  │           │ NON-RETRYABLE    │
    │      (Retry)      │           │  (Fail Fast)     │
    └───────┬───────────┘           └────────┬─────────┘
            │                                │
            ▼                                ▼
    ┌───────────────┐               ┌───────────────┐
    │ 429 Rate Limit│               │ 400 Bad Req   │
    │ 500 Server Err│               │ 401 Unauth    │
    │ 502 Bad Gate  │               │ 403 Forbidden │
    │ 503 Unavail   │               │ 404 Not Found │
    │ 504 Timeout   │               │ 422 Validation│
    │ Network Errs  │               └───────────────┘
    └───────┬───────┘
            │
            ▼
    ┌───────────────┐
    │  RETRY with   │
    │  Exponential  │
    │   Backoff     │
    └───────────────┘
```

---

## 💡 Example Scenarios

### Scenario 1: Success on First Try ✅

```
Timeline:
0s:  ● Call API → Success ✅
     └─► Return immediately

Total time: ~500ms (API latency only)
Retries used: 0/3
```

### Scenario 2: Success on Second Try ✅

```
Timeline:
0s:  ● Call API → Fail (429 Rate Limit) ❌
1s:  ● Retry 1  → Success ✅
     └─► Return after 1 retry

Total time: ~1.5s (1s wait + 500ms API)
Retries used: 1/3
```

### Scenario 3: Success on Third Try ✅

```
Timeline:
0s:  ● Call API → Fail (503 Unavailable) ❌
1s:  ● Retry 1  → Fail (503 Unavailable) ❌
3s:  ● Retry 2  → Success ✅
     └─► Return after 2 retries

Total time: ~3.5s (1s + 2s wait + 500ms API)
Retries used: 2/3
```

### Scenario 4: All Retries Failed ❌

```
Timeline:
0s:  ● Call API → Fail (500 Server Error) ❌
1s:  ● Retry 1  → Fail (500 Server Error) ❌
3s:  ● Retry 2  → Fail (500 Server Error) ❌
7s:  ● Retry 3  → Fail (500 Server Error) ❌
     └─► Throw error after exhausting retries

Total time: ~9.5s (1s + 2s + 4s wait + API times)
Retries used: 3/3
Error: Max retries exceeded
```

### Scenario 5: Non-Retryable Error ❌

```
Timeline:
0s:  ● Call API → Fail (401 Unauthorized) ❌
     └─► Throw error immediately (no retry)

Total time: ~500ms (API latency only)
Retries used: 0/3
Error: Unauthorized (API key invalid)
```

---

## 📊 Statistics Table

| Scenario | Calls Made | Time Spent | Success Rate |
|----------|-----------|------------|--------------|
| Success on Try 1 | 1 | ~0.5s | 100% |
| Success on Try 2 | 2 | ~1.5s | 50% |
| Success on Try 3 | 3 | ~3.5s | 33% |
| Success on Try 4 | 4 | ~7.5s | 25% |
| All Failed | 4 | ~9.5s | 0% |

---

## 🎯 Code Implementation

### Config:

```typescript
const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,              // 3 lần retry
    initialDelay: 1000,         // 1 giây
    maxDelay: 10000,            // 10 giây max
    backoffMultiplier: 2        // Nhân đôi mỗi lần
};
```

### Delay Function:

```typescript
function getRetryDelay(attempt: number, config: RetryConfig): number {
    const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
    return Math.min(delay, config.maxDelay);
}

// Examples:
getRetryDelay(0, config) // → 1000ms (1s)
getRetryDelay(1, config) // → 2000ms (2s)
getRetryDelay(2, config) // → 4000ms (4s)
getRetryDelay(3, config) // → 8000ms (8s)
```

### Retry Function:

```typescript
async function callWithRetry<T>(
    fn: () => Promise<T>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            // Gọi function
            return await fn();
            
        } catch (error) {
            lastError = error;
            
            // Kiểm tra có retry được không
            if (!isRetryableError(error) || attempt === config.maxRetries) {
                throw error;
            }
            
            // Tính delay
            const delay = getRetryDelay(attempt, config);
            console.log(`Retry ${attempt + 1}/${config.maxRetries} sau ${delay}ms...`);
            
            // Đợi
            await sleep(delay);
        }
    }
    
    throw lastError;
}
```

---

## 🧪 Testing Logs

### Example Console Output:

```bash
[2025-12-01 18:00:00] Calling OpenAI API...
[2025-12-01 18:00:01] Error: 429 Rate Limit Exceeded
[2025-12-01 18:00:01] Retry 1/3 sau 1000ms...
[2025-12-01 18:00:02] Calling OpenAI API...
[2025-12-01 18:00:03] Error: 503 Service Unavailable
[2025-12-01 18:00:03] Retry 2/3 sau 2000ms...
[2025-12-01 18:00:05] Calling OpenAI API...
[2025-12-01 18:00:06] ✅ Success! Generated 10 ideas.
```

---

## 🎉 Summary

### ✅ Exponential Backoff Benefits:

1. **Tăng Success Rate** - Nhiều cơ hội thành công hơn
2. **Giảm Load** - Không spam API server
3. **Smart Retry** - Delay tăng dần, tránh rate limit
4. **Fail Fast** - Không retry lỗi client (400, 401, etc.)
5. **Configurable** - Dễ dàng tuning parameters

### 📊 Performance:

- **Best Case:** 0 retries, ~0.5s
- **Average Case:** 1-2 retries, ~1.5-3.5s
- **Worst Case:** 3 retries, ~7.5s
- **Max Time:** 9.5s (with all API calls)

### ✅ Production Ready:

- ✅ Battle-tested algorithm
- ✅ Configurable parameters
- ✅ Error classification
- ✅ Logging support
- ✅ Easy to debug

---

**Created:** December 1, 2025  
**Status:** ✅ Complete  
**Algorithm:** Exponential Backoff with Jitter (Optional)

