/**
 * WebSocket服务
 */
import { io, Socket } from 'socket.io-client';
import type { WebSocketMessage } from '@/types';

class WebSocketService {
  private sockets: Map<number, Socket> = new Map();
  private listeners: Map<number, Set<(message: WebSocketMessage) => void>> =
    new Map();

  /**
   * 连接到项目的WebSocket
   */
  connect(projectId: number): void {
    if (this.sockets.has(projectId)) {
      return; // 已连接
    }

    const wsUrl =
      import.meta.env.VITE_WS_URL || `ws://localhost:8000/ws/projects/${projectId}`;
    const socket = io(wsUrl, {
      transports: ['websocket'],
      path: '/ws/socket.io',
    });

    socket.on('connect', () => {
      console.log(`✅ WebSocket connected to project ${projectId}`);
    });

    socket.on('message', (data: string) => {
      try {
        const message: WebSocketMessage = JSON.parse(data);
        this.notifyListeners(projectId, message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ WebSocket disconnected from project ${projectId}`);
    });

    socket.on('error', (error: any) => {
      console.error(`WebSocket error for project ${projectId}:`, error);
    });

    this.sockets.set(projectId, socket);

    // 发送心跳
    this.startHeartbeat(projectId);
  }

  /**
   * 断开WebSocket连接
   */
  disconnect(projectId: number): void {
    const socket = this.sockets.get(projectId);
    if (socket) {
      socket.disconnect();
      this.sockets.delete(projectId);
      this.listeners.delete(projectId);
    }
  }

  /**
   * 添加消息监听器
   */
  addListener(
    projectId: number,
    listener: (message: WebSocketMessage) => void
  ): void {
    if (!this.listeners.has(projectId)) {
      this.listeners.set(projectId, new Set());
    }
    this.listeners.get(projectId)!.add(listener);
  }

  /**
   * 移除消息监听器
   */
  removeListener(
    projectId: number,
    listener: (message: WebSocketMessage) => void
  ): void {
    const listeners = this.listeners.get(projectId);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(
    projectId: number,
    message: WebSocketMessage
  ): void {
    const listeners = this.listeners.get(projectId);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(message);
        } catch (error) {
          console.error('Error in WebSocket listener:', error);
        }
      });
    }
  }

  /**
   * 发送消息
   */
  send(projectId: number, message: any): void {
    const socket = this.sockets.get(projectId);
    if (socket && socket.connected) {
      socket.emit('message', JSON.stringify(message));
    }
  }

  /**
   * 请求当前状态
   */
  requestStatus(projectId: number): void {
    this.send(projectId, { type: 'get_status' });
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(projectId: number): void {
    const interval = setInterval(() => {
      const socket = this.sockets.get(projectId);
      if (!socket || !socket.connected) {
        clearInterval(interval);
        return;
      }
      this.send(projectId, { type: 'ping' });
    }, 30000); // 30秒心跳
  }
}

export const wsService = new WebSocketService();
export default wsService;
