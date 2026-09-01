# Implementation Plan: Post Edit & Real-time Post Synchronization

## Overview
Implement real-time post synchronization system:
1. **Post Edit Frontend** - Complete EditPost UI with edit form (✅ Already implemented)
2. **Apply/Save Button** - "Apply" button to submit edited post changes
3. **Real-time Sync** - All connected users see edited posts instantly via WebSocket (Socket.IO)
4. **Real-time Post Creation** - New posts appear instantly for all users (bonus)

---

## Feature 1: Post Edit Frontend & Real-time Synchronization

### Current Status ✅
- ✅ EditPost.jsx component created with full edit form (title, content, image)
- ✅ Dropdown menu with "..." button added to each post
- ✅ Edit/Delete options in dropdown
- ✅ Frontend routing to `/edit-post/:postId`

### Remaining Work: Real-time Sync
When user clicks "Apply Changes" button in EditPost:
1. POST request sent to `/posts/{postId}` (already working)
2. **NEW**: Backend emits Socket.IO event `postUpdated`
3. **NEW**: All connected users receive event and update post in their feed instantly
4. **NEW**: User redirected back to posts with success confirmation

---

## Feature 2: Real-time Post Creation Sync

### Current Status ✅
- ✅ CreatePostBox component created with form
- ✅ POST request to create new post working

### Remaining Work: Real-time Sync
When user creates a new post:
1. POST request sent to `/posts` (already working)
2. **NEW**: Backend emits Socket.IO event `newPost`
3. **NEW**: All connected users receive event and see new post instantly
4. **NEW**: Post appears at top of feed without page refresh

---

## Detailed Implementation Steps

### PHASE 1: Backend - Socket.IO Setup & Post Events (3-4 tasks)

1. **Install Socket.IO** (`backend`)
   - Install `socket.io` package
   - Initialize in server.js with CORS configuration
   - Set up connection handling

2. **Update Post Controller** (`backend/controllers/postController.js`)
   - In `createPost`: After saving new post → emit `newPost` event to all users
   - In `updatePost`: After updating post → emit `postUpdated` event to all users
   - In `deletePost`: After deleting post → emit `postDeleted` event to all users

3. **Update Server Socket.IO Setup** (`backend/server.js`)
   - Initialize Socket.IO with correct CORS settings
   - Set up namespaces for events
   - Add connection/disconnection handlers
   - Test socket connections

### PHASE 2: Frontend - Socket.IO Setup & Listeners (4-5 tasks)

1. **Install Socket.IO Client** (`frontend`)
   - Install `socket.io-client` package
   - Verify build succeeds

2. **Create Socket Service** (`frontend/src/api/socketClient.js`)
   - Initialize Socket.IO connection
   - Connect to backend WebSocket server
   - Export socket instance
   - Handle reconnection logic

3. **Update PostList Component** (`frontend/src/components/PostList.jsx`)
   - Import socket service
   - Listen for `newPost` event → add new post to top of feed
   - Listen for `postUpdated` event → update existing post in feed
   - Listen for `postDeleted` event → remove deleted post from feed
   - Clean up listeners on component unmount

4. **Update EditPost Component** (`frontend/src/components/EditPost.jsx`)
   - Button text: "Apply Changes" (or "Save Changes")
   - After successful PUT request: socket emits `postUpdated` event
   - Show success toast notification
   - Redirect to /posts page
   - All users see edited post instantly

5. **Update CreatePostBox Component** (`frontend/src/components/PostList.jsx`)
   - After successful POST request: socket emits `newPost` event
   - Show success notification
   - Clear form
   - All users see new post instantly at top of feed

### PHASE 3: Testing & Verification (2-3 tasks)

1. **Backend Testing**
   - Test POST `/posts` emits `newPost` event
   - Test PUT `/posts/{postId}` emits `postUpdated` event
   - Test DELETE `/posts/{postId}` emits `postDeleted` event
   - Verify socket connections are stable

2. **Frontend Testing**
   - Test socket connection establishes
   - Test receiving events from backend
   - Test multiple browser windows see real-time updates
   - Test offline/reconnection scenarios

3. **Build & Deploy**
   - Run frontend build
   - Verify no errors
   - Test in production-like environment

---

## Database Schema Changes

### Backend: No changes needed
- Post model already supports all required fields
- No schema migrations needed

---

## API Endpoints (Already Working)

### Existing Endpoints
- `POST /posts` - Create new post
  - Payload: `{ title, content, imageUrl }`
  - Response: `{ post: { ...postData } }`

- `PUT /posts/{postId}` - Update existing post
  - Payload: `{ title, content, imageUrl }`
  - Response: `{ post: { ...updatedPost } }`

- `DELETE /posts/{postId}` - Delete post
  - Response: `{ message: "Post deleted" }`

### Socket.IO Events (To Be Implemented)
#### Server → Client (Broadcast Events)
- `newPost` - Payload: `{ post: { _id, title, content, imageUrl, author, createdAt, ... } }`
- `postUpdated` - Payload: `{ post: { _id, title, content, imageUrl, author, updatedAt, ... } }`
- `postDeleted` - Payload: `{ postId: string }`

---

## Installation & Dependencies

### Backend
```bash
npm install socket.io
```

### Frontend
```bash
npm install socket.io-client
```

---

## Implementation Order

### PHASE 1: Backend Socket.IO Setup (3 tasks)
1. ⏳ Install Socket.IO in backend
2. ⏳ Initialize Socket.IO in server.js with CORS
3. ⏳ Update post controller to emit events (newPost, postUpdated, postDeleted)

### PHASE 2: Frontend Socket.IO Setup (5 tasks)
4. ⏳ Install socket.io-client in frontend
5. ⏳ Create socketClient.js service
6. ⏳ Update PostList.jsx with socket listeners for newPost, postUpdated, postDeleted
7. ⏳ Update EditPost.jsx to confirm save and redirect (socket event happens on backend)
8. ⏳ Verify frontend build succeeds

### PHASE 3: Testing & Verification (3 tasks)
9. ⏳ Test post creation sync (one browser creates post, other sees it instantly)
10. ⏳ Test post edit sync (one browser edits post, other sees changes instantly)
11. ⏳ Test post deletion sync (one browser deletes post, other sees it removed instantly)

---

## Testing Checklist

- [ ] New post appears in all connected users' feeds instantly
- [ ] Deleted post disappears instantly for all users
- [ ] Edited post updates instantly for all users
- [ ] Socket.IO reconnects on disconnect
- [ ] No console errors or warnings
- [ ] Multiple browser windows stay in sync
- [ ] Fallback: Manual refresh shows correct data if socket fails

---

## Notes & Considerations

- **Architecture**: EditPost.jsx is already complete. Just need real-time sync via Socket.IO.
- **Button Label**: "Apply Changes" or "Save Changes" in EditPost form
- **User Feedback**: Toast notification shows after save
- **Redirect**: After successful save, user redirected to /posts page
- **CORS**: Socket.IO needs proper CORS setup for frontend domain
- **Performance**: Socket.IO broadcasts to all connected clients instantly
- **Error Handling**: Implement error handling for failed saves
- **User Experience**: Loading spinner during save, clear feedback on success/failure

---

## Success Criteria

✅ When user creates a post → appears instantly in all browsers' feeds  
✅ When user edits a post → changes appear instantly in all browsers' feeds  
✅ When user deletes a post → disappears instantly from all browsers' feeds  
✅ Real-time sync works without page refresh  
✅ No errors in console  
✅ Build completes successfully  
✅ Can test with 2+ browser windows open

