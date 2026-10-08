import { Component, OnInit } from '@angular/core';

import { User } from '../../models/user.model';
import { AdminService } from '../../services/admin.service';
import { describeError } from '../../error-message';

@Component({
  selector: 'app-admin-manage-users',
  templateUrl: './admin-manage-users.component.html',
  styleUrls: ['./admin-manage-users.component.css']
})
export class AdminManageUsersComponent implements OnInit {
  users: User[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  userToRemove?: User;
  isRemoving = false;

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;

    this.adminService.getUsers().subscribe({
      next: users => {
        this.isLoading = false;
        this.users = users || [];
      },
      error: error => {
        this.isLoading = false;
        this.errorMessage = describeError(error, 'Unable to load users');
      }
    });
  }

  makeAdmin(user: User): void {
    this.clearMessages();

    this.adminService.makeAdmin(user.userId!).subscribe({
      next: () => {
        this.successMessage = `${user.username} is now an admin.`;
        this.loadUsers();
      },
      error: error => this.errorMessage = describeError(error, 'Could not make this user an admin')
    });
  }

  canRemove(user: User): boolean {
    return user.userRole === 'Admin' && !user.masterAdmin;
  }

  askRemove(user: User): void {
    this.clearMessages();
    this.userToRemove = user;
  }

  cancelRemove(): void {
    if (!this.isRemoving) {
      this.userToRemove = undefined;
    }
  }

  confirmRemove(): void {
    const user = this.userToRemove!;
    this.isRemoving = true;

    this.adminService.removeAdmin(user.userId!).subscribe({
      next: () => {
        this.isRemoving = false;
        this.userToRemove = undefined;
        this.successMessage = `${user.username} is no longer an admin and is now a regular user.`;
        this.loadUsers();
      },
      error: error => {
        this.isRemoving = false;
        this.userToRemove = undefined;
        this.errorMessage = describeError(error, 'Could not remove this admin');
      }
    });
  }

  roleLabel(user: User): string {
    return user.masterAdmin ? 'Master Admin' : user.userRole;
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

}
