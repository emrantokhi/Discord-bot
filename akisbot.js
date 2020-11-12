/*-----------------------------------------------------------------------------
|   Author: Emran Tokhi
|   Description: Intro Discord Bot Files 
|   Start Date: 1 October 2019
|   Note: This is really my first project working alone, spare me (:
-------------------------------------------------------------------------------*/


const cheerio = require('cheerio');
const request = require('request');
const Discord = require('discord.js');           //Dependency variables
const logger = require('winston');
const userFunc = require('./userFunc.js');
const superFunc = require('./superFunc.js');
const auth = require('./auth.json');     //File that contains bot token\
const youtube = require('youtube-search');
const isEmpty = require('is-empty');
const fs = require('fs');

var superUsers = [];
var owners = [];
loadSuperArray();
loadOwners(); 
var lengthOfOwner = owners.length;

const opts = {
    maxResults: "2",
    key: '*',
};

//Put the super user array in alphabetical order for quicker uses
//mergeSort(superUsers);

//Configuring the logger
logger.remove(new logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

//Initializing the bot 
var akisbot = new Discord.Client();   //Uses discord client from discord.js (more updated than discord.io)

akisbot.on('ready', function (evt) {     //displays this on the console
    logger.info('Connected');
});

akisbot.on('message', message => {
    if (message.content.substring(0, 1) == '~') {
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];
        
        args = args.splice(1);

        switch(cmd){
            
            case 'cmds':   //list of cmds
                message.channel.send("Start with a ~ and use one of these cmds:\n\
                    supers, userID, hot, yt (give name of vid after to find first search result),\
                     img (search term right after), claim (then @ someone and you can only claim one\
                      at a time.");
                
            break;

            case 'supers':
                var combine = '';
                for(var i = 0; i < superUsers.length - 1; i++){
                    combine += '<@' + superUsers[i].substring(0, superUsers[i].length - 1) + '>\n';
                }  
                message.channel.send(combine);                
            break;

            case 'img': //https://www.youtube.com/watch?v=5WXiZrgFEiE where i got it from
                var imgSearch = message.content.substring(5, message.content.length);
                image(imgSearch);
            break;

            case 'userID':
                message.channel.send('<@' + message.member.user.id + '> \'s id is ' + message.member.user.id);
            break;
           
            case 'hot':    //heads or tails
                message.channel.send(userFunc.hot());
            break;
           
            case 'yt':  //search youtube vid, only first video currently
                 var results;
                 var searchTerm = message.content.substring(4, message.content.length)
                 youtube(searchTerm, opts, function(err, results) {
                     if(err) return console.log(err);
                     message.channel.send(results[0].link);
                 });
            break;

            case 'claim': 
                 var owner = message.member.user.id;
                 var slave = message.content.split(' ');
                 if (slave[1].charAt(slave[1].length - 1) != '>') {  //if they type anything other than the @ for someone 
                    message.channel.send('You messed up while typing that.');
                    return;
                 }
                 slave = slave[1].substring(2, slave[1].length - 1);  
                 if (owner == slave) {  //if they try and claim themselves
                     message.channel.send('You can\'t claim yourself!');
                     return;
                 }
                 claimPerson(owner, slave);  //go to the method
            break; 

            case 'unclaim':
                var empty = isEmpty(owners);
                if(isEmpty(owners)){
                    message.channel.send('No one owns nothin\' round here!');
                    return;
                }
                var owner = message.member.user.id;
                var slave = message.content.split(' ');
                var length1 = owners.length;
                if (slave[1].charAt(slave[1].length - 1) != '>') {  //if they type anything other than the @ for someone 
                    message.channel.send('You messed up while typing that.');
                    return;
                }
                slave = slave[1].substring(2, slave[1].length - 1);
                unclaimSlave(owner, slave);
            break;

            case 'listClaimed':
                
            break;
            
            case 'addSuper':
                if(checkSuper(message.member.user.id)) {
                    if(message.content == '~addSuper') {
                        var client = message.member.user.id;
                        superFunc.addSuper(superUsers, client);
                        message.channel.send('<@' + client + '> is now a Super User.');
                        loadSuperArray();
                    } else {
                        var client = message.content.substring(12, message.content.length - 1);
                        superFunc.addSuper(superUsers, client);
                        message.channel.send('<@' + client + '> is now a Super User.');
                        loadSuperArray();
                    }
                } else {
                    message.channel.send('Sorry you\'re not a super user. You can\'t add anyone.');
                }
            break;

            case 'exit':   //turns off console
                if(checkSuper(message.member.user.id)){
                    process.exit();
                } else {
                    message.channel.send('You cannot use this command, underling.');
                }
            break;
        }
        
      }


    function image(imgSearch) {  //function staying in scope of this method to be able to use message.channel.send ------------------
        var options = {
            url: 'http://results.dogpile.com/serp?qc=images&q=' + imgSearch,
            method: 'GET',
            headers: {
                'Accept': 'text/html',
                'User-Agent': 'Chrome',
            }

        };

        request(options, function(error, response, responseBody) {
            if (error) {
                return;
            }

            $ = cheerio.load(responseBody);

            var links = $('.image a.link');

            var urls = new Array(links.length).fill(0).map((v, i) => links.eq(i).attr('href'));
            //console.log(urls);  if wanna display all the links in the console
            if (!urls.length) {
                return;
            }

            var randNum10 = (Math.floor(Math.random() * 10)) + 1;
            message.channel.send(urls[randNum10]);
        });
    }   //ENDS THIS FUNCTION ----------------------------------------------------------------------------

    function claimPerson(owner, slave) {  //START OF CLAIM FUNCTION ----------------------------------------------------
        var exists = false;

        for(var i = 0; i < owners.length; i++) {  //this loop checks if they are already a slave 2 someone
            slaves = [];
            ownerOfSlaves = owners[i].substring(0, 18);
            slaves = owners[i].substring(19, owners[i].length).split(' ');
            if(slaves.includes(slave)) {
                message.channel.send('<@' + slave + '> is already owned by <@' + ownerOfSlaves + '>');
                return;
            } else if(slaves.includes(owner) && slave == ownerOfSlaves) {  //if slave tries to claim their owner
                message.channel.send('Nice prank. You are <@' + slave + '> \'s slut already.');
                return;
            }
        }

        for(var i = 0; i < owners.length; i++) {    //this loop checks if the owner already has the slave and if not adds it
            if(owners[i].substring(0, 18) == owner) {
                exists = true;
                slaves = [];
                slaves = owners[i].substring(19, owners[i].length).split(' ');
                if(slaves.includes(slave)) {
                    message.channel.send('<@' + owner + '> already owns <@' + slave + '>');
                    return;
                } else {
                    owners[i] += ' ' + slave;
                    message.channel.send('<@' + slave + '> is now owned by <@' + owner + '> !');
                    writeOwners();
                }
                return;
            }
        }

        if(!exists){ //if the owner and slave combo does not exist add it to the array
            owners.push(owner + ' ' + slave);
            message.channel.send('<@' + slave + '> is now owned by <@' + owner + '> !');
            writeOwners();
        }
    } //END OF CLAIM FUNCTION -------------------------------------------------------------------------

    function unclaimSlave(owner, slave) {  //START OF UNCLAIM FUNCTION ------------------
        for (var t = 0; t < lengthOfOwner; t++) {
            var curOwner = owners[t].substring(0, 18);
            var slaves = [];
            slaves = owners[t].substring(19, owners[t].length).split(' ');
            if(curOwner == slave && slaves.includes(owner)) {  //if slave is trying to unclaim themselves from owner (might be xtra not rlly possible now that i think about it)
                message.channel.send('You lil rascal. You\'re not being set free that easily.'); 
                return;
            } else if (curOwner == owner && slaves.includes(slave)) {
                var index = slaves.indexOf(slave);
                slaves.splice(index, 1);
                owners[t] = curOwner + ' ' + slaves.join(' ');
                message.channel.send('I am proud of you. You let <@' + slave + '> go free, as must all mothers.');
                writeOwners();
                return;
            }
        }
        message.channel.send('You do not own <@' + slave + '>');
        return;
    }  //END OF UNCLAIM FUNCTION ------------------------------------------------------------
});

function loadSuperArray () {
    superUsers = fs.readFileSync('superusers.txt').toString().split('\n');
}

function checkSuper (userID) {
    return superUsers.includes(userID + '\r');
}

function loadOwners () {
    var stats = fs.statSync('./owners.txt')
    var fileSize = stats.size;
    if(fileSize == 0){  //added this bc it was writing out a \n into the array
        return;
    }
    owners = fs.readFileSync('./owners.txt').toString().split('\n');
    lengthOfOwner = owners.length;
}

function writeOwners() {
    let text = owners.join('\n');
    fs.writeFileSync('./owners.txt', text, "utf8");
}

akisbot.login(auth.token);


