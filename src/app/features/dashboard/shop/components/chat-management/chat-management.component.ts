import {
  Component,
  OnInit,
  inject,
  signal,
  OnDestroy,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faPaperPlane,
  faImage,
  faCircle,
  faUser,
  faReply,
} from '@fortawesome/free-solid-svg-icons';
import { ChatService } from '../../../../../core/services/chat.service';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-chat-management',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './chat-management.component.html',
  styleUrl: './chat-management.component.scss',
})
export class ChatManagementComponent implements OnInit, OnDestroy, OnChanges {
  @Input() shopId?: string;
  private readonly chatService = inject(ChatService);
  private readonly authService = inject(AuthService);

  currentUser = this.authService.currentUser;
  conversations = signal<any[]>([]);
  activeConversation = signal<any>(null);
  messages = signal<any[]>([]);
  newMessage = signal<string>('');

  icons = {
    send: faPaperPlane,
    image: faImage,
    online: faCircle,
    user: faUser,
    reply: faReply,
  };

  ngOnInit() {
    this.loadConversations();
    this.startPolling();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['shopId'] && this.shopId) {
      this.loadConversations();
    }
  }

  private pollInterval: any;
  startPolling() {
    this.pollInterval = setInterval(() => {
      const active = this.activeConversation();
      if (active) {
        this.loadMessages(active._id);
      }
      this.loadConversations();
    }, 5000);
  }

  loadConversations() {
    if (!this.shopId) {
      this.conversations.set([]);
      return;
    }
    this.chatService.getShopConversations(this.shopId).subscribe((convs) => {
      this.conversations.set(convs);

      // If active conversation is no longer in the list (due to shop switch), clear it
      const active = this.activeConversation();
      if (active && !convs.find((c) => c._id === active._id)) {
        this.activeConversation.set(null);
        this.messages.set([]);
      }
    });
  }

  selectConversation(conv: any) {
    this.messages.set([]); // Clear immediately to avoid showing old data
    this.activeConversation.set(conv);
    this.loadMessages(conv._id);
    this.chatService.markAsRead(conv._id).subscribe(() => {
      this.loadConversations(); // Refresh list to update unread badges
    });
  }

  loadMessages(convId: string) {
    this.chatService.getMessages(convId).subscribe((msgs) => {
      this.messages.set(msgs);
      this.scrollToBottom();
    });
  }

  sendMessage() {
    if (!this.newMessage().trim() && !this.selectedImages.length) return;

    const currentActive = this.activeConversation();
    if (!currentActive) return;

    const content = this.newMessage();
    const images = [...this.selectedImages];
    const tempId = 'temp-' + Date.now();

    // Optimistic Update
    const optimisticMsg = {
      _id: tempId,
      content,
      images,
      sender: currentActive.shopOwner, // Attribution logic: Shop side
      createdAt: new Date().toISOString(),
      isTemporary: true,
    };

    this.messages.update((list) => [...list, optimisticMsg]);
    this.newMessage.set('');
    this.selectedImages = [];
    this.scrollToBottom();

    const data = {
      conversationId: currentActive._id,
      content,
      images,
      isDashboard: true,
    };

    this.chatService.sendMessage(data).subscribe({
      next: (msg: any) => {
        this.messages.update((list) => list.map((m) => (m._id === tempId ? msg : m)));
        this.loadConversations();
      },
      error: () => {
        // Rollback on error
        this.messages.update((list) => list.filter((m) => m._id !== tempId));
        // TODO: Show error notification
      },
    });
  }

  selectedImages: string[] = [];
  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      for (let file of files) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.selectedImages.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeImage(index: number) {
    this.selectedImages.splice(index, 1);
  }

  isMyMessage(sender: any): boolean {
    const active = this.activeConversation();
    if (!active || !sender) return false;

    const senderId = String(sender?._id || sender);
    const customerId = String(active.customer?._id || active.customer);

    // In Dashboard, "My Message" is anything NOT from the customer (i.e. from the shop/owner/admin)
    return senderId !== customerId;
  }

  private scrollToBottom() {
    setTimeout(() => {
      const container = document.querySelector('.messages-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }
}
