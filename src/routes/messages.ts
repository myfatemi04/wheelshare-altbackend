import api from "../api";
import CustomRouter from "../customrouter";
import { T } from "../validate";
import { Unauthorized } from '../errors';

const messages = new CustomRouter();

const assertSendMessage = T.object({
  content: T.string(),
  carpoolId: T.number(),
})

messages.post('/send_message', async (req) => {
  // @ts-expect-error
  const userId = +req.session.userId;

  const { content, carpoolId } = assertSendMessage(req.body);

  const { id } = await api.messages.send(userId, carpoolId, content);
  return id;
})

const assertRemoveMessage = T.object({
  id: T.number()
})

messages.post('/remove_message', async (req) => {
  // @ts-expect-error
  const userId = +req.session.userId;

  const { id } = assertRemoveMessage(req.body);
  const message = await api.messages.getMessage(id);

  if(message.userId !== userId) {
    throw new Unauthorized();
  }

  api.messages.remove(id);
})