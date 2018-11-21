const Handler = require('../handler');

describe("Handler", () => {

    beforeEach(() => {
        spyOn(Handler, 'getCognitoUser').and.returnValue('TEST2-at-kashyoo.com');
        spyOn(Handler, 'buildReturnJSON');
    });
    it ('user doesn\'t exist', async () => {
        var context = {
            body: {
                username: 'TEST1-at-kashyoo.com',
                sum: 1000
            }
        };
        await Handler.transfermoney({}, context);
        expect(Handler.buildReturnJSON).toHaveBeenCalledWith(203, `Transfer user ${transferUsername} doesn't exist`);
    });
})