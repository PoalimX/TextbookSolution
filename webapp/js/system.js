var BankApp = window.BankApp || {};
BankApp.map = BankApp.map || {};

var authToken;

// on login and on refreshing page, need the TOKEN ready to do actions.
function loadLoginInfo() {
    BankApp.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
            $('.authToken').text(token);
            ensureUserExists(); // in background, ensure the user acct exists in the neo4j db.
        } else {
            window.location.href = '/index.html';
        }
    }).catch(function handleTokenError(error) {
        alert("error in auth " + error);
        window.location.href = '/index.html';
    });
}

// show user's current balance in account
function getBalance() {
    console.log("getting balance with token " + authToken);
    $.ajax({
        method: 'POST',
        url: _config.api.invokeUrl + "/getaccountbalance",
        headers: {
            Authorization: authToken
        },
        contentType: 'application/json',
        success: successGetBalance,
        error: function ajaxError(jqXHR, textStatus, errorThrown) {
            console.error('Error requesting balance: ', textStatus, ', Details: ', errorThrown);
            console.error('Response: ', jqXHR.responseText);
            alert('error getting balance ' + jqXHR.responseText);
        }
    });
}

// show result after JSON returns
function successGetBalance(result) {
    console.log("getting balance event finished. result: ")
    console.log(result);
    alert("Your balance is " + result.CurrentBalance);
}

// ensure an account exists
function ensureUserExists() {
    console.log("ensuring user exists with token " + authToken);
    $.ajax({
        method: 'POST',
        url: _config.api.invokeUrl + "/ensureuserexists",
        headers: {
            Authorization: authToken
        },
        contentType: 'application/json',
        success: successEnsureUserExists,
        error: function ajaxError(jqXHR, textStatus, errorThrown) {
            console.error('Error ensuring user exists: ', textStatus, ', Details: ', errorThrown);
            console.error('Response: ', jqXHR.responseText);
            alert('error ensuring user exists ' + jqXHR.responseText);
        }
    });
}

// show result after JSON returns
function successEnsureUserExists(result) {
    console.log("ensure user exists finished. result: ")
    console.log(result);
}

// handle auth if in system - useful when refreshing page to reload token.
if ((window.location.href.indexOf("bank-system-logged-in") > -1)) {
    console.log("logged in screen, loading auth creds");
    loadLoginInfo();

}

async function transferMoney() {
    let $message = document.getElementById('transfer-money-message');
    $message.style.display = 'block';
    $message.innerText = 'Loading...';
    let valid = setErrors('transfer-money');
    if (valid) {
        let data = {
            username: document.querySelector('#transfer-email').value,
            sum: document.querySelector('#transfer-sum').value
        };
        try {
            let response = await fetch(url = `${_config.api.invokeUrl}/transfermoney`, {
                method: 'POST',
                headers: {
                    Authorization: authToken,
                    "Content-Type": 'application/json'
                },
                body: JSON.stringify(data)
            });
            let json = await response.json();
            if (json) {
                $message.innerText = json.message;
            }
        }
        catch (e) {
            $message.innerText = e.message;
        }
    }
}

async function getAllUsers() {
    try {
        let response = await fetch(`${_config.api.invokeUrl}/getallusers`, {
            method: 'POST',
            headers: {
                Authorization: authToken
            }
        });
        let json = await response.json();
        console.log('json getAllUsers', json);
    }
    catch (e) {
        alert(e.message);
    }
}

function setErrors(sectionId) {
    let valid = true;
    let elements = document.querySelectorAll(`#${sectionId} input`);
    elements.forEach(element => {
        let name = element.getAttribute('name');
        if (element.hasAttribute('required')) {
            let errorElm = document.querySelector(`#${name}-required`);
            if (element.value) {
                errorElm.classList.remove('show');
            }
            else {
                errorElm.classList.add('show');
                valid = false;
            }
        }
    });
    return valid;
}