# File Upload Setup Guide

## 🎯 **What's Now Available**

Your chat app now has **complete file upload functionality** for avatars and media!

## 📁 **New API Endpoints**

### 1. Upload Avatar
```
POST http://localhost:3000/api/upload/avatar
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

Form Data:
- avatar: (file) - Image file (JPEG, PNG, GIF, WebP)
- Max size: 5MB
```

### 2. Upload Media (Messages)
```
POST http://localhost:3000/api/upload/media
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

Form Data:
- media: (file) - Any media file
- type: "message" - Type of upload
- Max size: 50MB
```

### 3. Remove Avatar
```
DELETE http://localhost:3000/api/upload/avatar
Authorization: Bearer YOUR_TOKEN
```

## 🗂️ **File Storage Structure**

```
public/
├── uploads/
│   ├── avatars/
│   │   ├── avatar_1_1703123456789.jpg
│   │   └── avatar_2_1703123456790.png
│   └── messages/
│       ├── message_1_1703123456789_video.mp4
│       └── message_2_1703123456790_document.pdf
```

## 🔧 **Environment Variables Needed**

Create a `.env.local` file with:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/chat_app_db"

# JWT Secret (generate a strong secret key)
JWT_SECRET="your-super-secret-jwt-key-here"

# App URL (for invite links)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 🚀 **How to Test Avatar Upload in Postman**

1. **Set up the request:**
   - Method: `POST`
   - URL: `http://localhost:3000/api/upload/avatar`
   - Headers: `Authorization: Bearer YOUR_TOKEN`

2. **Set up the body:**
   - Select `form-data`
   - Key: `avatar` (set type to File)
   - Value: Select an image file from your computer

3. **Send the request**
   - You'll get back the avatar URL
   - The file will be saved to `public/uploads/avatars/`

## 📱 **Frontend Integration Example**

```javascript
// Upload avatar
const uploadAvatar = async (file, token) => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  const response = await fetch('http://localhost:3000/api/upload/avatar', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  const result = await response.json();
  return result.avatarUrl; // Use this URL in your app
};

// Send message with media
const sendMessageWithMedia = async (file, conversationId, token) => {
  // First upload the media
  const formData = new FormData();
  formData.append('media', file);
  formData.append('type', 'message');
  
  const uploadResponse = await fetch('http://localhost:3000/api/upload/media', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  const uploadResult = await uploadResponse.json();
  
  // Then send the message with the media URL
  const messageResponse = await fetch(`http://localhost:3000/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: 'Check out this file!',
      media_url: uploadResult.mediaUrl,
      message_type: 'file'
    })
  });
  
  return messageResponse.json();
};
```

## 🔒 **Security Features**

- ✅ File type validation
- ✅ File size limits
- ✅ Authentication required
- ✅ Unique filename generation
- ✅ Organized file structure

## 🌐 **Production Considerations**

For production, consider:

1. **Cloud Storage**: Use AWS S3, Cloudinary, or similar
2. **CDN**: Serve files through a CDN
3. **Image Processing**: Resize/compress images
4. **Virus Scanning**: Scan uploaded files
5. **Rate Limiting**: Limit upload frequency

## 📋 **Supported File Types**

### Avatars:
- JPEG, JPG, PNG, GIF, WebP
- Max size: 5MB

### Messages:
- Images: JPEG, PNG, GIF, WebP
- Videos: MP4, WebM, OGG
- Audio: MP3, WAV, OGG
- Documents: PDF, TXT, DOC, DOCX
- Max size: 50MB

Your chat app is now **fully functional** with complete file upload capabilities! 🎉
