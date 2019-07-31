// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const automl = require('@google-cloud/automl');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  const client = new automl.v1beta1.PredictionServiceClient();

  const projectId='sbedford-datacomp2019';
  const computeRegion= 'us-central1';
  const modelId='TBL6785121439377784832';

  const modelFullId = client.modelPath(projectId, computeRegion, modelId);
  
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  function predictDuration(agent){
    const age = agent.parameters.age.amount;
    const maritalstatus = agent.parameters.maritalstatus;
    const education = agent.parameters.education;
    const job = agent.parameters.job;
    
    const request = {
      name : modelFullId,
      payload : {
      row: {
          values : [ 
            { stringValue: job } , 
            { stringValue: age }, 
            { stringValue: maritalstatus }, 
            { stringValue: education } 
          ],
          columnSpecIds: [
            "706915607915790336",
            "3012758617129484288",
            "6183292754798313472",
            "3877449745584619520"
          ]
      }
    }
  };
    
  return client
    .predict(request)
    .then(responses => {

      if (responses[0].payload.length > 0) {
        
        var response = responses[0].payload[0];
        
        agent.add(`Duration is: ${response.tables.value.numberValue}`);
      }
    });
    
  }
  
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Predict Duration', predictDuration);
  agent.handleRequest(intentMap);
});
