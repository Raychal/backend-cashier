import user from '../models/user.js';
import { faker } from '@faker-js/faker'

const run = async (limit) => {
    try {
        var data = []
        for (var i = 0; i < limit; i++){
            data.push({
                fullname: faker.name.fullName(),
                email: faker.internet.email(), 
                password: faker.internet.password(), 
            })
        }
        
        const fakeUser = await user.insertMany(data)
        
        if (fakeUser) {
            console.log(fakeUser)
            console.log('Total data : ' + fakeUser.length)
            process.exit()
        }
    } catch (err) {
        console.log(err)
        process.exit()
    }
    
}

export { run }