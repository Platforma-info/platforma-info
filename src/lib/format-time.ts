export function formatDistanceToNow(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "acum câteva secunde";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `acum ${minutes} ${minutes === 1 ? "minut" : "minute"}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `acum ${hours} ${hours === 1 ? "oră" : "ore"}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `acum ${days} ${days === 1 ? "zi" : "zile"}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `acum ${months} ${months === 1 ? "lună" : "luni"}`;
  const years = Math.floor(months / 12);
  return `acum ${years} ${years === 1 ? "an" : "ani"}`;
}
