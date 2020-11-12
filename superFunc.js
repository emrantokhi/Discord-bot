const fs = require('fs');

exports.addSuper = function (superUsers, client) {
    let path = './superusers.txt';
    const fileWrite = fs.createWriteStream(path, {
        flags: 'a',
    })
    fileWrite.write(client + '\r\n');
    fileWrite.close();
};
