import {
  HttpException,
  Injectable,
  OnModuleDestroy,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { isIP } from 'net';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const WINDOW_SECONDS = 15 * 60;
const BLOCK_SECONDS = 60;
const MAX_KEYS = 10_000;
const MAX_IN_FLIGHT = 64;

type Bucket = {
  key: string;
  limiter: RateLimiterMemory;
  limit: number;
  expiresAt: number;
  blockedUntil: number;
  inFlight: number;
};

/** Estado por proceso: para varias instancias se requiere un almacén compartido. */
@Injectable()
export class LoginAttemptsService implements OnModuleDestroy {
  private readonly policies = [5, 30, 20].map((points) => ({
    points,
    limiter: new RateLimiterMemory({
      points,
      duration: WINDOW_SECONDS,
      blockDuration: BLOCK_SECONDS,
    }),
  }));
  private readonly buckets = new Map<string, Bucket>();
  private pending: Promise<unknown> = Promise.resolve();
  private inFlight = 0;
  private readonly cleanup = setInterval(() => this.prune(), 60_000).unref();

  onModuleDestroy() {
    clearInterval(this.cleanup);
    for (const entry of this.buckets.values())
      void entry.limiter.delete(entry.key);
    this.buckets.clear();
  }

  /** Solo se usa la dirección del socket, nunca X-Forwarded-For del cliente. */
  private ipKey(address: string): string {
    const ip = (address || '').toLowerCase().replace(/^::ffff:(?=\d+\.)/, '');
    if (isIP(ip) === 4) return ip;
    if (isIP(ip) === 6) {
      const canonical = new URL(`http://[${ip}]/`).hostname.slice(1, -1);
      const [left, right] = canonical.split('::');
      const first = left ? left.split(':') : [];
      const last = right ? right.split(':') : [];
      const groups =
        right !== undefined
          ? [
              ...first,
              ...Array(8 - first.length - last.length).fill('0'),
              ...last,
            ]
          : first;
      // Agrupar /64 dificulta eludir el límite rotando direcciones IPv6.
      return (
        groups
          .slice(0, 4)
          .map((part) => part.padStart(4, '0'))
          .join(':') + '::/64'
      );
    }
    throw new HttpException(
      'No se pudo identificar el origen de la solicitud',
      400,
    );
  }

  private limited(seconds: number): HttpException {
    return new HttpException(
      {
        statusCode: 429,
        message: 'Demasiados intentos. Espera antes de volver a intentarlo.',
        retryAfterSeconds: Math.max(1, Math.ceil(seconds)),
      },
      429,
    );
  }

  private exclusive<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.pending.then(operation);
    this.pending = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  private prune() {
    const now = Date.now();
    for (const [key, bucket] of this.buckets) {
      if (bucket.expiresAt <= now) {
        void bucket.limiter.delete(key);
        this.buckets.delete(key);
      }
    }
  }

  async run<T>(
    usuario: string,
    address: string,
    authenticate: () => Promise<T>,
  ): Promise<T> {
    const user = usuario.toLowerCase().trim();
    const ip = this.ipKey(address);
    const keys = [[user, ip], [ip], [user]].map(
      (parts, index) =>
        `${index}:${createHash('sha256').update(JSON.stringify(parts)).digest('hex')}`,
    );
    const reserved = await this.exclusive(async () => {
      this.prune();
      const missing = keys.filter((key) => !this.buckets.has(key)).length;
      if (
        this.buckets.size + missing > MAX_KEYS ||
        this.inFlight >= MAX_IN_FLIGHT
      )
        throw this.limited(60);
      const wait = Math.max(
        0,
        ...keys.map(
          (key) => (this.buckets.get(key)?.blockedUntil ?? 0) - Date.now(),
        ),
      );
      if (wait > 0) throw this.limited(wait / 1000);
      const entries = keys.map(
        (key, index) =>
          this.buckets.get(key) ?? {
            key,
            limiter: this.policies[index].limiter,
            limit: this.policies[index].points,
            expiresAt: Date.now() + WINDOW_SECONDS * 1000,
            blockedUntil: 0,
            inFlight: 0,
          },
      );
      for (const entry of entries) {
        const state = await entry.limiter.get(entry.key);
        // También reservar los intentos en curso evita carreras antes de bcrypt.
        if ((state?.consumedPoints ?? 0) + entry.inFlight >= entry.limit)
          throw this.limited(1);
      }
      for (const entry of entries) {
        entry.inFlight++;
        this.buckets.set(entry.key, entry);
      }
      this.inFlight++;
      return entries;
    });

    let credentialFailure = false;
    try {
      return await authenticate();
    } catch (error) {
      credentialFailure = error instanceof UnauthorizedException;
      throw error;
    } finally {
      await this.exclusive(async () => {
        this.inFlight--;
        for (const entry of reserved) {
          entry.inFlight--;
          if (
            this.buckets.get(entry.key) !== entry ||
            entry.expiresAt <= Date.now()
          )
            continue;
          if (credentialFailure) {
            const state = await entry.limiter.consume(entry.key);
            if (state.isFirstInDuration)
              entry.expiresAt = Date.now() + state.msBeforeNext;
            if (state.consumedPoints >= entry.limit) {
              await entry.limiter.block(entry.key, BLOCK_SECONDS);
              entry.blockedUntil = Date.now() + BLOCK_SECONDS * 1000;
              entry.expiresAt = entry.blockedUntil;
            }
          }
        }
      });
    }
  }
}
