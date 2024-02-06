const { ActivityHandler, MessageFactory, ActionTypes, CardFactory } = require('botbuilder');
const User = require('./database');
const https = require('https');

class CIBOT extends ActivityHandler {
    constructor() {
        super();
        var userName = '';
        var email = '';
        var chatHistory = [
            {
                question: 'question from user',
                answer: 'answer from chatbot',
            },
        ]
        var question = '';
        var answer = '';

        this.onMessage(async (context, next) => {

            if(userName === '') {
                userName = context.activity.text;
                await this.promptForEmail(context)
                await next();
            }
            else if(email === '') {
                email = context.activity.text;
                const newUser = new User({name : userName , email : email,  chatHistory : chatHistory});

                try {
                    await newUser.validate(); 
                    await newUser.save().then((result)=> console.log(`added to database ${result}`));
                } catch (error) {
                    if (error.errors && error.errors.email) {
                        await context.sendActivity(`Invalid email format: ${error.errors.email.message}`);
                        email = '';
                        await this.promptReEnterEmail(context)
                        await next();
                    }
                }

                if(email != '') {
                    const textMessage = `Hello ${userName}, I’m your friendly chatbot! How can I assist you today?`;
                    await context.sendActivity(textMessage);
                    await next();
                }
            } else {
                const userQuestion = context.activity.text.toLowerCase();

                const url = "https://3314-2401-4900-1c66-c3df-a4ca-c206-c5da-a227.ngrok-free.app/api/v1/prediction/1bf1fdca-50a0-4ca1-9301-d40ba5649aef";

                async function query(data) {
                    const options = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    };
                
                    return new Promise((resolve, reject) => {
                        const req = https.request(url, options, (res) => {
                            let data = '';
                
                            res.on('data', (chunk) => {
                                data += chunk;
                            });
                console.log(res);
                            res.on('end', () => {
                                resolve(JSON.parse(data));
                            });
                        });
                
                        req.on('error', (error) => {
                            reject(error);
                        });
                
                        req.write(JSON.stringify(data));
                        req.end();
                    });
                }
                let responseMsg = await query({"question": userQuestion}).then((response) => {
                    return response;
                });
                await context.sendActivity(MessageFactory.text(`CIBOT: ${responseMsg.text}`));
                answer = responseMsg.text;
                question = userQuestion;

                async  function updateDB() {
                    try{
                        const updateUser = User.findOne({email:email});
                        await updateUser.updateOne({$push:{chatHistory:{question:question,answer:answer}}})
                    } catch(err) {
                        console.log(err)
                    }
                }
                updateDB();

                const coursesAttachment = CardFactory.heroCard(
                'Support Ticket',
                'Looking For help?',
                    null,
                    [
                        { type: ActionTypes.OpenUrl, title: 'ASDC | Ticketing Tool', value: 'https://support.asdc.org.in/guest/openticket' },
                    ]
                );
                await context.sendActivity({ attachments: [coursesAttachment] });


            }
            await next();
        });
            
        this.onMembersAdded(async (context, next) => {
            
            if(userName === '') {
                await this.sendWelcomeMessage(context)
                await this.promptForName(context);
            } else {
                const textMessage = `Hello ${userName}, I’m your friendly chatbot! How can I assist you today?`;
                await context.sendActivity(textMessage);
            }
            await next();
        });
    }

    async sendWelcomeMessage(turnContext) {
        const {activity} = turnContext;
      
        for(const idx in activity.membersAdded) {
            if(activity.membersAdded[idx].id !== activity.recipient.id) {
        
                const welcomeMessage = "Welcome";
                const messagess = "Hello! I'm your friendly Intelligence bot.";
                await turnContext.sendActivity(welcomeMessage);
                await turnContext.sendActivity(messagess);
            
            }
        }
    }
    
    async promptForName(turnContext) {
        await turnContext.sendActivity("What's your name?");
    }

    async promptForEmail(turnContext) {
        await turnContext.sendActivity(`What's your email?`);
    }
    
    async promptReEnterEmail(turnContext) {
        await turnContext.sendActivity(`Please enter valid email.`);
    }
}
module.exports.CIBOT = CIBOT;
