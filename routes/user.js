const express = require('express');
const router = express.Router();
const User = require('../models/users');
const Invitation = require('../models/invitation');
const Message = require('../models/messages');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');
const Conversation = require('../models/conversations');


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



router.post('/get/userById', async(req, res) => {
    const userId = req.body;
    try{
        const user = await User.findById(userId);
        res.json(user)
    }catch(err){
        res.status(500).json({error : err})
        console.log(err);
        
    }
})

router.post('/search', async (req, res) => {
    try {
        const { searchQuery } = req.body;

        const users = await User.find({
            userName: { $regex: searchQuery.split('').join('.*'), $options: 'i' }
        }).sort({ likes: -1 });

        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.post('/search/fromFriends', async (req, res) => {
    try {
        const { searchQuery, userId } = req.body;  
        const currentUser = await User.findById(userId).select('friends')

        if (!currentUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // البحث عن الأصدقاء الذين تتطابق أسماؤهم مع استعلام البحث
        
        const friends = await User.find({
            _id: { $in: currentUser.friends },  // البحث في الأصدقاء فقط
            userName: { $regex: searchQuery.split('').join('.*'), $options: 'i' }  // البحث في أسماء الأصدقاء
        })
        .sort({ likes: -1 }); 
      

        console.log(friends);
        res.json(friends);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/get/allFriends', async (req, res) => {
    const { userId } = req.body;
    
    try {
        // جلب المستخدم باستخدام معرفه وجلب تفاصيل الأصدقاء باستخدام populate
        const user = await User.findById(userId).select('friends');
        
        if (!user) {
            console.log('404');
            return res.status(404).json({ error: 'User not found' });
        }

        const friends = await User.find({
            _id: { $in: user.friends }, 
        })
        .sort({ likes: -1 }); 
        
        res.status(200).json(friends);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/addFriend', async (req, res) => {
    const { idSender, idReceiver } = req.body;

    // تحقق من صحة البيانات الواردة
    if (!idSender || !idReceiver) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // تحديث قائمة الأصدقاء للمستقبل
        const userReceiveInvitation = await User.findOneAndUpdate(
            { _id: idReceiver },
            { $push: { friends: idSender } },
            { new: true }
        );
        
        // تحديث قائمة الأصدقاء للمرسل
        const userSendInvitation = await User.findOneAndUpdate(
            { _id: idSender },
            { $push: { friends: idReceiver } },
            { new: true }
        );

        // تحقق من نجاح التحديثات
        if (userSendInvitation && userReceiveInvitation) {
            res.json({ userSendInvitation, userReceiveInvitation });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

router.get('/get/users', async(req,res) => {
    const users = await User.find()
    .sort({ likes: -1 });
    res.json(users)
})

router.post('/set/user', async(req,res) => {
    try{
        const user = new User(req.body);
        await user.save();
        res.json(user);
    }catch(err){
        res.status(500).json({error: err})
    }
})

router.post('/get/user', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email, password });
        if (!user) {
            return res.status(404).json({ message: 'User not found !' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/get/user/byId', async (req, res) => {
    const  {id}  = req.body;

    try {
        const user = await User.findOne( {_id: id} );
        if (!user) {
            return res.status(404).json({ message: 'User not found !' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/get/user/byName', async (req, res) => {
    const {name} = req.body;

    try {
        const user = await User.findOne({name});
        if (!user) {
            return res.status(404).json({ message: 'User not found !' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/update/user', async (req, res) => {
    const { userId, updatedData } = req.body;

    try {
        const user = await User.findOneAndUpdate({ email }, updatedData, { new: true });
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error });
    }
});

router.put('/update/userName', async(req, res) => {
    const { userId, newUserName } = req.body;
    
    if (!userId || !newUserName) {
        return res.status(400).json({ error: 'userId and newUserName are required' });
    }

    try {
        const userUpdated = await User.findByIdAndUpdate(userId, { userName: newUserName }, { new: true });
        res.json(userUpdated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/update/phoProfile', upload.single('image'), async(req, res) => {
    const {userId} = req.body;
    const imageFile = req.file;
    try{
            const result = await new Promise((resolve, reject) => {
              cloudinary.uploader.upload(imageFile.path, { folder: 'phoProfiles' }, (error, result) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(result);
                }
              });
            });
      
            imageUrl = result.secure_url;
            fs.unlinkSync(imageFile.path);

            const userUpdating = await User.findByIdAndUpdate(userId, {phoProfile: imageUrl})
            console.log(userUpdating);
            
            res.json(userUpdating)
    }catch(err){
        res.status(500).json(err)
    }
})

router.put('/update/phoCover', upload.single('image'), async(req, res) => {
    const {userId} = req.body;
    const imageFile = req.file;
    try{
            const result = await new Promise((resolve, reject) => {
              cloudinary.uploader.upload(imageFile.path, { folder: 'phoCovers' }, (error, result) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(result);
                }
              });
            });
      
            imageUrl = result.secure_url;
            fs.unlinkSync(imageFile.path);

            const userUpdating = await User.findByIdAndUpdate(userId, {phoCover: imageUrl})
            console.log(userUpdating);
            
            res.json(userUpdating)
    }catch(err){
        res.status(500).json(err)
    }
})

router.put('/update/discription', async(req, res) => {
    const { userId, newDiscription } = req.body;
    
    if (!userId || !newDiscription) {
        return res.status(400).json({ error: 'userId and newDiscription are required' });
    }

    try {
        const userUpdated = await User.findByIdAndUpdate(userId, { discription: newDiscription }, { new: true });
        res.json(userUpdated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/delete/friend', async(req, res) => {
    const {activeAccount_id, friendForDelete_id} = req.body;
    try {
        const updateUserFriends = await User.updateOne(
            { _id: activeAccount_id },
            { $pull: { friends: friendForDelete_id } }
        );
        const updateFromTheFriends = await User.updateOne(
            { _id: friendForDelete_id },
            { $pull: { friends: activeAccount_id } }
        );

        const removeInvitation = await Invitation.deleteOne({
            $or: [
                { sender: activeAccount_id, receiver: friendForDelete_id },
                { sender: friendForDelete_id, receiver: activeAccount_id }
            ]
        });

        res.status(201).json({ 
            message: 'Friend deleted and invitation removed if existed', 
            updateUserFriends, 
            removeInvitation 
        });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting friend or invitation', error: err });
    }
});

router.put('/add/like', async (req, res) => {
    const { like_from, like_to } = req.body;
    try {
        // العثور على المستخدم والتحقق مما إذا كان الإعجاب موجودًا بالفعل
        const user = await User.findById(like_to);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // تحقق مما إذا كان الإعجاب موجودًا بالفعل
        const alreadyLiked = user.likes.includes(like_from);

        let updatedUser;
        if (alreadyLiked) {
            // إذا كان الإعجاب موجودًا، قم بإزالته
            updatedUser = await User.findByIdAndUpdate(
                like_to,
                { $pull: { likes: like_from } }, // حذف الإعجاب
                { new: true }
            );
        } else {
            // إذا لم يكن الإعجاب موجودًا، قم بإضافته
            updatedUser = await User.findByIdAndUpdate(
                like_to,
                { $push: { likes: like_from } }, // إضافة الإعجاب
                { new: true }
            );
        }

        res.status(200).json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/get/isLiked', async(req, res) => {
    const {like_from, like_to} = req.body;
    try{
        const userLiked = await User.findById(like_to);
        if(userLiked.likes.includes(like_from)){
            res.send(true)
        }else{
            res.send(false)
        }
    }catch(err){
        res.status(500).json({error : err})
    }
})

// نقطة النهاية لجلب 5 أصدقاء مرتبين حسب عدد الإعجابات الخاصة بهم
router.post('/get/popularestFriends', async (req, res) => {
    const { userId } = req.body;

    try {
        // جلب بيانات المستخدم مع الأصدقاء
        const user = await User.findById(userId).populate({
            path: 'friends',
            model: 'User' // تأكد من أن الإشارة الصحيحة هي إلى `User`
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // ترتيب الأصدقاء حسب عدد الإعجابات الخاصة بهم
        const sortedFriends = user.friends
            .sort((a, b) => b.likes.length - a.likes.length) // ترتيب تنازلي حسب عدد الإعجابات
            .slice(0, 8); // جلب أول 5 أصدقاء

        res.status(200).json(sortedFriends);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/update/password', async(req, res) => {
    const {userId, newPassword} = req.body;
    try{
        const userUpdated = await User.findByIdAndUpdate(userId, { password: newPassword }, { new: true });
        res.json(userUpdated);
    }catch(err){
        res.status(500).json({error: err});
    }
})

router.delete('/delete/user', async(req, res) => {
    const {userId} = req.body;
    try{
        User.findById(userId);
    }catch(err){
        res.status(500).json({error: err});
    }
})

module.exports = router;


