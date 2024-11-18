const mongoose = require('mongoose');
const express = require('express'); // استيراد مكتبة express
const router = express.Router(); // الحصول على راوتر من مكتبة express
const Conversation = require('../models/conversations'); // استيراد نموذج المحادثة
const User = require('../models/users')
const Message = require('../models/messages');

// إنشاء نقطة نهاية POST لإنشاء محادثة جديدة
router.post('/add/conversation', async (req, res) => {
  const { userId1, userId2 } = req.body;

  try {
    // تحقق من وجود المحادثة بالفعل بين المستخدمين
    let conversation = await Conversation.findOne({ participants: { $all: [userId1, userId2] } });

    if (!conversation) {
      // إذا لم توجد محادثة، قم بإنشاء محادثة جديدة
      conversation = new Conversation({
        participants: [userId1, userId2], // إضافة معرفات المستخدمين كمشاركين
        vue: [
          { userId: userId1, hasViewed: false },
          { userId: userId2, hasViewed: false }
        ], // إعداد vue للمستخدمين
        createdAt: new Date() // تحديد تاريخ الإنشاء
      });

      await conversation.save(); // حفظ المحادثة في قاعدة البيانات
    }

    res.status(201).json(conversation); // إرسال استجابة بنجاح الإنشاء مع بيانات المحادثة
  } catch (error) {
    res.status(500).json({ error: 'Failed to create conversation' }); // إرسال استجابة في حالة الفشل
  }
});


router.post('/get/conversations', async (req, res) => {
  const { userId } = req.body;

  try {
    const conversations = await Conversation.find({ participants: { $in: [userId] } })
    .sort({createdAt: -1});
    
    if (!conversations || conversations.length === 0) {
      return res.status(404).json('No conversations found!');
    }
    
    res.status(200).json(conversations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get conversations!', details: err.message });
  }
});

router.put('/set/vue', async (req, res) => {
  const { conversationId, userId } = req.body;

  try {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found!' });
    }

    // تحقق من أن المستخدم جزء من المحادثة
    const userInConversation = conversation.participants.includes(userId);
    if (!userInConversation) {
      return res.status(404).json({ error: 'User not part of the conversation!' });
    }

    // تحقق من أن userId موجود في vue
    const userVue = conversation.vue.find(v => v.userId.toString() === userId);
    if (!userVue) {
      return res.status(404).json({ error: 'User not found in vue!' });
    }

    // تحديث حقل hasViewed إلى true
    userVue.hasViewed = true;
    await conversation.save();

    res.status(200).json({ message: 'Vue set successfully!', conversation });
  } catch (err) {
    res.status(500).json({ error: 'Failed to set vue!', details: err.message });
  }
});



router.post('/get/conversationCondition', async (req, res) => {
  const { conversationId, correspondantId } = req.body;

  try {
    // البحث عن المحادثة بواسطة المعرف وتعبئة المشاركين ومعلومات المستخدمين الذين شاهدوا المحادثة
    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'userName')
      .populate('vue.userId', 'userName');

    // التحقق من وجود المحادثة
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found!' });
    }

    // البحث عن الشرط الخاص بالمستخدم المحدد
    const userVueCondition = conversation.vue.find(v => {
      console.log(`Comparing ${v.userId._id.toString()} with ${correspondantId}`);
      return v.userId._id.toString() === correspondantId;
    });

    // إذا لم يتم العثور على userVueCondition
    if (!userVueCondition) {
      console.log('No matching vue condition found for correspondantId:', correspondantId);
      return res.status(404).json({ error: 'Vue condition not found for the specified correspondant!' });
    }

    // إعادة الشرط الذي تم العثور عليه
    res.status(200).json({ condition: userVueCondition });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve conversation condition!', details: err.message });
  }
});

router.post('/get/conversationsData', async (req, res) => {
  const { userId } = req.body;  // تأكد من أنك ترسل userId في الطلب
  
  try {
    // ابحث عن المحادثات التي يشارك فيها المستخدم
    const conversations = await Conversation.find({ participants: { $in: [userId] } });

    if (!conversations || conversations.length === 0) {
      console.log("No conversations found!");
      return res.status(404).json({ message: 'No conversations found!' });
    }

    const conversationsData = [];

    for (let i = 0; i < conversations.length; i++) {
      const conversation = conversations[i];
      let user;

      // ابحث عن المستخدم الآخر (المستخدم المقابل)
      for (let j = 0; j < conversation.participants.length; j++) {
        if (conversation.participants[j].toString() !== userId.toString()) {
          try {
            user = await User.findById(conversation.participants[j]);
            if (!user) {
              console.log("User not found!");
              continue;  // نواصل بدون الخروج من الحلقة
            }
          } catch (err) {
            console.log("Error finding correspondant user:", err);
            continue;  // نواصل بدون الخروج من الحلقة
          }
          break;
        }
      }

      if (!user) {
        console.log("Correspondant user not found!");
        continue;  // نواصل بدون الخروج من الحلقة
      }

      // ابحث عن آخر رسالة في المحادثة
      let lastMessage;
      try {
        lastMessage = await Message.findOne({ conversationId: conversation._id })
          .sort({ createdAt: -1 })  // ترتيب الرسائل حسب تاريخ الإنشاء
          .limit(1);

        if (!lastMessage) {
          console.log("No messages found in conversation");
          continue;  // نواصل بدون الخروج من الحلقة
        }
      } catch (err) {
        console.log("Error finding last message:", err);
        continue;  // نواصل بدون الخروج من الحلقة
      }

      const vueCondition = conversation.vue?.find(v => v.userId.toString() === user._id.toString());

      // دفع بيانات المحادثة والرسالة الأخيرة في القائمة
      conversationsData.push({
        conversation,
        user,
        lastMessage,
        vueCondition,
      });
    }

    // إذا لم تكن هناك محادثات صالحة
    if (conversationsData.length === 0) {
      console.log("No valid conversations data found");
      return res.status(404).json({ message: 'No valid conversations data found' });
    }

    // قم بترتيب المحادثات بناءً على تاريخ آخر رسالة
    conversationsData.sort((a, b) => {
      return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
    });

    console.log('Final sorted conversations data:', conversationsData);
    res.json(conversationsData);
  } catch (error) {
    console.log("Server error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});




// router.post('/get/conversations', async(req, res) => {
//   const {userId} = req.body;

//   try {
//     const conversation = await Conversation.findOne({ participants: { $in: [userId] } });
    
//     if (!conversation) {
//       return res.status(404).json('conversation not found!');
//     }
    
//     res.status(200).json(conversation);
//   } catch (err) {
//     res.status(500).json({ error: 'failed to get conversation!', details: err.message });
//   }
// });




module.exports = router; // تصدير الراوتر للاستخدام في ملفات أخرى
