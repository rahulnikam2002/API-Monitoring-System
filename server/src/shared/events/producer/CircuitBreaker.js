

export const CircuitState = Object.freeze({
    CLOSED: 'CLOSED',
    OPEN: "OPEN",
    HALF_OPEN: 'HALF_OPEN'
})

export class CircuitBreaker {
    constructor(opts = {}) {
        this.failureThreshold = opts.failureThreshold ?? 5;
        this.cooldownMs = opts.cooldownMs ?? 30_000;
        this.halfOpenMaxAttempts = opts.halfOpenMaxAttempts ?? 3;
        this.logger = opts.logger ?? console;

        this._state = CircuitState.CLOSED;
        this._failures = 0;
        this._lastFailureTime = 0;
        this._halfOpenAttempts = 0;
        this._halfOpenSuccesses = 0;
    };

    // Some helper methods

    /**
     * 
     * @returns 
     */
    _cooldownElapsed() {
        return Date.now() - this._lastFailureTime >= this.cooldownMs;
    }

    _transitionTo(newState) {
        const prev = this._state;
        this._state = newState;

        this.logger.info(`[CircuitBreaker] ${prev} => ${newState}`);

        if (newState === CircuitState.HALF_OPEN) {
            this._halfOpenAttempts = 0;
            this._halfOpenSuccesses = 0;
            this.logger.info(`[CircuitBreaker] ${prev} => HALF_OPEN`)
        }

    }

    _openCircuit() {
        this._lastFailureTime = Date.now();
        this._transitionTo(CircuitState.OPEN);
        this.logger.error('[CircuitBreaker] OPEN', {
            failures: this._failures,
            cooldownMs: this.cooldownMs,
        });
    }

    _reset() {
        this._state = CircuitState.CLOSED;
        this._failures = 0;
        this._halfOpenAttempts = 0;
        this._halfOpenSuccesses = 0;
        this.logger.info('[CircuitBreaker] HALF_OPEN => CLOSED');
    }

    /**
     * Current State
     */
    get state() {
        if (this._state === CircuitState.OPEN && this._cooldownElapsed()) {
            this._transitionTo(CircuitState.HALF_OPEN);
        }

        return this._state
    }

    allowRequest() {
        const current = this.state;

        this.logger.debug('[CircuitBreaker] allowRequest check', {
            state: current,
            halfOpenAttempts: this._halfOpenAttempts,
            halfOpenMaxAttempts: this.halfOpenMaxAttempts,
            halfOpenSuccesses: this._halfOpenSuccesses,
            failures: this._failures
        });

        if (current === CircuitState.CLOSED) return true;

        if (current === CircuitState.HALF_OPEN) {
            if (this._halfOpenAttempts < this.halfOpenMaxAttempts) {
                this._halfOpenAttempts++;
                this.logger.info(`[CircuitBreaker] allowing HALF_OPEN attempt ${this._halfOpenAttempts}/${this.halfOpenMaxAttempts}`);
                return true;
            }
            this.logger.warn(`[CircuitBreaker] HALF_OPEN attempts exhausted (${this._halfOpenAttempts}/${this.halfOpenMaxAttempts})`);
            return false;
        }

        this.logger.info(`[CircuitBreaker] rejecting request, state: ${current}`);
        return false;
    }

    onSuccess() {
        this.logger.info('[CircuitBreaker] success recorded', {
            state: this._state,
            halfOpenSuccesses: this._halfOpenSuccesses,
            halfOpenMaxAttempts: this.halfOpenMaxAttempts,
            failures: this._failures
        });

        if (this._state === CircuitState.HALF_OPEN) {
            this._halfOpenSuccesses++;
            this.logger.info(`[CircuitBreaker] HALF_OPEN success ${this._halfOpenSuccesses}/${this.halfOpenMaxAttempts}`);
            if (this._halfOpenSuccesses >= this.halfOpenMaxAttempts) {
                this._reset();
                this.logger.info('[CircuitBreaker] reset to CLOSED after successful half-open probes');
            }
            return;
        }

        if (this._failures > 0) {
            this._failures = 0;
            this.logger.info('[CircuitBreaker] failure counter reset after success');
        }
    };

    onFailure() {
        this.logger.error('[CircuitBreaker] failure recorded', {
            state: this._state,
            failures: this._failures,
            failureThreshold: this.failureThreshold
        });

        if (this._state === CircuitState.HALF_OPEN) {
            this.logger.warn('[CircuitBreaker] half-open failed, reopening circuit');
            this._openCircuit();
            return;
        }

        this._failures++;
        this._lastFailureTime = Date.now();

        this.logger.info(`[CircuitBreaker] failure count: ${this._failures}/${this.failureThreshold}`);
        if (this._failures >= this.failureThreshold) {
            this._openCircuit();
        }
    };

    // Manual reset method for debugging
    forceReset() {
        this.logger.warn('[CircuitBreaker] FORCE RESET - manually resetting circuit breaker');
        this._state = CircuitState.CLOSED;
        this._failures = 0;
        this._halfOpenAttempts = 0;
        this._halfOpenSuccesses = 0;
        this._lastFailureTime = 0;
    }

    getMetrics() {
        return {
            state: this._state,
            failures: this._failures,
            halfOpenAttempts: this._halfOpenAttempts,
            halfOpenSuccesses: this.halfOpenSuccesses,
            lastFailureTime: this._lastFailureTime,
            cooldownElapsed: this._cooldownElapsed()
        };
    }

    snapshot() {
        return {
            state: this.state,
            failures: this._failures,
            lastFailureTime: this._lastFailureTime,
            halfOpenAttempts: this._halfOpenAttempts,
            halfOpenSuccesses: this._halfOpenSuccesses,
            cooldownMs: this.cooldownMs,
            failureThreshold: this.failureThreshold,
        };
    }
}