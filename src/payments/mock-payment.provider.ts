import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
@Injectable()
export class MockPaymentProvider {
 async processPayment(input:{amountCents:number; idempotencyKey:string; simulateFailure?:boolean}) {
  const reference = 'mock_' + createHash('sha256').update(input.idempotencyKey).digest('hex').slice(0,16);
  return { status: input.simulateFailure ? 'FAILED' as const : 'SUCCESS' as const, reference, amountCents: input.amountCents };
 }
}
