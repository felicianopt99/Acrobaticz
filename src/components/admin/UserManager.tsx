"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslate } from '@/contexts/TranslationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Shield, Eye, EyeOff, Users, Upload } from 'lucide-react';
import type { User, UserRole, CreateUserData, UserFormValues } from '@/types';
import { ROLE_DESCRIPTIONS } from '@/lib/permissions';
import { ROLES, getRoleDisplayName, getAllRoles } from '@/lib/roles';

// Use lowercase roles for storage, transform for display
const roleValues = ['admin', 'manager', 'technician', 'employee', 'viewer'] as const;

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(roleValues),
})

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6).optional().or(z.literal('')),
  role: z.enum(roleValues),
  isActive: z.boolean(),
  isTeamMember: z.boolean(),
  teamTitle: z.string().optional(),
  teamBio: z.string().optional(),
})

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

interface UserManagerProps {
  currentUser: User;
}

export function UserManager({ currentUser }: UserManagerProps) {
  // Translation helper component
  const T = ({ text }: { text: string }) => { const { translated } = useTranslate(text); return <>{translated}</>; };
  
  // Translation hooks for dynamic content
  const { translated: userManagementText } = useTranslate('User Management');
  const { translated: manageSystemUsersText } = useTranslate('Manage system users and their roles');
  const { translated: addUserText } = useTranslate('Add User');
  const { translated: createNewUserText } = useTranslate('Create New User');
  const { translated: createUserDescText } = useTranslate('Add a new user to the system with appropriate role and permissions.');
  const { translated: nameText } = useTranslate('Name');
  const { translated: usernameText } = useTranslate('Username');
  const { translated: passwordText } = useTranslate('Password');
  const { translated: roleText } = useTranslate('Role');
  const { translated: cancelText } = useTranslate('Cancel');
  const { translated: createUserBtnText } = useTranslate('Create User');
  const { translated: activeText } = useTranslate('Active');
  const { translated: inactiveText } = useTranslate('Inactive');
  const { translated: teamMemberText } = useTranslate('Team Member');
  const { translated: addToTeamText } = useTranslate('Add to Team');
  const { translated: removeFromTeamText } = useTranslate('Remove from Team');
  const { translated: coverPhotoText } = useTranslate('Cover Photo');
  const { translated: uploadingText } = useTranslate('Uploading...');
  const { translated: editText } = useTranslate('Edit');
  const { translated: deleteText } = useTranslate('Delete');
  const { translated: editUserText } = useTranslate('Edit User');
  const { translated: updateUserInfoText } = useTranslate('Update user information and permissions.');
  const { translated: newPasswordText } = useTranslate('New Password (leave blank to keep current)');
  const { translated: activeStatusText } = useTranslate('Active Status');
  const { translated: inactiveUsersText } = useTranslate('Inactive users cannot log in to the system');
  const { translated: updateUserBtnText } = useTranslate('Update User');
  const { translated: loadingUsersText } = useTranslate('Loading users...');
  const { translated: enterFullNameText } = useTranslate('Enter full name');
  const { translated: enterUsernameText } = useTranslate('Enter username');
  const { translated: enterPasswordText } = useTranslate('Enter password');
  const { translated: selectRoleText } = useTranslate('Select a role');
  const { translated: enterNewPasswordText } = useTranslate('Enter new password');
  
  // Toast translations
  const { translated: errorText } = useTranslate('Error');
  const { translated: failedLoadUsersText } = useTranslate('Failed to load users. Please refresh the page.');
  const { translated: userCreatedText } = useTranslate('User created');
  const { translated: hasBeenAddedText } = useTranslate('has been added successfully.');
  const { translated: failedCreateUserText } = useTranslate('Failed to create user');
  const { translated: userUpdatedText } = useTranslate('User updated');
  const { translated: hasBeenUpdatedText } = useTranslate('has been updated successfully.');
  const { translated: failedUpdateUserText } = useTranslate('Failed to update user');
  const { translated: teamStatusUpdatedText } = useTranslate('Team member status updated');
  const { translated: addedToTeamText } = useTranslate('added to');
  const { translated: removedFromTeamText } = useTranslate('removed from');
  const { translated: teamText } = useTranslate('team');
  const { translated: failedUpdateTeamText } = useTranslate('Failed to update team member status');
  const { translated: coverPhotoUpdatedText } = useTranslate('Cover photo updated');
  const { translated: coverPhotoUploadedText } = useTranslate('Team cover photo has been uploaded successfully.');
  const { translated: failedUploadCoverText } = useTranslate('Failed to upload cover photo');
  const { translated: fileTooLargeText } = useTranslate('File too large');
  const { translated: selectSmallerImageText } = useTranslate('Please select an image smaller than 5MB.');
  const { translated: invalidFileTypeText } = useTranslate('Invalid file type');
  const { translated: selectImageFileText } = useTranslate('Please select an image file.');
  const { translated: cannotDeleteText } = useTranslate('Cannot delete');
  const { translated: cannotDeleteSelfText } = useTranslate('You cannot delete your own account.');
  const { translated: userDeletedText } = useTranslate('User deleted');
  const { translated: hasBeenRemovedText } = useTranslate('has been removed.');
  const { translated: failedDeleteUserText } = useTranslate('Failed to delete user');
  const { translated: confirmDeleteText } = useTranslate('Are you sure you want to delete');
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [uploadingCoverPhoto, setUploadingCoverPhoto] = useState<string | null>(null);
  const { toast } = useToast();

  const createForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      username: '',
      password: '',
      role: 'viewer',
    },
  });

  const updateForm = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
  });

  const loadUsers = async () => {
    try {
      console.log('Loading users...');
      const response = await fetch('/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });
      
      console.log('Users API response status:', response.status);
      
      if (response.ok) {
        const usersData = await response.json();
        console.log('Users loaded:', usersData);
        setUsers(usersData);
      } else {
        console.error('Failed to load users - Status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        variant: 'destructive',
        title: errorText,
        description: failedLoadUsersText,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const onCreateUser = async (data: CreateUserFormValues) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      const newUser = await response.json();
      setUsers(prev => [...prev, newUser]);
      setIsCreateDialogOpen(false);
      createForm.reset();
      
      toast({
        title: userCreatedText,
        description: `${newUser.name} ${hasBeenAddedText}`,
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        variant: 'destructive',
        title: errorText,
        description: error instanceof Error ? error.message : failedCreateUserText,
      });
    }
  };

  const onUpdateUser = async (data: UpdateUserFormValues) => {
    if (!editingUser) return;

    try {
      const updateData = { ...data, id: editingUser.id };
      if (!data.password) {
        delete updateData.password;
      }

      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      const updatedUser = await response.json();
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      setEditingUser(null);
      
      toast({
        title: userUpdatedText,
        description: `${updatedUser.name} ${hasBeenUpdatedText}`,
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        variant: 'destructive',
        title: errorText,
        description: error instanceof Error ? error.message : failedUpdateUserText,
      });
    }
  };

  const toggleTeamMember = async (user: User) => {
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          isTeamMember: !user.isTeamMember,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update team member status');
      }

      const updatedUser = await response.json();
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      
      toast({
        title: teamStatusUpdatedText,
        description: `${user.name} ${updatedUser.isTeamMember ? addedToTeamText : removedFromTeamText} ${teamText}.`,
      });
    } catch (error) {
      console.error('Error updating team member status:', error);
      toast({
        variant: 'destructive',
        title: errorText,
        description: failedUpdateTeamText,
      });
    }
  };

  const uploadCoverPhoto = async (file: File, userId: string) => {
    setUploadingCoverPhoto(userId);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'team-cover');
      formData.append('userId', userId);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload cover photo');
      }

      const { url } = await response.json();
      
      // Update user with new cover photo
      const updateResponse = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          teamCoverPhoto: url,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update user cover photo');
      }

      const updatedUser = await updateResponse.json();
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      
      toast({
        title: coverPhotoUpdatedText,
        description: coverPhotoUploadedText,
      });
    } catch (error) {
      console.error('Error uploading cover photo:', error);
      toast({
        variant: 'destructive',
        title: errorText,
        description: failedUploadCoverText,
      });
    } finally {
      setUploadingCoverPhoto(null);
    }
  };

  const handleCoverPhotoUpload = (event: React.ChangeEvent<HTMLInputElement>, userId: string) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: 'destructive',
          title: fileTooLargeText,
          description: selectSmallerImageText,
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: invalidFileTypeText,
          description: selectImageFileText,
        });
        return;
      }
      
      uploadCoverPhoto(file, userId);
    }
  };

  const onDeleteUser = async (user: User) => {
    if (user.id === currentUser.id) {
      toast({
        variant: 'destructive',
        title: cannotDeleteText,
        description: cannotDeleteSelfText,
      });
      return;
    }

    if (confirm(`${confirmDeleteText} ${user.name}?`)) {
      try {
        const response = await fetch(`/api/users?id=${user.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete user');
        }

        setUsers(prev => prev.filter(u => u.id !== user.id));
        
        toast({
          title: userDeletedText,
          description: `${user.name} ${hasBeenRemovedText}`,
        });
      } catch (error) {
        console.error('Error deleting user:', error);
        toast({
          variant: 'destructive',
          title: errorText,
          description: failedDeleteUserText,
        });
      }
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    updateForm.reset({
      name: user.name,
      username: user.username,
      password: '',
      role: user.role.toLowerCase() as typeof roleValues[number],
      isActive: user.isActive,
      isTeamMember: user.isTeamMember || false,
      teamTitle: user.teamTitle || '',
      teamBio: user.teamBio || '',
    });
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'Admin': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'Manager': return 'bg-primary/20 text-primary border-primary/30';
      case 'Technician': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Employee': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Viewer': return 'bg-muted/40 text-muted-foreground border-muted/60';
      default: return 'bg-muted/40 text-muted-foreground border-muted/60';
    }
  };

  if (isLoading) {
    return <div className="p-6">{loadingUsersText}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{userManagementText}</h1>
          <p className="text-gray-600">{manageSystemUsersText}</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {addUserText}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{createNewUserText}</DialogTitle>
              <DialogDescription>
                {createUserDescText}
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateUser)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{nameText}</FormLabel>
                      <FormControl>
                        <Input placeholder={enterFullNameText} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{usernameText}</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder={enterUsernameText} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{passwordText}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder={enterPasswordText} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{roleText}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={selectRoleText} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roleValues.map((role) => (
                            <SelectItem key={role} value={role}>
                              <div>
                                <div className="font-medium">{getRoleDisplayName(role)}</div>
                                <div className="text-sm text-gray-500">{ROLE_DESCRIPTIONS[role]}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    {cancelText}
                  </Button>
                  <Button type="submit">{createUserBtnText}</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.username}</p>
                  </div>
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {user.role}
                  </Badge>
                  <div className="flex items-center space-x-2">
                    {user.isActive ? (
                      <Eye className="w-4 h-4 text-green-500" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-500">
                      {user.isActive ? activeText : inactiveText}
                    </span>
                  </div>
                  {user.isTeamMember && (
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-blue-600">{teamMemberText}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant={user.isTeamMember ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTeamMember(user)}
                  >
                    <Users className="w-4 h-4 mr-1" />
                    {user.isTeamMember ? removeFromTeamText : addToTeamText}
                  </Button>
                  
                  {user.isTeamMember && (
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleCoverPhotoUpload(e, user.id)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploadingCoverPhoto === user.id}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={uploadingCoverPhoto === user.id}
                        className="pointer-events-none"
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        {uploadingCoverPhoto === user.id ? uploadingText : coverPhotoText}
                      </Button>
                    </div>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(user)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    {editText}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteUser(user)}
                    disabled={user.id === currentUser.id}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    {deleteText}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editUserText}</DialogTitle>
            <DialogDescription>
              {updateUserInfoText}
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <Form {...updateForm}>
              <form onSubmit={updateForm.handleSubmit(onUpdateUser)} className="space-y-4">
                <FormField
                  control={updateForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{nameText}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{usernameText}</FormLabel>
                      <FormControl>
                        <Input type="text" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{newPasswordText}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder={enterNewPasswordText} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{roleText}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roleValues.map((role) => (
                            <SelectItem key={role} value={role}>
                              <div>
                                <div className="font-medium">{getRoleDisplayName(role)}</div>
                                <div className="text-sm text-gray-500">{ROLE_DESCRIPTIONS[role]}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>{activeStatusText}</FormLabel>
                        <div className="text-sm text-gray-500">
                          {inactiveUsersText}
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                    {cancelText}
                  </Button>
                  <Button type="submit">{updateUserBtnText}</Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}