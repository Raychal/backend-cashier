import dotenv from 'dotenv';
import mongoose from 'mongoose';

const env = dotenv.config().parsed;

const connection = async () => {
    mongoose.set('strictQuery', true);
    mongoose.connect(`${env.MONGODB_URI}${env.MONGODB_HOST}:${env.MONGODB_PORT}`, {
        dbName: env.MONGODB_DB_NAME,
    })
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connections error:'))
    db.once('open', function() {
        console.log('Connected to MongoDB')
    });
}

export { connection }
