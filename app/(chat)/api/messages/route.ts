import { auth } from "@/app/(auth)/auth";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { convertToUIMessages } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return Response.json({ error: "chatId required" }, { status: 400 });
  }

  const session = await auth();

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const chat = await getChatById({ id: chatId });

  if (!chat) {
    return Response.json({
      isReadonly: false,
      messages: [],
      userId: session.user.id,
    });
  }

  const messages = await getMessagesByChatId({ id: chatId });

  return Response.json({
    isReadonly: session.user.id !== chat.userId,
    messages: convertToUIMessages(messages),
    userId: chat.userId,
  });
}
