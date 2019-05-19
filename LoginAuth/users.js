var msalConfig = {
    auth: {
        clientId: "790fe7cd-275f-49f5-a2fe-65470e711565",
        authority: "https://login.microsoftonline.com/506e7f86-aa19-44de-b5e4-a31be4ed9305"
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: true
    }
};

var graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
};

// this can be used for login or token request, however in more complex situations
// this can have diverging options
var requestObj = {
    scopes: ["user.read"]
};

var myMSALObj = new Msal.UserAgentApplication(msalConfig);
// Register Callbacks for redirect flow
myMSALObj.handleRedirectCallback(authRedirectCallBack);


function signIn() {

    myMSALObj.loginPopup(requestObj).then(function (loginResponse) {
        //Login Success
        showWelcomeMessage();
        acquireTokenPopupAndCallMSGraph();
    }).catch(function (error) {
        console.log(error);
    });
}

function acquireTokenPopupAndCallMSGraph() {
    //Always start with acquireTokenSilent to obtain a token in the signed in user from cache
    myMSALObj.acquireTokenSilent(requestObj).then(function (tokenResponse) {
        callMSGraph(graphConfig.graphMeEndpoint, tokenResponse.accessToken, graphAPICallback);
    }).catch(function (error) {
        console.log(error);
        // Upon acquireTokenSilent failure (due to consent or interaction or login required ONLY)
        // Call acquireTokenPopup(popup window)
        if (requiresInteraction(error.errorCode)) {
            myMSALObj.acquireTokenPopup(requestObj).then(function (tokenResponse) {
                callMSGraph(graphConfig.graphMeEndpoint, tokenResponse.accessToken, graphAPICallback);
            }).catch(function (error) {
                console.log(error);
            });
        }
    });
}


function graphAPICallback(data) {
    document.getElementById("json").innerHTML = JSON.stringify(data, null, 2);
}


function showWelcomeMessage() {
    var divWelcome = document.getElementById('WelcomeMessage');
    divWelcome.innerHTML = 'Welcome ' + myMSALObj.getAccount().userName + "to Microsoft Graph API";
    var loginbutton = document.getElementById('SignIn');
    loginbutton.innerHTML = 'Sign Out';
    loginbutton.setAttribute('onclick', 'signOut();');
}


//This function can be removed if you do not need to support IE
function acquireTokenRedirectAndCallMSGraph() {
     //Always start with acquireTokenSilent to obtain a token in the signed in user from cache
     myMSALObj.acquireTokenSilent(requestObj).then(function (tokenResponse) {
         callMSGraph(graphConfig.graphMeEndpoint, tokenResponse.accessToken, graphAPICallback);
     }).catch(function (error) {
         console.log(error);
         // Upon acquireTokenSilent failure (due to consent or interaction or login required ONLY)
         // Call acquireTokenRedirect
         if (requiresInteraction(error.errorCode)) {
             myMSALObj.acquireTokenRedirect(requestObj);
         }
     });
 }


function authRedirectCallBack(error, response) {
    if (error) {
        console.log(error);
    }
    else {
        if (response.tokenType === "access_token") {
            callMSGraph(graphConfig.graphEndpoint, response.accessToken, graphAPICallback);
        } else {
            console.log("token type is:" + response.tokenType);
        }
    }
}

function requiresInteraction(errorCode) {
    if (!errorCode || !errorCode.length) {
        return false;
    }
    return errorCode === "consent_required" ||
        errorCode === "interaction_required" ||
        errorCode === "login_required";
}

// Browser check variables
var ua = window.navigator.userAgent;
var msie = ua.indexOf('MSIE ');
var msie11 = ua.indexOf('Trident/');
var msedge = ua.indexOf('Edge/');
var isIE = msie > 0 || msie11 > 0;
var isEdge = msedge > 0;
//If you support IE, our recommendation is that you sign-in using Redirect APIs
//If you as a developer are testing using Edge InPrivate mode, please add "isEdge" to the if check
// can change this to default an experience outside browser use
var loginType = isIE ? "REDIRECT" : "POPUP";

if (loginType === 'POPUP') {
    if (myMSALObj.getAccount()) {// avoid duplicate code execution on page load in case of iframe and popup window.
        showWelcomeMessage();
        acquireTokenPopupAndCallMSGraph();
    }
}
else if (loginType === 'REDIRECT') {
    document.getElementById("SignIn").onclick = function () {
        myMSALObj.loginRedirect(requestObj);
    };
    if (myMSALObj.getAccount() && !myMSALObj.isCallback(window.location.hash)) {// avoid duplicate code execution on page load in case of iframe and popup window.
        showWelcomeMessage();
        acquireTokenRedirectAndCallMSGraph();
    }
} else {
    console.error('Please set a valid login type');
}

/**
 * Sign out the user
 */
function signOut() {
    myMSALObj.logout();
}
