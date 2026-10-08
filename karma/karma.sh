#!/bin/bash
export NVM_DIR="/usr/local/nvm"  
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20
export CHROME_BIN=/usr/bin/chromium
if [ ! -d "/home/coder/project/workspace/angularapp" ]
then
    cp -r /home/coder/project/workspace/karma/angularapp /home/coder/project/workspace/;
fi

if [ -d "/home/coder/project/workspace/angularapp" ]
then
    echo "project folder present"
    cp /home/coder/project/workspace/karma/karma.conf.js /home/coder/project/workspace/angularapp/karma.conf.js;

    # checking for architect-inquiry.model.spec.ts
    if [ -e "/home/coder/project/workspace/angularapp/src/app/models/architect-inquiry.model.ts" ]
    then
        cp /home/coder/project/workspace/karma/architect-inquiry.model.spec.ts /home/coder/project/workspace/angularapp/src/app/models/architect-inquiry.model.spec.ts;
    else
        echo "frontend_Architect_Inquiry_model_should_create_an_instance FAILED";
    fi

    # checking for architect.model.spec.ts
    if [ -e "/home/coder/project/workspace/angularapp/src/app/models/architect.model.ts" ]
    then
        cp /home/coder/project/workspace/karma/architect.model.spec.ts /home/coder/project/workspace/angularapp/src/app/models/architect.model.spec.ts;
    else
        echo "frontend_Architect_model_should_create_an_instance FAILED";
    fi

    # checking for feedback.model.spec.ts
    if [ -e "/home/coder/project/workspace/angularapp/src/app/models/feedback.model.ts" ]
    then
        cp /home/coder/project/workspace/karma/feedback.model.spec.ts /home/coder/project/workspace/angularapp/src/app/models/feedback.model.spec.ts;
    else
        echo "frontend_Feedback_model_should_create_an_instance FAILED";
    fi

    # checking for login.model.spec.ts
    if [ -e "/home/coder/project/workspace/angularapp/src/app/models/login.model.ts" ]
    then
        cp /home/coder/project/workspace/karma/login.model.spec.ts /home/coder/project/workspace/angularapp/src/app/models/login.model.spec.ts;
    else
        echo "frontend_Login_model_should_create_an_instance FAILED";
    fi

    # checking for user.model.spec.ts
    if [ -e "/home/coder/project/workspace/angularapp/src/app/models/user.model.ts" ]
    then
        cp /home/coder/project/workspace/karma/user.model.spec.ts /home/coder/project/workspace/angularapp/src/app/models/user.model.spec.ts;
    else
        echo "frontend_User_model_should_create_an_instance FAILED";
    fi

    # checking for architect-inquiry.service.spec.ts
    if [ -e "/home/coder/project/workspace/angularapp/src/app/services/architect-inquery.service.ts" ]
    then
        cp /home/coder/project/workspace/karma/architect-inquery.service.spec.ts /home/coder/project/workspace/angularapp/src/app/services/architect-inquery.service.spec.ts;
    else
        echo "frontend_should_create_architect_inquiry_service FAILED";
    fi

    # checking for architect.service.spec.ts
    if [ -e "/home/coder/project/workspace/angularapp/src/app/services/architect.service.ts" ]
    then
        cp /home/coder/project/workspace/karma/architect.service.spec.ts /home/coder/project/workspace/angularapp/src/app/services/architect.service.spec.ts;
    else
        echo "frontend_should_create_architect_service FAILED";
    fi

    # checking for auth.service.spec.ts
    if [ -e "/home/coder/project/workspace/angularapp/src/app/services/auth.service.ts" ]
    then
        cp /home/coder/project/workspace/karma/auth.service.spec.ts /home/coder/project/workspace/angularapp/src/app/services/auth.service.spec.ts;
    else
        echo "frontend_should_create_auth_service FAILED";
    fi

    # checking for feedback.service.spec.ts
    if [ -e "/home/coder/project/workspace/angularapp/src/app/services/feedback.service.ts" ]
    then
        cp /home/coder/project/workspace/karma/feedback.service.spec.ts /home/coder/project/workspace/angularapp/src/app/services/feedback.service.spec.ts;
    else
        echo "frontend_should_create_feedback_service FAILED";
    fi

    if [ -d "/home/coder/project/workspace/angularapp/node_modules" ]; 
    then
        cd /home/coder/project/workspace/angularapp/
        npm test;
    else
        cd /home/coder/project/workspace/angularapp/
        yes | npm install
        npm test
    fi 
else   
    echo "frontend_Architect_Inquiry_model_should_create_an_instance FAILED";
    echo "frontend_Architect_model_should_create_an_instance FAILED";
    echo "frontend_Feedback_model_should_create_an_instance FAILED";
    echo "frontend_Login_model_should_create_an_instance FAILED";
    echo "frontend_User_model_should_create_an_instance FAILED";
    echo "frontend_should_create_architect_inquiry_service FAILED";
    echo "frontend_should_create_architect_service FAILED";
    echo "frontend_should_create_auth_service FAILED";
    echo "frontend_should_create_feedback_service FAILED";
fi