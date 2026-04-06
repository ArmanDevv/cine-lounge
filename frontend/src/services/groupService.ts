import api from './api';

export interface Group {
  _id: string;
  name: string;
  description: string;
  createdBy: {
    _id: string;
    username: string;
    avatar: string;
  };
  members: Array<{
    userId: {
      _id: string;
      username: string;
      avatar: string;
    };
    joinedAt: string;
  }>;
  inviteCode: string;
  playlist: Array<{
    movieId: {
      _id: string;
      title: string;
      genre: string;
      thumbnailUrl: string;
      videoUrl: string;
    };
    addedBy: {
      _id: string;
      username: string;
    };
    addedAt: string;
  }>;
  messages: Array<{
    senderId: {
      _id: string;
      username: string;
      avatar: string;
    };
    message: string;
    createdAt: string;
  }>;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export const groupService = {
  async getUserGroups() {
    const response = await api.get<Group[]>('/groups/my-groups');
    return response.data;
  },

  async getGroupById(groupId: string) {
    const response = await api.get<Group>(`/groups/${groupId}`);
    return response.data;
  },

  async getGroupByInviteCode(inviteCode: string) {
    const response = await api.get<Group>(`/groups/invite/${inviteCode}`);
    return response.data;
  },

  async createGroup(data: { name: string; description?: string }) {
    const response = await api.post<{ message: string; group: Group }>('/groups', data);
    return response.data.group;
  },

  async joinGroup(inviteCode: string) {
    const response = await api.post<{ message: string; group: Group }>(
      `/groups/${inviteCode}/join`
    );
    return response.data.group;
  },

  async addToPlaylist(groupId: string, movieId: string) {
    const response = await api.post<{ message: string; group: Group }>(
      `/groups/${groupId}/playlist`,
      { movieId }
    );
    return response.data.group;
  },

  async removeFromPlaylist(groupId: string, movieId: string) {
    const response = await api.delete<{ message: string; group: Group }>(
      `/groups/${groupId}/playlist/${movieId}`
    );
    return response.data.group;
  },

  async getGroupMessages(groupId: string) {
    const response = await api.get<{ messages: Group['messages'] }>(
      `/groups/${groupId}/messages`
    );
    return response.data.messages;
  },

  async deleteGroup(groupId: string) {
    const response = await api.delete<{ message: string }>(`/groups/${groupId}`);
    return response.data;
  },

  async getAgoraToken(groupId: string) {
    const response = await api.get<{
      token: string;
      appId: string;
      channelId: string;
      userId: string;
      uid: number;
    }>(`/groups/${groupId}/agora-token`);
    return response.data;
  },
};
