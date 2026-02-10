import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEdit, faUserCircle, faShieldAlt, faCheckCircle, faTimesCircle, faPowerOff } from '@fortawesome/free-solid-svg-icons';
import { UserService } from '../../../../core/services/user.service';
import { User, RegisterRequest, UserResponse } from '../../../../shared/models/user.model';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [CommonModule, FormsModule, FontAwesomeModule],
    templateUrl: './user-list.component.html',
    styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit {
    private readonly userService = inject(UserService);

    // Icons
    protected readonly icons = {
        edit: faEdit,
        user: faUserCircle,
        admin: faShieldAlt,
        active: faCheckCircle,
        inactive: faTimesCircle,
        power: faPowerOff
    };

    users = signal<User[]>([]);
    showAddForm = false;

    // Pagination state
    totalItems = signal<number>(0);
    totalPages = signal<number>(0);
    currentPage = signal<number>(1);
    limit = signal<number>(10); // Default to 10 for dashboard lists
    errorMessage = signal<string | null>(null);

    // Edit Modal State
    isEditModalOpen = signal<boolean>(false);
    editingUser = signal<User | null>(null);
    editForm: Partial<User> = {
        name: '',
        surname: '',
        email: '',
        contact: '',
        role: 'user'
    };

    newUser: RegisterRequest = {
        name: '',
        surname: '',
        email: '',
        contact: '',
        password: '',
        role: 'user'
    };

    ngOnInit() {
        this.loadUsers();
    }

    loadUsers() {
        const params = {
            page: this.currentPage(),
            limit: this.limit()
        };
        this.userService.getAllUsers(params).subscribe({
            next: (res: UserResponse) => {
                this.users.set(res.data);
                this.totalItems.set(res.total);
                this.totalPages.set(res.totalPages);
            },
            error: (err: any) => console.error('Error loading users', err)
        });
    }

    changePage(page: number) {
        if (page < 1 || page > this.totalPages()) return;
        this.currentPage.set(page);
        this.loadUsers();
    }

    createUser(event: Event) {
        event.preventDefault();
        this.errorMessage.set(null);
        this.userService.createUser(this.newUser).subscribe({
            next: () => {
                this.loadUsers();
                this.showAddForm = false;
                this.newUser = { name: '', surname: '', email: '', contact: '', password: '', role: 'user' };
            },
            error: (err: any) => {
                console.error('Error creating user', err);
                const msg = err.error?.message || (err.error?.errors ? err.error.errors[0]?.message : 'Erreur lors de la création');
                this.errorMessage.set(msg);
            }
        });
    }

    toggleUserStatus(user: User) {
        const newStatus = !user.isActive;
        const id = user._id || user.id;
        if (!id) return;

        this.userService.updateUserStatus(id, newStatus).subscribe({
            next: () => this.loadUsers(),
            error: (err: any) => console.error('Error updating status', err)
        });
    }

    openEditModal(user: User) {
        this.editingUser.set(user);
        this.editForm = {
            name: user.name,
            surname: user.surname || '',
            email: user.email,
            contact: user.contact || '',
            role: user.role
        };
        this.isEditModalOpen.set(true);
        this.errorMessage.set(null);
    }

    closeEditModal() {
        this.isEditModalOpen.set(false);
        this.editingUser.set(null);
    }

    updateUser(event: Event) {
        event.preventDefault();
        const user = this.editingUser();
        const id = user?._id || user?.id;
        if (!id) return;

        this.userService.updateUserData(id, this.editForm).subscribe({
            next: () => {
                this.loadUsers();
                this.closeEditModal();
            },
            error: (err: any) => {
                console.error('Error updating user', err);
                this.errorMessage.set(err.error?.message || 'Erreur lors de la mise à jour');
            }
        });
    }
}
