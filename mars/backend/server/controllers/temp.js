const bcrypt = require('bcryptjs'); bcrypt.hash('abcd1234', 10).then(h => console.log(h));
