const Account = require('../account');

describe("Account", function () {
    beforeAll(async function () {
        await Account.ensure_account_exists("TEST2-at-kashyoo.com");
    });

    it("return null when username does not exist", async function () {
        var balance = await Account.get_balance_for_user("nonexist");
        expect(balance).toEqual(null);
    });

    it("return 7000 for test user", async function () {
        var balance = await Account.get_balance_for_user("TEST2-at-kashyoo.com");
        expect(balance).toEqual(7000);
    });

    it('should return user exists', async () => {
        var user = await Account.userExists('TEST2-at-kashyoo.com');
        expect(user).toBeTruthy();
    });

    it('should return user doesn\'t exist', async () => {
        var user = await Account.userExists('TEST1-at-kashyoo.com');
        expect(user).toBeFalsy();
    });

    it('updates balance for user', async () => {
        var success = await Account.setBalanceByUser('TEST1-at-kashyoo.com', 1);
        var EventualBalance = await Account.get_balance_for_user('TEST1-at-kashyoo.com');
        expect(EventualBalance).toEqual(1);
        var success2 = await Account.setBalanceByUser('TEST1-at-kashyoo.com', 7000);
    });
});

