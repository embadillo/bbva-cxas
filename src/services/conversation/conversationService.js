import { runtime } from '../../config/runtime';
import { sendMockConversationTurn } from './mockConversationAdapter';
import { sendCXASConversationTurn } from './cxasConversationAdapter';

export function sendConversationTurn(text, context = {}) {
  return runtime.conversationMode === 'cxas'
    ? sendCXASConversationTurn(text, context)
    : sendMockConversationTurn(text, context);
}
