const express = require('express');
const router = express.Router();
const Message = require('../models/messages');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');
const Conversation = require('../models/conversations')

//  Cloudinary
cloudinary.config({
  cloud_name: 'daduiowmw',
  api_key: '695571773737565',
  api_secret: 'CvslvXFbBHvfeHvnomwNTHC_yYY'
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.post('/add/message', upload.single('image'), async (req, res) => {
  const { conversationId, senderId, message } = req.body;
  const imageFile = req.file;

  try {
    let imageUrl = null;

    if (imageFile) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(imageFile.path, { folder: 'your-folder-name' }, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      });

      imageUrl = result.secure_url;
      fs.unlinkSync(imageFile.path);
    }

    const newMessage = new Message({
      conversationId,
      senderId,
      message,
      image: imageUrl,
      createdAt: new Date()
    });

    await newMessage.save();

    // تحديث حالة vue إلى false لجميع المستخدمين الآخرين في المحادثة
    await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $set: {
          'vue.$[element].hasViewed': false
        }
      },
      {
        arrayFilters: [{ 'element.userId': { $ne: senderId } }]
      }
    );

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Failed to send message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});


router.post('/get/messages', async (req, res) => {
  const { conversationId } = req.body;

  try {
    if (!conversationId) {
      return res.status(400).json({ message: 'Conversation ID is required' });
    }

    const messages = await Message.find({ conversationId: conversationId });

    if (messages.length === 0) {
      return res.status(404).json({ message: 'No messages found for this conversation' });
    }

    res.status(200).json(messages);
  } catch (err) {
    console.error('Failed to retrieve messages:', err);
    res.status(500).json({ message: 'Failed to retrieve messages', error: err.message });
  }
});

router.post('/get/message', async(req, res) => {
  const {conversationId} = req.body;
  try{
  
    const lastMessage = await Message.findOne({conversationId: conversationId})
    .sort({createdAt: -1})
    .limit(1);
  
    if (!lastMessage) {
      return res.status(404).json({ message: 'No messages found in this conversation' });
  }

  res.status(200).json(lastMessage);

  }catch(err){
    res.status(500).json({message: 'Failed to retrieve the last message', error: err.message })
  }
})


module.exports = router;
