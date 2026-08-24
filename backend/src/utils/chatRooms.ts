export function conversationRoom(listingId: string, userA: string, userB: string): string {
  const [a, b] = [userA, userB].sort();
  return `convo:${listingId}:${a}:${b}`;
}
