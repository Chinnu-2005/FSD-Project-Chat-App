import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
    this.socket = io(socketUrl, {
      auth: { token }
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  joinRoom(roomId) {
    this.emit('join_room', roomId);
  }

  leaveRoom(roomId) {
    this.emit('leave_room', roomId);
  }

  sendPrivateMessage(data) {
    this.emit('send_private_message', data);
  }

  sendGroupMessage(data) {
    this.emit('send_group_message', data);
  }

  startTyping(chatId, isGroup = false) {
    this.emit('typing_start', { chatId, isGroup });
  }

  stopTyping(chatId, isGroup = false) {
    this.emit('typing_stop', { chatId, isGroup });
  }

  markMessagesRead(chatId, isGroup = false) {
    this.emit('mark_messages_read', { chatId, isGroup });
  }
}

export default new SocketService();