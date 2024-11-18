const express = require('express')
const router = express.Router();
const Invitation = require('../models/invitation');
const User = require('../models/users');
const Relation = require('../models/Relation');


router.put('/accept/invitation', async (req, res) => {
    const { senderId, receiverId } = req.body;

    try {
        // العثور على الدعوة بناءً على المرسل والمستقبل
        const existingInvitation = await Invitation.findOne({
            sender: senderId,
            receiver: receiverId,
            condition: 'pending'
        });

        if (!existingInvitation) {
            return res.status(404).json({ message: 'Invitation not found or already processed' });
        }

        // تحديث حالة الدعوة إلى "accepted"
        existingInvitation.condition = 'accepted';
        await existingInvitation.save();

        const relation = await Relation.findOneAndUpdate({ 
            user: { $in: [ senderId, receiverId ]},
            friend: { $in: [ senderId, receiverId ]}
        }, {condition: 'friend'}, { new: true })

       // console.log(relation);
        // إضافة معرف كل مستخدم إلى قائمة الأصدقاء لدى الآخر
        await User.findByIdAndUpdate(senderId, {
            $addToSet: { friends: receiverId }
        });

        await User.findByIdAndUpdate(receiverId, {
            $addToSet: { friends: senderId }
        });

        return res.status(200).json({ message: 'Invitation accepted successfully' });
    } catch (error) {
        console.error('Error accepting invitation:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/reject/invitation', async (req, res) => {
    const { senderId, receiverId } = req.body;

    try {
        const existingInvitation = await Invitation.findOne({
            sender: senderId,
            receiver: receiverId
        });

        if (!existingInvitation) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        await Invitation.updateOne(
            { _id: existingInvitation._id },
            { condition: 'rejected' }
        );

        return res.status(200).json({message : 'the invitation has been rejected successfuly !'});
    } catch (error) {
        console.error('Error rejecting invitation:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/add/invitation', async (req, res) => {
    const { senderId, receiverId } = req.body;

    try {
        // التحقق من وجود العلاقة بين المستخدمين
        let relation = await Relation.findOne({
            user: { $in: [senderId, receiverId] },
            friend: { $in: [senderId, receiverId] }
        });

        // إذا لم تكن هناك علاقة، يجب إنشاؤها بحالة 'not friend'
        if (!relation) {
            relation = new Relation({
                user: senderId,
                friend: receiverId,
                condition: 'not friend'
            });
            await relation.save();
        }

        // تحقق مما إذا كانت الدعوة موجودة بالفعل
        const existingInvitation = await Invitation.findOne({
            sender: { $in: [senderId, receiverId] },
            receiver: { $in: [senderId, receiverId] }
        });

        // إذا كانت الدعوة موجودة بالفعل
        if (existingInvitation) {
            // إذا كانت حالة العلاقة 'pending'، سيتم حذف الدعوة وتغيير الحالة إلى 'not friend'
            if (relation.condition === 'pending') {
                await Invitation.deleteOne({ _id: existingInvitation._id });
                relation.condition = 'not friend';
                await relation.save();
                return res.status(200).json(relation);

            } else {
                // في أي حالة أخرى، سيتم فقط حذف الدعوة دون تغيير الحالة
                await Invitation.deleteOne({ _id: existingInvitation._id });
                return res.status(200).json({ message: 'Invitation removed successfully', relation });
            }
        } else {
            // إذا لم تكن الدعوة موجودة، سيتم إنشاء دعوة جديدة
            if (relation.condition === 'block') {
                //return res.status(403).json({ error: 'Cannot send invitation due to a block', relation });
                relation.condition = 'friend';
                await relation.save();
                
                await User.findByIdAndUpdate(senderId, {
                    $addToSet: { friends: receiverId }
                });
        
                await User.findByIdAndUpdate(receiverId, {
                    $addToSet: { friends: senderId }
                });

                return res.status(201).json(relation);
            }

            const newInvitation = new Invitation({
                sender: senderId,
                receiver: receiverId
            });
            await newInvitation.save();

            // إذا كانت حالة العلاقة 'not friend'، سيتم تغييرها إلى 'pending'
            if (relation.condition === 'not friend') {
                relation.condition = 'pending';
                await relation.save();
            }

            return res.status(201).json(relation);
        }
    } catch (error) {
        console.log(error)
        console.error('Error handling invitation:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.post('/get/invitation', async (req, res) => {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) {
        return res.status(400).json({ error: 'senderId and receiverId are required' });
    }

    try {
        const invitation = await Invitation.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ]
        });

        if (!invitation) {
            return res.status(404).json({ error: 'Invitation not found' });
        }

        res.status(200).json(invitation);
    } catch (error) {
        console.error('Error fetching invitation:', error);
        res.status(500).json({ error: 'Failed to fetch invitation', details: error.message });
    }
});

router.post('/get/invitations/bySender', async (req, res) => {
    const { userInvitationsSend } = req.body;

    if (!userInvitationsSend) {
        return res.status(400).json({ error: 'userInvitationsSend is required' });
    }

    try {
        const invitations = await Invitation.find({
            sender: userInvitationsSend
        });
        res.status(200).json(invitations); 
    } catch (error) {
        console.error('Error fetching invitations:', error);  
        res.status(500).json({ error: 'Failed to fetch invitations', details: error.message });  // تضمين رسالة الخطأ
    }
});

router.post('/get/invitations/byReceiver', async (req, res) => {
    const { userInvitationsReceiver } = req.body;

    if (!userInvitationsReceiver) {
        return res.status(400).json({ error: 'userInvitationsReceiver is required' });
    }

    try {
        const invitations = await Invitation.find({
            receiver: userInvitationsReceiver
        });
        res.status(200).json(invitations); 
    } catch (error) {
        console.error('Error fetching invitations:', error);  
        res.status(500).json({ error: 'Failed to fetch invitations', details: error.message });  // تضمين رسالة الخطأ
    }
});




module.exports = router;