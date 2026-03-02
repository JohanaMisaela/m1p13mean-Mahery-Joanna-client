import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/chat`;

  // Conversations
  getConversations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/conversations`);
  }

  findOrCreateConversation(shopId: string): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/conversations/find-or-create`, { shopId });
  }

  getShopConversations(shopId?: string): Observable<any[]> {
    let params = {};
    if (shopId) {
      params = { shopId };
    }
    return this.http.get<any[]>(`${this.API_URL}/conversations/shop`, { params });
  }

  // Messages
  getMessages(conversationId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/messages/${conversationId}`);
  }

  sendMessage(data: {
    shopId?: string;
    conversationId?: string;
    content?: string;
    images?: string[];
  }): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/messages`, data);
  }

  editMessage(messageId: string, content: string): Observable<any> {
    return this.http.patch<any>(`${this.API_URL}/messages/${messageId}`, { content });
  }

  markAsRead(conversationId: string): Observable<any> {
    return this.http.patch<any>(`${this.API_URL}/messages/read/${conversationId}`, {});
  }

  getUnreadCount(): Observable<{ totalUnread: number }> {
    return this.http.get<{ totalUnread: number }>(`${this.API_URL}/unread-count`);
  }

  getShopUnreadCount(shopId: string): Observable<{ totalUnread: number }> {
    return this.http.get<{ totalUnread: number }>(`${this.API_URL}/unread-count/shop/${shopId}`);
  }
}
