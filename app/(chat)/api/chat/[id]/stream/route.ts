import { UI_MESSAGE_STREAM_HEADERS } from "ai";
import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";
import { auth } from "@/app/(auth)/auth";
import { getChatById, getStreamIdsByChatId } from "@/lib/db/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return new Response(null, { status: 401 });
  }

  const chat = await getChatById({ id });

  if (!chat || chat.userId !== session.user.id) {
    return new Response(null, { status: 403 });
  }

  if (!process.env.REDIS_URL) {
    return new Response(null, { status: 204 });
  }

  const streamIds = await getStreamIdsByChatId({ chatId: id });
  const streamId = streamIds.at(-1);

  if (!streamId) {
    return new Response(null, { status: 204 });
  }

  const streamContext = createResumableStreamContext({ waitUntil: after });
  const stream = await streamContext.resumeExistingStream(streamId);

  if (!stream) {
    return new Response(null, { status: 204 });
  }

  return new Response(stream, {
    headers: UI_MESSAGE_STREAM_HEADERS,
  });
}
