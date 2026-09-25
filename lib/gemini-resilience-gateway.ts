/**
 * Gemini Resilience Gateway (TypeScript)
 * Module cung cấp cơ chế gọi Gemini API an toàn:
 * - Cascading Model Fallback (tự động chuyển sang model kế tiếp khi model cao nhất bị lỗi/quá tải)
 * - Latency Timeout (ngắt và chuyển model khi quá thời gian chờ quy định)
 * - Multi-Key Failover (chuyển sang API Key dự phòng khi cạn kiệt quota)
 */

export interface ModelCandidate {
  model: string;
  timeoutMs: number;
  label?: string;
}

export const DEFAULT_QUALITY_WATERFALL: ModelCandidate[] = [
  { model: 'gemini-3.8-flash', timeoutMs: 12000, label: 'Gemini 3.8 Flash (Chính)' },
  { model: 'gemini-3.7-flash', timeoutMs: 10000, label: 'Gemini 3.7 Flash (Dự phòng 1)' },
  { model: 'gemini-3.6-flash', timeoutMs: 10000, label: 'Gemini 3.6 Flash (Dự phòng 2)' },
  { model: 'gemini-3.5-flash-lite', timeoutMs: 8000, label: 'Gemini 3.5 Flash-Lite (Cứu hộ)' },
];

export function buildDynamicWaterfall(preferredModel?: string): ModelCandidate[] {
  if (!preferredModel || !preferredModel.trim()) return DEFAULT_QUALITY_WATERFALL;
  const match = DEFAULT_QUALITY_WATERFALL.find((c) => c.model === preferredModel);
  const others = DEFAULT_QUALITY_WATERFALL.filter((c) => c.model !== preferredModel);
  return [match || { model: preferredModel, timeoutMs: 12000, label: `${preferredModel} (Chính)` }, ...others];
}

export interface GatewayConfig {
  candidates?: ModelCandidate[];
  apiKeys?: string[];
  maxRetriesPerModel?: number;
  totalDeadlineMs?: number;
  onFallback?: (info: {
    fromModel: string;
    toModel: string;
    reason: string;
    elapsedMs: number;
  }) => void;
}

export interface CallResult<T> {
  data: T;
  usedModel: string;
  usedKeyIndex: number;
  attempts: number;
  durationMs: number;
  fallbacks: { fromModel: string; toModel: string; reason: string }[];
}

export function isFallbackEligibleError(error: unknown): { canFallback: boolean; reason: string } {
  if (!error) return { canFallback: false, reason: 'Unknown error' };

  const err = error as { name?: string; message?: string; status?: number; statusCode?: number };

  if (err.name === 'AbortError' || err.name === 'TimeoutError' || err.message?.includes('aborted') || err.message?.includes('timed out')) {
    return { canFallback: true, reason: 'Yêu cầu quá thời gian chờ (Latency Timeout)' };
  }

  const status = err.status ?? err.statusCode;
  const message = (err.message || '').toLowerCase();

  if (status === 429 || message.includes('resource_exhausted') || message.includes('rate limit') || message.includes('quá tải')) {
    return { canFallback: true, reason: 'Quá tải hạn mức truy cập (HTTP 429 Rate Limit)' };
  }

  if (status === 503 || status === 502 || status === 500 || status === 504 || message.includes('overloaded') || message.includes('service unavailable')) {
    return { canFallback: true, reason: 'Hệ thống Gemini tạm thời quá tải (HTTP 503/504)' };
  }

  if (status === 404 || message.includes('not found') || message.includes('is not supported')) {
    return { canFallback: true, reason: 'Model không khả dụng hoặc đã ngừng hỗ trợ (HTTP 404)' };
  }

  return { canFallback: false, reason: `Lỗi không chuyển tầng: ${err.message || status}` };
}

export async function executeWithCascadeFallback<T>(
  action: (modelId: string, apiKey: string, signal: AbortSignal) => Promise<T>,
  config: GatewayConfig = {}
): Promise<CallResult<T>> {
  const candidates = config.candidates && config.candidates.length > 0 ? config.candidates : DEFAULT_QUALITY_WATERFALL;
  const rawKeys = config.apiKeys && config.apiKeys.length > 0 ? config.apiKeys : [process.env.GEMINI_API_KEY || ''];
  const apiKeys = rawKeys.map((k) => k.trim()).filter(Boolean);

  if (!apiKeys.length) {
    throw new Error('Chưa cấu hình API Key. Vui lòng kết nối Gemini API Key.');
  }

  const maxRetriesPerModel = config.maxRetriesPerModel ?? 0;
  const totalDeadlineMs = config.totalDeadlineMs ?? 115000;

  const startTime = Date.now();
  let keyIndex = 0;
  let totalAttempts = 0;
  let lastError: unknown = null;
  const fallbacks: { fromModel: string; toModel: string; reason: string }[] = [];

  for (let modelIdx = 0; modelIdx < candidates.length; modelIdx++) {
    const candidate = candidates[modelIdx];

    for (let retry = 0; retry <= maxRetriesPerModel; retry++) {
      totalAttempts++;

      const currentElapsed = Date.now() - startTime;
      if (currentElapsed >= totalDeadlineMs) {
        throw new Error(`Đã vượt quá hạn mức thời gian toàn cục (${totalDeadlineMs}ms). Thao tác bị dừng.`);
      }

      const activeApiKey = apiKeys[keyIndex];
      const remainingTime = totalDeadlineMs - currentElapsed;
      const attemptTimeout = Math.min(candidate.timeoutMs, remainingTime);
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(new Error(`Timeout sau ${attemptTimeout}ms`)), attemptTimeout);

      try {
        const result = await action(candidate.model, activeApiKey, controller.signal);
        clearTimeout(timeoutHandle);

        return {
          data: result,
          usedModel: candidate.model,
          usedKeyIndex: keyIndex,
          attempts: totalAttempts,
          durationMs: Date.now() - startTime,
          fallbacks,
        };
      } catch (err: unknown) {
        clearTimeout(timeoutHandle);
        lastError = err;

        const errObj = err as { message?: string; status?: number };

        if ((errObj.message?.includes('quota_exceeded') || errObj.status === 429) && keyIndex + 1 < apiKeys.length) {
          keyIndex++;
          continue;
        }

        const evaluation = isFallbackEligibleError(err);
        if (!evaluation.canFallback) {
          throw err;
        }

        const isLastModel = modelIdx === candidates.length - 1;
        const isLastRetry = retry === maxRetriesPerModel;

        if (!isLastModel && isLastRetry) {
          const nextCandidate = candidates[modelIdx + 1];
          fallbacks.push({
            fromModel: candidate.model,
            toModel: nextCandidate.model,
            reason: evaluation.reason,
          });
          if (config.onFallback) {
            config.onFallback({
              fromModel: candidate.model,
              toModel: nextCandidate.model,
              reason: evaluation.reason,
              elapsedMs: Date.now() - startTime,
            });
          }
          break;
        } else if (!isLastRetry) {
          await new Promise((res) => setTimeout(res, 500 + Math.random() * 500));
        }
      }
    }
  }

  throw lastError || new Error('Tất cả các mô hình trong danh sách fallback đều không phản hồi thành công.');
}
