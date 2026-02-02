import { ChatMessage } from '@/types';
import { mockChatMessages, currentUser } from '@/data/mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const chatService = {
  async getMessages(groupId: string, limit = 50): Promise<ChatMessage[]> {
    await delay(300);
    return mockChatMessages.filter(m => m.groupId === groupId).slice(-limit);
  },

  async sendMessage(groupId: string, content: string): Promise<ChatMessage> {
    await delay(200);
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      senderId: currentUser.id,
      sender: currentUser,
      groupId,
      timestamp: new Date().toISOString(),
      type: 'text',
    };
    return newMessage;
  },

  async sendFile(groupId: string, file: File): Promise<ChatMessage> {
    await delay(500);
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: file.name,
      senderId: currentUser.id,
      sender: currentUser,
      groupId,
      timestamp: new Date().toISOString(),
      type: 'file',
      attachmentUrl: URL.createObjectURL(file),
    };
    return newMessage;
  },

  async deleteMessage(messageId: string): Promise<void> {
    await delay(300);
  },
};
