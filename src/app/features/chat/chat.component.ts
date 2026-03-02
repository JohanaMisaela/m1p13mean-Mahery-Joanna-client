import { Component, OnInit, inject, signal, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faPaperPlane,
  faImage,
  faChevronLeft,
  faCircle,
  faEdit,
  faStore,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { ShopService } from '../../core/services/shop.service';
import { ActivatedRoute } from '@angular/router';
import { computed } from '@angular/core';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements OnInit, OnDestroy {
  private readonly chatService = inject(ChatService);
  private readonly authService = inject(AuthService);
  private readonly shopService = inject(ShopService);
  private readonly route = inject(ActivatedRoute);

  currentUser = this.authService.currentUser;
  conversations = signal<any[]>([]);
  activeConversation = signal<any>(null);
  messages = signal<any[]>([]);
  newMessage = signal<string>('');

  displayConversations = computed(() => {
    return this.conversations();
  });

  icons = {
    send: faPaperPlane,
    image: faImage,
    back: faChevronLeft,
    online: faCircle,
    edit: faEdit,
    shop: faStore,
    clock: faClock,
  };

  ngOnInit() {
    this.loadConversations();

    // Check if we need to start a new chat from shopId param
    this.route.queryParams.subscribe((params) => {
      if (params['shopId']) {
        this.startNewChat(params['shopId']);
      }
    });

    // Start polling for new messages
    this.startPolling();
  }

  private pollInterval: any;
  startPolling() {
    this.pollInterval = setInterval(() => {
      const active = this.activeConversation();
      if (active && !active.isTemporary) {
        this.loadMessages(active._id);
      }
      this.loadConversations();
    }, 5000); // Poll every 5 seconds
  }

  loadConversations() {
    this.chatService.getConversations().subscribe((convs) => {
      this.conversations.set(convs);
    });
  }

  selectConversation(conv: any) {
    if (conv.isTemporary) {
      this.activeConversation.set(conv);
      this.messages.set([]);
      return;
    }
    this.activeConversation.set(conv);
    this.loadMessages(conv._id);
    this.chatService.markAsRead(conv._id).subscribe(() => {
      // Update local read status
      this.conversations.update((list) =>
        list.map((c) => (c._id === conv._id ? { ...c, unreadCount: 0 } : c)),
      );
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
      sender: currentActive.customer, // In customer view, "me" is the customer
      createdAt: new Date().toISOString(),
      isTemporary: true,
    };

    this.messages.update((list) => [...list, optimisticMsg]);
    this.newMessage.set('');
    this.selectedImages = [];
    this.scrollToBottom();

    const data: any = {
      content,
      images,
    };

    if (currentActive.isTemporary) {
      data.shopId = currentActive.shop._id;
    } else {
      data.conversationId = currentActive._id;
    }

    this.chatService.sendMessage(data).subscribe({
      next: (msg: any) => {
        this.messages.update((list) => list.map((m) => (m._id === tempId ? msg : m)));
        this.loadConversations();
      },
      error: () => {
        // Rollback on error
        this.messages.update((list) => list.filter((m) => m._id !== tempId));
      },
    });
  }

  // Image handling
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

  startNewChat(shopId: string) {
    this.chatService.findOrCreateConversation(shopId).subscribe((conv) => {
      this.activeConversation.set(conv);
      this.loadMessages(conv._id);
      this.loadConversations(); // Updates the sidebar immediately
    });
  }

  getShopStatus(openingHours?: string) {
    if (!openingHours) return { text: 'OUVERT', class: 'text-green-500', bg: 'bg-green-500' };

    try {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      // Parse "8:00 - 18:00" or similar
      const parts = openingHours.split('-').map((p) => p.trim());
      if (parts.length !== 2)
        return { text: 'OUVERT', class: 'text-green-500', bg: 'bg-green-500' };

      const parseTime = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + (m || 0);
      };

      const start = parseTime(parts[0]);
      const end = parseTime(parts[1]);

      const isOpen = currentTime >= start && currentTime <= end;
      return isOpen
        ? { text: 'OUVERT', class: 'text-green-500', bg: 'bg-green-500' }
        : { text: 'FERMÉ', class: 'text-red-500', bg: 'bg-red-500' };
    } catch (e) {
      return { text: 'OUVERT', class: 'text-green-500', bg: 'bg-green-500' };
    }
  }

  isMyMessage(sender: any): boolean {
    const active = this.activeConversation();
    if (!active) return false;

    const senderId = sender?._id || sender;
    const customerId = active.customer?._id || active.customer;

    // In Customer View, "My Message" is only messages from the customer
    return String(senderId) === String(customerId);
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
