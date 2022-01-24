const mongoose = require('mongoose')

const mongooseIdValidator = id => {
    return mongoose.Types.ObjectId.isValid(id)
}

module.exports = {
    validateIdByParams: (req, res, next) => {
        const user_id = req.params.user_id
        if(!mongooseIdValidator(user_id)) {
            return res.status(400).json({message: 'Invalid User Id'})
        }
        next()
    },
    validateIdByBody: (req, res, next) => {
        const {user_id} = req.body
        if(!mongooseIdValidator(user_id)) {
            return res.status(400).json({message: 'Invalid User Id'})
        }
        next()
    }
}