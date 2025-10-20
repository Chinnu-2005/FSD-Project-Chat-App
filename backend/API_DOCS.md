# Chat Application API Documentation

## Authentication Endpoints

### POST /api/auth/register
Register a new user
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### POST /api/auth/login
Login user
```json
{
  "username": "john_doe",
  "password": "password123"
}
```

### POST /api/auth/logout
Logout user (requires authentication)

### POST /api/auth/refresh-token
Refresh access token

## User Endpoints

### GET /api/users/profile
Get current user profile

### PATCH /api/users/profile
Update user profile
```json
{
  "bio": "Updated bio",
  "avatar": "avatar_url"
}
```

### GET /api/users/connections
Get user connections

### GET /api/users/search?query=username
Search users

### POST /api/users/connect/:userId
Send connection request

### POST /api/users/accept/:userId
Accept connection request

### POST /api/users/decline/:userId
Decline connection request

## Chat Endpoints

### GET /api/chats
Get all user chats

### GET /api/chats/:userId
Create or get private chat with user

### GET /api/chats/:chatId/messages
Get chat messages

### POST /api/chats/:chatId/messages
Send message
```json
{
  "content": "Hello!",
  "messageType": "text",
  "fileUrl": "optional_file_url"
}
```

### PATCH /api/chats/:chatId/read
Mark messages as read

## Group Endpoints

### GET /api/groups
Get user groups

### POST /api/groups
Create group
```json
{
  "groupName": "Study Group",
  "description": "AI Learning Group",
  "groupImage": "image_url",
  "memberIds": ["userId1", "userId2"]
}
```

### GET /api/groups/:groupId
Get group details

### GET /api/groups/:groupId/messages
Get group messages

### POST /api/groups/:groupId/messages
Send group message

### POST /api/groups/:groupId/add-member
Add member to group

### POST /api/groups/:groupId/remove-member
Remove member from group

### POST /api/groups/:groupId/promote
Promote member to admin

### POST /api/groups/:groupId/leave
Leave group

## Upload Endpoints

### POST /api/upload/file
Upload file (multipart/form-data)

## Socket Events

### Client to Server
- `send_private_message`: Send private message
- `send_group_message`: Send group message
- `typing_start`: Start typing indicator
- `typing_stop`: Stop typing indicator
- `join_room`: Join chat room
- `leave_room`: Leave chat room
- `mark_messages_read`: Mark messages as read

### Server to Client
- `new_private_message`: New private message received
- `new_group_message`: New group message received
- `user_online`: User came online
- `user_offline`: User went offline
- `user_typing_private`: User typing in private chat
- `user_typing_group`: User typing in group chat
- `user_stopped_typing_private`: User stopped typing in private chat
- `user_stopped_typing_group`: User stopped typing in group chat
- `messages_read_private`: Messages read in private chat
- `messages_read_group`: Messages read in group chat
- `message_sent`: Message sent confirmation
- `error`: Error occurred