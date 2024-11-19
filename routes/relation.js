const express = require('express');
const router = express.Router();
const Relation = require('./models/Relation');
const User = require('./models/users');
const Block = require('./models/block');

router.post('/add/relation', async (req, res) => {
    const { userId, friendId } = req.body;
    try {
        // تحقق مما إذا كانت العلاقة موجودة بالفعل
        const existingRelation = await Relation.findOne({
            user: userId,
            friend: friendId
        });

        if (!existingRelation) {
            // إذا لم تكن العلاقة موجودة، قم بإنشائها
            const newRelation = new Relation({
                 user: userId,
                 friend: friendId,
            });

            await newRelation.save();
            //console.log(newRelation);
            return res.status(201).json(newRelation);
        }
            return res.status(201).json(existingRelation);
        

    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
        console.log(error);
        
    }
});

router.post('/get/relation', async (req, res) => {
    const { userId, friendId } = req.body;

    // التحقق من وجود userId و friendId في الطلب
    if (!userId || !friendId) {
        return res.status(400).json({ error: 'Both userId and friendId are required' });
    }

    try {
        const relation = await Relation.findOne({ 
            user: { $in: [ userId, friendId ]},
            friend: { $in: [ userId, friendId ]}
        });

        // إذا لم يتم العثور على علاقة، قم بإرجاع حالة 404
        if (!relation) {
            return res.status(404).json({ message: 'Relation not found' });
        }

         if(relation.condition == 'block'){
            const blockData = await Block.findOne({
                blocker: { $in: [ userId, friendId ]},
                blocked: { $in: [ userId, friendId ]}
            })

            console.log(blockData);
            
            
            res.status(200).json({relation, blockData});
         }else{
            res.status(200).json({relation});
         }
    } catch (err) {
        console.error('Error fetching relation:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/blockFiend', async(req, res) => {
    const {blockerId, blockedId} = req.body;
    
    try{

        console.log(blockerId, blockedId)

        const block = new Block({
            blocker: blockerId,
            blocked: blockedId
        });

        await block.save();

        console.log(block);
        
        if(block){
            const relation = await Relation.findOneAndUpdate({ 
                user: { $in: [ blockerId, blockedId ]},
                friend: { $in: [ blockerId, blockedId ]}
            }, {condition: 'block'}, { new: true })
    
            
            res.status(200).json(relation)
        }
      
    }catch(err){
        console.log(err)
        res.status(500).json({error: err})
    }
})




module.exports = router;
