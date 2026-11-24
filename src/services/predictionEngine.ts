import { Token, Queue, Doctor, Prediction, ConfidenceLevel } from '../types';

export interface PredictionInput {
  queue: Queue;
  doctor: Doctor;
  tokensInQueue: Token[];
  targetToken: Token;
}

export class PredictionEngine {
  /**
   * Calculates actual historical consultation durations from completed tokens.
   * If there are at least 3 completed tokens, uses their real mean duration.
   * Otherwise falls back to the doctor's configured baseline duration.
   */
  public static calculateAverageDuration(
    completedTokens: Token[],
    doctorBaselineMinutes: number
  ): { average: number; sampleSize: number; variance: number } {
    const validDurations: number[] = [];

    for (const t of completedTokens) {
      if (t.called_at && t.completed_at) {
        const start = new Date(t.called_at).getTime();
        const end = new Date(t.completed_at).getTime();
        const durationMinutes = (end - start) / 60000;
        // Filter out unreasonable outliers (e.g. > 45 mins or < 1 min)
        if (durationMinutes >= 1 && durationMinutes <= 45) {
          validDurations.push(durationMinutes);
        }
      }
    }

    if (validDurations.length < 3) {
      return {
        average: doctorBaselineMinutes || 7,
        sampleSize: validDurations.length,
        variance: 2.0,
      };
    }

    const sum = validDurations.reduce((acc, d) => acc + d, 0);
    const mean = sum / validDurations.length;

    // Calculate sample variance
    const variance =
      validDurations.reduce((acc, d) => acc + Math.pow(d - mean, 2), 0) /
      validDurations.length;

    return {
      average: Math.round(mean * 10) / 10,
      sampleSize: validDurations.length,
      variance: Math.round(variance * 10) / 10,
    };
  }

  /**
   * Evaluates prediction confidence level based on sample size and variance.
   */
  public static determineConfidenceLevel(
    sampleSize: number,
    variance: number,
    queueStatus: string
  ): ConfidenceLevel {
    if (queueStatus === 'paused') {
      return 'low';
    }
    if (sampleSize >= 8 && variance < 4.0) {
      return 'high';
    }
    if (sampleSize >= 3 && variance < 8.0) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Main prediction calculation method for a given token in a queue.
   */
  public static estimateWaitingTime(input: PredictionInput): Prediction {
    const { queue, doctor, tokensInQueue, targetToken } = input;

    // 1. Separate tokens
    const completedTokens = tokensInQueue.filter((t) => t.status === 'completed');
    const waitingTokens = tokensInQueue
      .filter((t) => t.status === 'waiting')
      .sort((a, b) => new Date(a.registered_at).getTime() - new Date(b.registered_at).getTime());

    // 2. Calculate average duration
    const { average: avgDuration, sampleSize, variance } = this.calculateAverageDuration(
      completedTokens,
      doctor.consultation_duration || 7
    );

    // 3. Count patients ahead of target token
    let patientsAhead = 0;
    const isCurrentlyConsulting = targetToken.status === 'consulting';

    if (!isCurrentlyConsulting) {
      const targetIndex = waitingTokens.findIndex((t) => t.id === targetToken.id || t.token_number === targetToken.token_number);
      if (targetIndex >= 0) {
        patientsAhead = targetIndex + 1; // +1 includes the patient currently inside the doctor's room
      } else {
        // Fallback if not found in sorted waiting list
        patientsAhead = Math.max(0, (targetToken.position_in_queue || 1));
      }
    }

    // 4. Calculate base wait time
    let estimatedMinutes = patientsAhead * avgDuration;

    // Account for elapsed time of currently consulting patient
    const consultingToken = tokensInQueue.find((t) => t.status === 'consulting');
    if (consultingToken && consultingToken.called_at && patientsAhead > 0) {
      const elapsedMinutes = (Date.now() - new Date(consultingToken.called_at).getTime()) / 60000;
      const remainingForCurrent = Math.max(1, avgDuration - elapsedMinutes);
      estimatedMinutes = Math.max(1, (patientsAhead - 1) * avgDuration + remainingForCurrent);
    }

    // 5. Account for doctor status & pause
    const isPaused = queue.queue_status === 'paused' || doctor.availability_status === 'on_break';
    if (isPaused) {
      // Add pause buffer
      estimatedMinutes += 15;
    }

    // 6. Calculate realistic range [lower_estimate, upper_estimate]
    const spreadPercentage = sampleSize >= 8 ? 0.2 : 0.35;
    const spread = Math.max(3, Math.round(estimatedMinutes * spreadPercentage));
    const lowerEstimate = Math.max(1, Math.round(estimatedMinutes - spread));
    const upperEstimate = Math.round(estimatedMinutes + spread);

    // 7. Confidence level
    const confidenceLevel = this.determineConfidenceLevel(
      sampleSize,
      variance,
      queue.queue_status
    );

    return {
      id: `pred-${targetToken.id}-${Date.now()}`,
      queue_id: queue.id,
      token_id: targetToken.id,
      estimated_minutes: Math.round(estimatedMinutes),
      lower_estimate: lowerEstimate,
      upper_estimate: upperEstimate,
      confidence_level: confidenceLevel,
      calculated_at: new Date().toISOString(),
      factors: {
        patients_ahead: patientsAhead,
        patientsAhead,
        avg_duration_used: avgDuration,
        queue_paused: isPaused,
        sample_size: sampleSize,
      },
    };
  }

  /**
   * Helper to estimate waiting time for a new prospective walk-in patient.
   */
  public static estimateForNewWalkIn(
    queue: Queue,
    doctor: Doctor,
    tokensInQueue: Token[]
  ): { rangeText: string; minutes: number; lower: number; upper: number; patientsAhead: number } {
    const completedTokens = tokensInQueue.filter((t) => t.status === 'completed');
    const waitingTokens = tokensInQueue.filter((t) => t.status === 'waiting');
    const consultingToken = tokensInQueue.find((t) => t.status === 'consulting');

    const { average: avgDuration } = this.calculateAverageDuration(
      completedTokens,
      doctor.consultation_duration || 7
    );

    const totalWaiting = waitingTokens.length + (consultingToken ? 1 : 0);
    const estimatedMinutes = Math.max(5, totalWaiting * avgDuration);
    const spread = Math.max(3, Math.round(estimatedMinutes * 0.25));
    const lower = Math.max(1, Math.round(estimatedMinutes - spread));
    const upper = Math.round(estimatedMinutes + spread);

    return {
      rangeText: `${lower}–${upper} mins`,
      minutes: Math.round(estimatedMinutes),
      lower,
      upper,
      patientsAhead: totalWaiting,
    };
  }
}
