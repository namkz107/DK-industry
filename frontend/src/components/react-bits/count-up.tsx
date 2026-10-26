export function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  return <span>{to}{suffix}</span>
}
