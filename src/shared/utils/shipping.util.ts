export function calculateShippingFee(totalAmount: number): number {
  const THRESHOLD = 50000;
  const FEE = 3000;
  return totalAmount < THRESHOLD ? FEE : 0;
}
