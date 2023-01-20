import user from '../models/User.js';
import bcrypt from 'bcrypt';
import { isEmailExist, isEmailExistWithUserId} from '../libraries/isEmailExist.js';

const index = async (req, res) => {
    try {

        let find = {
            fullname: { $regex: `^${req.query.search}`, $options: 'i' }
        }

        let options = {
            page: req.query.page || 1,
            limit: req.query.limit || 10,
        }

        const users = await user.paginate(find, options)

        if (!users) { throw { code: 404, message: "USER_NOT_FOUND" } }

        return res.status(200).json({
            status: true,
            total: users.length,
            users
        });

    } catch (err) {
        if (err.code) { err.code = 500 }
        return res.status(err.code).json({
            status: false,
            message: err.message
        });
    }
}

const store = async (req, res) => {
    try {

        if (!req.body.fullname) { throw { code: 428, message: "Fullname is required" } }
        if (!req.body.email) { throw { code: 428, message: "Email is required" } }
        if (!req.body.password) { throw { code: 428, message: "Password is required" } }
        if (!req.body.role) { throw { code: 428, message: "Role is required" } }

        if (req.body.password !== req.body.retype_password) {
            throw { code: 428, message: "PASSWORD_NOT_MATCH" }
        }

        const email = await isEmailExist(req.body.email);
        if (email) { throw { code: 409, message: "EMAIL_EXIST" } }

        // code 409 untuk status conflict

        let salt = await bcrypt.genSalt(10);
        let hash = await bcrypt.hash(req.body.password, salt);

        const newUser = new user({
            fullname: req.body.fullname,
            email: req.body.email,
            password: hash,
            role: req.body.role,
        });
        const User = await newUser.save();

        if(!User) {
            throw {
                code: 500,
                message: "USER_REGISTER_FAILED"
            }
        }

        return res.status(200).json({
            status: true,
            message: "USER_REGISTER_SUCCESS",
            User
        });

    } catch (err) {
        if(!err.code) { err.code = 500 }
        return res.status(err.code).json({
            status: false,
            message: err.message
        });
    }
}

const show = async (req, res) => {
    try {

        if (!req.params.id) { throw { code: 428, message: "ID is required" } }

        const User = await user.findById(req.params.id)

        if (!User) { throw { code: 404, message: "USER_NOT_FOUND" } }

        return res.status(200).json({
            status: true,
            user: User
        });

    } catch (err) {
        if (err.code) { err.code = 500 }
        return res.status(err.code).json({
            status: false,
            message: err.message
        });
    }
}

const update = async (req, res) => {
    try {
        if (!req.params.id) { throw { code: 428, message: "ID is required" } }
        if (!req.body.fullname) { throw { code: 428, message: "Fullname is required" } }
        if (!req.body.email) { throw { code: 428, message: "Email is required" } }
        if (!req.body.role) { throw { code: 428, message: "Role is required" } }

        if (req.body.password !== req.body.retype_password) {
            throw { code: 428, message: "PASSWORD_NOT_MATCH" }
        }

        const email = await isEmailExistWithUserId(req.params.id, req.body.email);
        if (email) { throw { code: 409, message: "EMAIL_EXIST" } }
        // code 409 untuk status conflict

        let fields = {}
        fields.fullname = req.body.fullname
        fields.email = req.body.email
        fields.role = req.body.role
        
        if (req.body.password) {
            let salt = await bcrypt.genSalt(10);
            let hash = await bcrypt.hash(req.body.password, salt);
            fields.password = hash
        }
        const User = await user.findByIdAndUpdate(req.params.id, fields, { new: true });

        if(!User) {
            throw {
                code: 500,
                message: "USER_UPDATE_FAILED"
            }
        }

        return res.status(200).json({
            status: true,
            message: "USER_UPDATE_SUCCESS",
            user: User
        });

    } catch (err) {
        if(!err.code) { err.code = 500 }
        return res.status(err.code).json({
            status: false,
            message: err.message
        });
    }
}

const destroy = async (req, res) => {
    try {

        if (!req.params.id) { throw { code: 428, message: "ID is required" } }
        
        const User = await user.findByIdAndDelete(req.params.id);

        if(!User) {
            throw {
                code: 500,
                message: "USER_DELETE_FAILED"
            }
        }

        return res.status(200).json({
            status: true,
            message: "USER_DELETE_SUCCESS",
            user: User
        });

    } catch (err) {
        if(!err.code) { err.code = 500 }
        return res.status(err.code).json({
            status: false,
            message: err.message
        });
    }
}

export { index, store, update, show, destroy }