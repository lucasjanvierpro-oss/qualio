export type WherebyRoom = {
  roomUrl: string;
  hostRoomUrl: string;
  meetingId: string;
};

export async function createWherebyRoom(endDate: Date): Promise<WherebyRoom> {
  const response = await fetch("https://api.whereby.dev/v1/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHEREBY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      endDate: endDate.toISOString(),
      fields: ["hostRoomUrl"],
    }),
  });

  if (!response.ok) {
    throw new Error(`Whereby API error: ${response.status}`);
  }

  return response.json() as Promise<WherebyRoom>;
}
