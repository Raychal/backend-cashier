import user from '../models/User.js';
import bcrypt from 'bcrypt';
import jsonwebtoken from 'jsonwebtoken';
import dotenv from 'dotenv';
import { isEmailExist } from '../libraries/isEmailExist.js';
import User from '../models/User.js';
import e from 'express';
const env = dotenv.config().parsed;

const generateAccessToken = async (payload) => {
    return jsonwebtoken.sign(
        payload,
        env.JWT_ACCESS_TOKEN_SECRET,
        { expiresIn: env.JWT_ACCESS_TOKEN_LIFE },
    );
}

const generateRefreshToken = async (payload) => {
    return jsonwebtoken.sign(
        payload,
        env.JWT_REFRESH_TOKEN_SECRET,
        { expiresIn: env.JWT_REFRESH_TOKEN_LIFE },
    );
}

const checkEmail = async (req, res) => {
    try {
        const email = await isEmailExist(req.body.email);
        if (email) { throw { code: 409, message: "EMAIL_EXIST" } }

        res.status(200).json({
            status: true,
            message: "EMAIL_NOT_EXIST"
        });
    } catch (err) {
        res.status(err.code).json({
            status: false,
            message: err.message
        });
    }
}

const register = async (req, res) => {
    try {

        if (!req.body.fullname) { throw { code: 428, message: "Fullname is required" } }
        if (!req.body.email) { throw { code: 428, message: "Email is required" } }
        if (!req.body.password) { throw { code: 428, message: "Password is required" } }

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

const login = async (req, res) => {
    try {

        if (!req.body.email) { throw { code: 428, message: "Email is required" } }
        if (!req.body.password) { throw { code: 428, message: "Password is required" } }

        const User = await user.findOne({ email: req.body.email });
        if(!User) { throw { code: 403, message: "EMAIL_NOT_FOUND" } }
        
        const isMatch = await bcrypt.compareSync(req.body.password, User.password);
        if(!isMatch) { throw { code: 403, message: "WRONG_PASSWORD" } }

        // generate token
        const payload = { id: User._id, role: User.role }
        const accessToken = await generateAccessToken(payload)
        const refreshToken = await generateRefreshToken(payload)
        
        return res.status(200).json({
            status: true,
            message: "LOGIN_SUCCESS",
            fullname: User.fullname,
            accessToken,
            refreshToken
        });

    } catch (err) {
        if(!err.code) { err.code = 500 }
        return res.status(err.code).json({
            status: false,
            message: err.message
        });
    }
}

const refreshToken = async (req, res) => {
    try {

        if (!req.body.refreshToken) { throw { code: 428, message: "REFRESH_TOKEN_EXPIRED" } }

        // verify token
        const verify = await jsonwebtoken.verify(req.body.refreshToken, env.JWT_REFRESH_TOKEN_SECRET);

        const payload = { id: verify._id, role: verify.role }
        const accessToken = await generateAccessToken(payload)
        const refreshToken = await generateRefreshToken(payload)
        
        return res.status(200).json({
            status: true,
            message: "REFRESH_TOKEN_SUCCESS",
            accessToken,
            refreshToken
        });

    } catch (err) {
        if (err.message == 'jwt expired') {
            err.message =  'REFRESH_TOKEN_EXPIRED'
        } else {
            err.message = 'REFRESH_TOKEN_INVALID'
        }
        return res.status(err.code).json({
            status: false,
            message: err.message
        });
    }
}

export { register, login, refreshToken, checkEmail }